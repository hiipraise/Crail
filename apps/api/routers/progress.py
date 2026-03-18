from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import get_db
from utils.auth import get_current_user
from utils.serializers import serialize_doc

router = APIRouter()


class ProgressUpdate(BaseModel):
    chapterId: str
    chapterNumber: int
    pageNumber: int
    progress: float


@router.get("/{story_id}")
async def get_progress(story_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    prog = await db.progress.find_one({
        "user_id": str(current_user["_id"]),
        "story_id": story_id
    })
    return serialize_doc(prog) if prog else {}


@router.put("/{story_id}")
async def update_progress(story_id: str, body: ProgressUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    uid = str(current_user["_id"])
    now = datetime.utcnow().isoformat()

    await db.progress.update_one(
        {"user_id": uid, "story_id": story_id},
        {"$set": {
            "user_id": uid,
            "story_id": story_id,
            "chapter_id": body.chapterId,
            "chapter_number": body.chapterNumber,
            "page_number": body.pageNumber,
            "progress": body.progress,
            "last_read_at": now,
        }},
        upsert=True
    )

    # Record analytics (page heatmap)
    await db.analytics.update_one(
        {"story_id": story_id},
        {"$inc": {f"page_views.{body.pageNumber}": 1}},
        upsert=True
    )

    return {"saved": True}
