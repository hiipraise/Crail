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


@router.get("")
async def list_chapters(story_id: str, current_user=Depends(get_optional_user)):
    db = get_db()
    story = await db.stories.find_one({"_id": ObjectId(story_id)})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    query = {"story_id": story_id}
    # Non-authors only see published chapters
    if not current_user or str(current_user["_id"]) != story.get("author_id"):
        query["is_published"] = True

    chapters = await db.chapters.find(query).sort("number", 1).to_list(500)
    return paginate(serialize_list(chapters), len(chapters), 1, 500)


@router.get("/{chapter_id}")
async def get_chapter(story_id: str, chapter_id: str, current_user=Depends(get_optional_user)):
    db = get_db()
    chapter = await db.chapters.find_one({
        "_id": ObjectId(chapter_id),
        "story_id": story_id
    })
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    story = await db.stories.find_one({"_id": ObjectId(story_id)})
    is_author = current_user and str(current_user["_id"]) == story.get("author_id")

    if not chapter.get("is_published") and not is_author:
        raise HTTPException(status_code=403, detail="Chapter not yet published")

    # Get prev/next
    all_chapters = await db.chapters.find(
        {"story_id": story_id, "is_published": True}
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
    story = await db.stories.find_one({"_id": ObjectId(story_id)})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    if str(story["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your story")

    word_count = len(body.content.split()) if body.content else 0

    doc = {
        "story_id": story_id,
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

    # Update story word count
    await db.stories.update_one(
        {"_id": ObjectId(story_id)},
        {"$inc": {"chapter_count": 1, "word_count": word_count},
         "$set": {"updated_at": datetime.utcnow().isoformat()}}
    )

    # Save version snapshot
    await _save_version(db, story_id, str(result.inserted_id), body.content, body.title, str(current_user["_id"]))

    return serialize_doc(doc)


@router.patch("/{chapter_id}")
async def update_chapter(
    story_id: str, chapter_id: str, body: ChapterUpdate, current_user=Depends(get_current_user)
):
    db = get_db()
    story = await db.stories.find_one({"_id": ObjectId(story_id)})
    if not story or str(story["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    chapter = await db.chapters.find_one({"_id": ObjectId(chapter_id), "story_id": story_id})
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
        # Update story total word count
        await db.stories.update_one(
            {"_id": ObjectId(story_id)},
            {"$inc": {"word_count": new_wc - old_wc}, "$set": {"updated_at": updates["updated_at"]}}
        )
        # Auto-save version every 10 updates (simplified)
        await _save_version(db, story_id, chapter_id, body.content, body.title or chapter["title"], str(current_user["_id"]))
    if body.author_note is not None:
        updates["author_note"] = body.author_note

    await db.chapters.update_one({"_id": ObjectId(chapter_id)}, {"$set": updates})
    updated = await db.chapters.find_one({"_id": ObjectId(chapter_id)})
    return serialize_doc(updated)


@router.post("/{chapter_id}/publish")
async def publish_chapter(story_id: str, chapter_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    story = await db.stories.find_one({"_id": ObjectId(story_id)})
    if not story or str(story["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    now = datetime.utcnow().isoformat()
    await db.chapters.update_one(
        {"_id": ObjectId(chapter_id)},
        {"$set": {"is_published": True, "published_at": now, "updated_at": now}}
    )
    await db.stories.update_one(
        {"_id": ObjectId(story_id)},
        {"$set": {"is_published": True, "last_chapter_at": now, "status": "ongoing"}}
    )
    return {"published": True, "publishedAt": now}


@router.post("/{chapter_id}/schedule")
async def schedule_chapter(
    story_id: str, chapter_id: str, body: ScheduleRequest, current_user=Depends(get_current_user)
):
    db = get_db()
    story = await db.stories.find_one({"_id": ObjectId(story_id)})
    if not story or str(story["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.chapters.update_one(
        {"_id": ObjectId(chapter_id)},
        {"$set": {"scheduled_at": body.scheduledAt}}
    )
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
    version = await db.versions.find_one({"_id": ObjectId(version_id)})
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    await db.chapters.update_one(
        {"_id": ObjectId(chapter_id)},
        {"$set": {"content": version["content"], "title": version["title"], "updated_at": datetime.utcnow().isoformat()}}
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
