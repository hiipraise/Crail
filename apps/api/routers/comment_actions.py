"""
Standalone comment actions router.
Mounted at /comments — handles per-comment actions (like, delete)
that don't require a story_id prefix.
"""
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from database import get_db
from utils.auth import get_current_user

router = APIRouter()


@router.post("/{comment_id}/like")
async def like_comment(comment_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    uid = str(current_user["_id"])
    liked_by = comment.get("liked_by", [])

    if uid in liked_by:
        await db.comments.update_one(
            {"_id": ObjectId(comment_id)},
            {"$inc": {"like_count": -1}, "$pull": {"liked_by": uid}}
        )
        return {"liked": False}
    else:
        await db.comments.update_one(
            {"_id": ObjectId(comment_id)},
            {"$inc": {"like_count": 1}, "$addToSet": {"liked_by": uid}}
        )
        return {"liked": True}


@router.delete("/{comment_id}", status_code=204)
async def delete_comment(comment_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if str(comment["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your comment")

    await db.comments.delete_one({"_id": ObjectId(comment_id)})
    # Remove replies
    await db.comments.delete_many({"parent_id": comment_id})
    # Decrement story comment count
    await db.stories.update_one(
        {"_id": ObjectId(comment["story_id"])},
        {"$inc": {"comment_count": -1}}
    )
    return None
