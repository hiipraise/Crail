from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form
from typing import Optional
from bson import ObjectId
import re

from database import get_db
from utils.auth import get_current_user, get_optional_user
from utils.serializers import serialize_doc, serialize_list, paginate
from utils.media import upload_image

router = APIRouter()


def public_user(user: dict) -> dict:
    u = serialize_doc(user)
    u.pop("password_hash", None)
    u.pop("email", None)
    u.pop("reset_token", None)
    return u


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    u = serialize_doc(current_user)
    u.pop("password_hash", None)
    return u


@router.patch("/me")
async def update_me(
    displayName: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user),
):
    db = get_db()
    updates = {}
    if displayName:
        updates["displayName"] = displayName
    if bio is not None:
        updates["bio"] = bio
    if avatar:
        data = await avatar.read()
        result = await upload_image(data, "avatars", str(current_user["_id"]))
        updates["avatar"] = result["url"]

    if updates:
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": updates})

    updated = await db.users.find_one({"_id": current_user["_id"]})
    u = serialize_doc(updated)
    u.pop("password_hash", None)
    return u


# ── /search MUST come before /{username} ──────────────────────────────────────
# FastAPI matches routes in registration order. If /{username} is first,
# GET /users/search is captured as username="search" and never reaches here.
@router.get("/search")
async def search_users(q: str = "", limit: int = Query(5, ge=1, le=20)):
    """Search users by username or display name. Partial, case-insensitive."""
    if not q.strip():
        return {"items": []}
    db = get_db()
    pattern = re.compile(re.escape(q.strip()), re.IGNORECASE)
    users = await db.users.find({
        "$or": [
            {"username": {"$regex": pattern}},
            {"displayName": {"$regex": pattern}},
        ]
    }).limit(limit).to_list(limit)
    result = []
    for u in users:
        doc = serialize_doc(u)
        doc.pop("password_hash", None)
        doc.pop("email", None)
        result.append(doc)
    return {"items": result}


# ── Dynamic routes after all static ones ─────────────────────────────────────
@router.get("/{username}")
async def get_profile(username: str):
    db = get_db()
    user = await db.users.find_one({"username": username.lower()})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return public_user(user)


@router.get("/{username}/stories")
async def get_user_stories(
    username: str,
    page: int = 1,
    pageSize: int = 12,
    current_user=Depends(get_optional_user),
):
    db = get_db()
    user = await db.users.find_one({"username": username.lower()})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    is_own = current_user and str(current_user["_id"]) == str(user["_id"])
    query = {"author_id": str(user["_id"])}
    if not is_own:
        query["is_published"] = True

    total = await db.stories.count_documents(query)
    skip = (page - 1) * pageSize
    stories = await db.stories.find(query).sort("updated_at", -1).skip(skip).limit(pageSize).to_list(pageSize)

    result = []
    for s in stories:
        sd = serialize_doc(s)
        sd["author"] = public_user(user)
        result.append(sd)

    return paginate(result, total, page, pageSize)


@router.post("/{username}/follow")
async def follow_user(username: str, current_user=Depends(get_current_user)):
    db = get_db()
    target = await db.users.find_one({"username": username.lower()})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    uid = str(current_user["_id"])
    tid = str(target["_id"])

    if uid == tid:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    following = current_user.get("following", [])
    if tid in following:
        await db.users.update_one({"_id": current_user["_id"]}, {"$pull": {"following": tid}, "$inc": {"followingCount": -1}})
        await db.users.update_one({"_id": target["_id"]}, {"$pull": {"followers": uid}, "$inc": {"followersCount": -1}})
        return {"following": False}
    else:
        await db.users.update_one({"_id": current_user["_id"]}, {"$addToSet": {"following": tid}, "$inc": {"followingCount": 1}})
        await db.users.update_one({"_id": target["_id"]}, {"$addToSet": {"followers": uid}, "$inc": {"followersCount": 1}})
        return {"following": True}
        