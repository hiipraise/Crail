from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from utils.auth import get_current_user
from utils.media import upload_image, delete_image

router = APIRouter()


@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    folder: str = "general",
    current_user=Depends(get_current_user),
):
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and GIF allowed")

    max_size = 10 * 1024 * 1024  # 10MB
    data = await file.read()
    if len(data) > max_size:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    result = await upload_image(data, folder)
    # Return backend URL (never direct Cloudinary URL)
    return {"url": result["url"], "width": result.get("width"), "height": result.get("height")}
