import cloudinary
import cloudinary.uploader
from config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


async def upload_image(file_bytes: bytes, folder: str, public_id: str = None) -> dict:
    """Upload image to Cloudinary and return secure URL (never expose direct links)."""
    options = {
        "folder": f"crail/{folder}",
        "resource_type": "image",
        "transformation": [{"quality": "auto:eco", "fetch_format": "auto"}],
    }
    if public_id:
        options["public_id"] = public_id

    result = cloudinary.uploader.upload(file_bytes, **options)
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "width": result.get("width"),
        "height": result.get("height"),
    }


async def delete_image(public_id: str):
    cloudinary.uploader.destroy(public_id)
