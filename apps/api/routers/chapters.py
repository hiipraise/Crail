from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId

from database import get_db
from utils.auth import get_current_user, get_optional_user
from utils.serializers import serialize_doc, serialize_list, paginate

router = APIRouter()


class ChapterCreate(BaseModel):
    number: int
    title: str
    content: str = ""
    author_note: str = ""


class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    author_note: Optional[str] = None
    word_count: Optional[int] = None


class ScheduleRequest(BaseModel):
    scheduledAt: str


def _try_oid(val: str):
    """Return ObjectId if val is a valid 24-char hex, else None."""
    try:
        return ObjectId(val)
    except Exception:
        return None


async def _resolve_story(db, story_id: str):
    """
    Find a story by either its MongoDB ObjectId string OR its slug.
    Returns the story doc or None.
    """
    oid = _try_oid(story_id)
    if oid:
        story = await db.stories.find_one({"_id": oid})
        if story:
            return story
    # Fallback: treat as slug
    return await db.stories.find_one({"slug": story_id})


@router.get("")
async def list_chapters(story_id: str, current_user=Depends(get_optional_user)):
    db = get_db()
    story = await _resolve_story(db, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    # Always query chapters by the canonical _id string
    canonical_id = str(story["_id"])
    query = {"story_id": canonical_id}
    if not current_user or str(current_user["_id"]) != story.get("author_id"):
        query["is_published"] = True

    chapters = await db.chapters.find(query).sort("number", 1).to_list(500)
    return paginate(serialize_list(chapters), len(chapters), 1, 500)


@router.get("/{chapter_id}")
async def get_chapter(story_id: str, chapter_id: str, current_user=Depends(get_optional_user)):
    db = get_db()
    story = await _resolve_story(db, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    canonical_id = str(story["_id"])
    oid = _try_oid(chapter_id)
    if not oid:
        raise HTTPException(status_code=400, detail="Invalid chapter id")

    chapter = await db.chapters.find_one({"_id": oid, "story_id": canonical_id})
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    is_author = current_user and str(current_user["_id"]) == story.get("author_id")
    if not chapter.get("is_published") and not is_author:
        raise HTTPException(status_code=403, detail="Chapter not yet published")

    # prev/next
    all_chapters = await db.chapters.find(
        {"story_id": canonical_id, "is_published": True}
    ).sort("number", 1).to_list(500)

    ch_ids = [str(c["_id"]) for c in all_chapters]
    idx = next((i for i, c in enumerate(all_chapters) if str(c["_id"]) == chapter_id), -1)

    result = serialize_doc(chapter)
    result["previousChapter"] = ch_ids[idx - 1] if idx > 0 else None
    result["nextChapter"] = ch_ids[idx + 1] if idx < len(ch_ids) - 1 else None
    return result


@router.post("", status_code=201)
async def create_chapter(story_id: str, body: ChapterCreate, current_user=Depends(get_current_user)):
    db = get_db()
    story = await _resolve_story(db, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    if str(story["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your story")

    canonical_id = str(story["_id"])
    word_count = len(body.content.split()) if body.content else 0

    doc = {
        "story_id": canonical_id,
        "number": body.number,
        "title": body.title,
        "content": body.content,
        "word_count": word_count,
        "author_note": body.author_note,
        "is_published": False,
        "scheduled_at": None,
        "published_at": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    result = await db.chapters.insert_one(doc)
    doc["_id"] = result.inserted_id

    await db.stories.update_one(
        {"_id": story["_id"]},
        {"$inc": {"chapter_count": 1, "word_count": word_count},
         "$set": {"updated_at": datetime.utcnow().isoformat()}}
    )
    await _save_version(db, canonical_id, str(result.inserted_id), body.content, body.title, str(current_user["_id"]))
    return serialize_doc(doc)


@router.patch("/{chapter_id}")
async def update_chapter(
    story_id: str, chapter_id: str, body: ChapterUpdate, current_user=Depends(get_current_user)
):
    db = get_db()
    story = await _resolve_story(db, story_id)
    if not story or str(story["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    canonical_id = str(story["_id"])
    oid = _try_oid(chapter_id)
    if not oid:
        raise HTTPException(status_code=400, detail="Invalid chapter id")

    chapter = await db.chapters.find_one({"_id": oid, "story_id": canonical_id})
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    updates = {"updated_at": datetime.utcnow().isoformat()}
    if body.title is not None:
        updates["title"] = body.title
    if body.content is not None:
        updates["content"] = body.content
        old_wc = chapter.get("word_count", 0)
        new_wc = len(body.content.split())
        updates["word_count"] = new_wc
        await db.stories.update_one(
            {"_id": story["_id"]},
            {"$inc": {"word_count": new_wc - old_wc}, "$set": {"updated_at": updates["updated_at"]}}
        )
        await _save_version(db, canonical_id, chapter_id, body.content, body.title or chapter["title"], str(current_user["_id"]))
    if body.author_note is not None:
        updates["author_note"] = body.author_note
    if body.word_count is not None and body.content is None:
        updates["word_count"] = body.word_count

    await db.chapters.update_one({"_id": oid}, {"$set": updates})
    updated = await db.chapters.find_one({"_id": oid})
    return serialize_doc(updated)


@router.post("/{chapter_id}/publish")
async def publish_chapter(story_id: str, chapter_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    story = await _resolve_story(db, story_id)
    if not story or str(story["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    oid = _try_oid(chapter_id)
    if not oid:
        raise HTTPException(status_code=400, detail="Invalid chapter id")

    now = datetime.utcnow().isoformat()
    await db.chapters.update_one(
        {"_id": oid},
        {"$set": {"is_published": True, "published_at": now, "updated_at": now}}
    )
    await db.stories.update_one(
        {"_id": story["_id"]},
        {"$set": {"is_published": True, "last_chapter_at": now, "status": "ongoing"}}
    )
    return {"published": True, "publishedAt": now}


@router.post("/{chapter_id}/schedule")
async def schedule_chapter(
    story_id: str, chapter_id: str, body: ScheduleRequest, current_user=Depends(get_current_user)
):
    db = get_db()
    story = await _resolve_story(db, story_id)
    if not story or str(story["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    oid = _try_oid(chapter_id)
    if not oid:
        raise HTTPException(status_code=400, detail="Invalid chapter id")

    await db.chapters.update_one({"_id": oid}, {"$set": {"scheduled_at": body.scheduledAt}})
    return {"scheduled": True, "scheduledAt": body.scheduledAt}


@router.get("/{chapter_id}/versions")
async def get_versions(story_id: str, chapter_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    versions = await db.versions.find(
        {"chapter_id": chapter_id}
    ).sort("version_number", -1).limit(50).to_list(50)
    return {"items": serialize_list(versions)}


@router.post("/{chapter_id}/versions/{version_id}/restore")
async def restore_version(
    story_id: str, chapter_id: str, version_id: str, current_user=Depends(get_current_user)
):
    db = get_db()
    oid = _try_oid(version_id)
    if not oid:
        raise HTTPException(status_code=400, detail="Invalid version id")

    version = await db.versions.find_one({"_id": oid})
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    chap_oid = _try_oid(chapter_id)
    if chap_oid:
        await db.chapters.update_one(
            {"_id": chap_oid},
            {"$set": {"content": version["content"], "title": version["title"],
                       "updated_at": datetime.utcnow().isoformat()}}
        )
    return {"restored": True}


async def _save_version(db, story_id: str, chapter_id: str, content: str, title: str, user_id: str):
    count = await db.versions.count_documents({"chapter_id": chapter_id})
    await db.versions.insert_one({
        "chapter_id": chapter_id,
        "story_id": story_id,
        "version_number": count + 1,
        "title": title,
        "content": content,
        "word_count": len(content.split()),
        "created_by": user_id,
        "created_at": datetime.utcnow().isoformat(),
    })