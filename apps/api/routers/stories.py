from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form
from typing import Optional
from datetime import datetime
from bson import ObjectId
import math

from database import get_db
from utils.auth import get_current_user, get_optional_user
from utils.serializers import serialize_doc, serialize_list, paginate, slugify_text
from utils.media import upload_image

router = APIRouter()


def build_query(q: str = None, genre: str = None, status: str = None) -> dict:
    query = {}
    if q:
        query["$text"] = {"$search": q}
    if genre:
        query["genre"] = genre
    if status:
        query["status"] = status
    return query


def sort_key(sort: str) -> list:
    mapping = {
        "trending": [("score", -1), ("view_count", -1)],
        "popular": [("like_count", -1)],
        "newest": [("created_at", -1)],
        "completed": [("updated_at", -1)],
        "featured": [("is_featured", -1), ("view_count", -1)],
    }
    return mapping.get(sort, [("updated_at", -1)])


@router.get("")
async def list_stories(
    q: Optional[str] = None,
    genre: Optional[str] = None,
    sort: str = "newest",
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(12, ge=1, le=50),
    mine: bool = False,
    type: Optional[str] = None,
    current_user=Depends(get_optional_user),
):
    db = get_db()
    query = build_query(q, genre, status)

    if mine and current_user:
        query["author_id"] = str(current_user["_id"])

    if type == "bookmarks" and current_user:
        bookmarked_ids = current_user.get("bookmarked_stories", [])
        query["_id"] = {"$in": [ObjectId(sid) for sid in bookmarked_ids]}
    elif type == "reading" and current_user:
        progress_docs = await db.progress.find(
            {"user_id": str(current_user["_id"])}
        ).to_list(50)
        story_ids = [ObjectId(p["story_id"]) for p in progress_docs]
        query["_id"] = {"$in": story_ids}

    total = await db.stories.count_documents(query)
    skip = (page - 1) * pageSize

    cursor = db.stories.find(query).sort(sort_key(sort)).skip(skip).limit(pageSize)
    stories = await cursor.to_list(pageSize)

    # Populate author
    result = []
    for story in stories:
        author = await db.users.find_one({"_id": ObjectId(story["author_id"])})
        s = serialize_doc(story)
        s["author"] = serialize_doc(author) if author else {}
        if s["author"]:
            s["author"].pop("password_hash", None)
        result.append(s)

    return paginate(result, total, page, pageSize)


@router.get("/trending")
async def trending_stories():
    db = get_db()
    # Reddit-style scoring: score = likes / (age_hours + 2)^1.5
    stories = await db.stories.find({"is_published": True}).sort(
        [("trending_score", -1)]
    ).limit(20).to_list(20)

    result = []
    for story in stories:
        author = await db.users.find_one({"_id": ObjectId(story["author_id"])})
        s = serialize_doc(story)
        s["author"] = serialize_doc(author) if author else {}
        if s["author"]:
            s["author"].pop("password_hash", None)
        result.append(s)

    return paginate(result, len(result), 1, 20)


@router.get("/featured")
async def featured_stories():
    db = get_db()
    stories = await db.stories.find({"is_featured": True}).sort(
        [("updated_at", -1)]
    ).limit(12).to_list(12)

    result = []
    for story in stories:
        author = await db.users.find_one({"_id": ObjectId(story["author_id"])})
        s = serialize_doc(story)
        s["author"] = serialize_doc(author) if author else {}
        if s["author"]:
            s["author"].pop("password_hash", None)
        result.append(s)

    return paginate(result, len(result), 1, 12)


@router.get("/{slug}")
async def get_story(slug: str, current_user=Depends(get_optional_user)):
    db = get_db()
    story = await db.stories.find_one({"$or": [{"slug": slug}, {"_id": _safe_oid(slug)}]})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    # Increment view count
    await db.stories.update_one({"_id": story["_id"]}, {"$inc": {"view_count": 1}})

    author = await db.users.find_one({"_id": ObjectId(story["author_id"])})
    s = serialize_doc(story)
    s["author"] = serialize_doc(author) if author else {}
    if s["author"]:
        s["author"].pop("password_hash", None)
    s["view_count"] = story.get("view_count", 0) + 1
    return s


@router.post("", status_code=201)
async def create_story(
    title: str = Form(...),
    description: str = Form(...),
    summary: str = Form(""),
    genre: str = Form(""),
    tags: str = Form(""),
    content_rating: str = Form("everyone"),
    language: str = Form("en"),
    cover: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user),
):
    db = get_db()
    slug_base = slugify_text(title)
    slug = slug_base
    counter = 1
    while await db.stories.find_one({"slug": slug}):
        slug = f"{slug_base}-{counter}"
        counter += 1

    cover_url = None
    if cover:
        data = await cover.read()
        result = await upload_image(data, "covers", slug)
        cover_url = result["url"]

    story_doc = {
        "title": title,
        "slug": slug,
        "description": description,
        "summary": summary,
        "cover_image": cover_url,
        "author_id": str(current_user["_id"]),
        "genre": [g.strip() for g in genre.split(",") if g.strip()],
        "tags": [t.strip() for t in tags.split(",") if t.strip()],
        "status": "draft",
        "content_rating": content_rating,
        "language": language,
        "view_count": 0,
        "like_count": 0,
        "comment_count": 0,
        "bookmark_count": 0,
        "chapter_count": 0,
        "word_count": 0,
        "is_featured": False,
        "is_published": False,
        "trending_score": 0.0,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    result = await db.stories.insert_one(story_doc)
    story_doc["_id"] = result.inserted_id

    # Update author story count
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"storiesCount": 1}}
    )

    return serialize_doc(story_doc)


@router.patch("/{story_id}")
async def update_story(
    story_id: str,
    title: str = Form(None),
    description: str = Form(None),
    summary: str = Form(None),
    genre: str = Form(None),
    tags: str = Form(None),
    status: str = Form(None),
    content_rating: str = Form(None),
    cover: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user),
):
    db = get_db()
    story = await db.stories.find_one({"_id": ObjectId(story_id)})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    if str(story["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your story")

    updates = {"updated_at": datetime.utcnow().isoformat()}
    if title is not None:
        updates["title"] = title
    if description is not None:
        updates["description"] = description
    if summary is not None:
        updates["summary"] = summary
    if genre is not None:
        updates["genre"] = [g.strip() for g in genre.split(",") if g.strip()]
    if tags is not None:
        updates["tags"] = [t.strip() for t in tags.split(",") if t.strip()]
    if status is not None:
        updates["status"] = status
    if content_rating is not None:
        updates["content_rating"] = content_rating
    if cover:
        data = await cover.read()
        result = await upload_image(data, "covers", story_id)
        updates["cover_image"] = result["url"]

    await db.stories.update_one({"_id": ObjectId(story_id)}, {"$set": updates})
    updated = await db.stories.find_one({"_id": ObjectId(story_id)})
    return serialize_doc(updated)


@router.delete("/{story_id}", status_code=204)
async def delete_story(story_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    story = await db.stories.find_one({"_id": ObjectId(story_id)})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    if str(story["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your story")

    # Delete story, all chapters, progress, comments
    await db.stories.delete_one({"_id": ObjectId(story_id)})
    await db.chapters.delete_many({"story_id": story_id})
    await db.progress.delete_many({"story_id": story_id})
    await db.comments.delete_many({"story_id": story_id})
    await db.versions.delete_many({"story_id": story_id})
    await db.analytics.delete_many({"story_id": story_id})

    # Decrement author story count
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"storiesCount": -1}}
    )
    return None


@router.post("/{story_id}/like")
async def like_story(story_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    story = await db.stories.find_one({"_id": ObjectId(story_id)})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    liked_by = story.get("liked_by", [])
    uid = str(current_user["_id"])

    if uid in liked_by:
        await db.stories.update_one(
            {"_id": story["_id"]},
            {"$inc": {"like_count": -1}, "$pull": {"liked_by": uid}}
        )
        return {"liked": False}
    else:
        await db.stories.update_one(
            {"_id": story["_id"]},
            {"$inc": {"like_count": 1}, "$addToSet": {"liked_by": uid}}
        )
        return {"liked": True}


@router.post("/{story_id}/bookmark")
async def bookmark_story(story_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    uid = current_user["_id"]
    bookmarked = current_user.get("bookmarked_stories", [])

    if story_id in bookmarked:
        await db.users.update_one({"_id": uid}, {"$pull": {"bookmarked_stories": story_id}})
        await db.stories.update_one({"_id": ObjectId(story_id)}, {"$inc": {"bookmark_count": -1}})
        return {"bookmarked": False}
    else:
        await db.users.update_one({"_id": uid}, {"$addToSet": {"bookmarked_stories": story_id}})
        await db.stories.update_one({"_id": ObjectId(story_id)}, {"$inc": {"bookmark_count": 1}})
        return {"bookmarked": True}


@router.get("/{story_id}/analytics")
async def story_analytics(story_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    story = await db.stories.find_one({"_id": ObjectId(story_id)})
    if not story:
        raise HTTPException(status_code=404, detail="Not found")
    if str(story["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your story")

    analytics = await db.analytics.find_one({"story_id": story_id}) or {}
    return serialize_doc(analytics) if analytics else {"story_id": story_id, "totalViews": story.get("view_count", 0)}


def _safe_oid(val: str):
    try:
        return ObjectId(val)
    except Exception:
        return None
