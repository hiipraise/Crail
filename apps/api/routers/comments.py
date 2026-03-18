from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId

from database import get_db
from utils.auth import get_current_user, get_optional_user
from utils.serializers import serialize_doc, serialize_list, paginate

router = APIRouter()


class CommentCreate(BaseModel):
    content: str
    chapter_id: Optional[str] = None
    parent_id: Optional[str] = None


@router.get("")
async def list_comments(
    story_id: str,
    chapter_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    current_user=Depends(get_optional_user),
):
    db = get_db()
    query = {"story_id": story_id, "parent_id": None}
    if chapter_id:
        query["chapter_id"] = chapter_id

    total = await db.comments.count_documents(query)
    skip = (page - 1) * pageSize
    comments = await db.comments.find(query).sort("created_at", -1).skip(skip).limit(pageSize).to_list(pageSize)

    result = []
    for comment in comments:
        c = serialize_doc(comment)
        author = await db.users.find_one({"_id": ObjectId(comment["author_id"])})
        c["author"] = serialize_doc(author) if author else {}
        if c["author"]:
            c["author"].pop("password_hash", None)
        # Fetch replies
        replies = await db.comments.find({"parent_id": str(comment["_id"])}).sort("created_at", 1).to_list(20)
        rep_result = []
        for r in replies:
            rc = serialize_doc(r)
            ra = await db.users.find_one({"_id": ObjectId(r["author_id"])})
            rc["author"] = serialize_doc(ra) if ra else {}
            if rc["author"]:
                rc["author"].pop("password_hash", None)
            rep_result.append(rc)
        c["replies"] = rep_result
        result.append(c)

    return paginate(result, total, page, pageSize)


@router.post("", status_code=201)
async def create_comment(
    story_id: str, body: CommentCreate, current_user=Depends(get_current_user)
):
    db = get_db()
    doc = {
        "story_id": story_id,
        "chapter_id": body.chapter_id,
        "parent_id": body.parent_id,
        "author_id": str(current_user["_id"]),
        "content": body.content,
        "like_count": 0,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    result = await db.comments.insert_one(doc)
    doc["_id"] = result.inserted_id

    await db.stories.update_one(
        {"_id": ObjectId(story_id)}, {"$inc": {"comment_count": 1}}
    )

    c = serialize_doc(doc)
    c["author"] = serialize_doc(current_user)
    c["author"].pop("password_hash", None)
    return c
