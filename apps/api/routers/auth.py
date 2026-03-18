from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from bson import ObjectId
from database import get_db
from utils.auth import hash_password, verify_password, create_token, decode_token
from utils.serializers import serialize_doc

router = APIRouter()


class LoginRequest(BaseModel):
    identifier: str  # username or email
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    displayName: str

    @validator("username")
    def username_valid(cls, v):
        if not v.replace("_", "").isalnum():
            raise ValueError("Username: letters, numbers and underscores only")
        if len(v) < 3 or len(v) > 30:
            raise ValueError("Username must be 3–30 characters")
        return v.lower()

    @validator("password")
    def password_strong(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


def user_response(user: dict, token: str) -> dict:
    u = serialize_doc(user)
    u.pop("password_hash", None)
    return {"user": u, "token": token}


@router.post("/login")
async def login(body: LoginRequest):
    db = get_db()
    # Find by username or email
    user = await db.users.find_one({
        "$or": [
            {"username": body.identifier.lower()},
            {"email": body.identifier.lower()}
        ]
    })
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_token(str(user["_id"]))
    return user_response(user, token)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    db = get_db()

    # Check uniqueness
    existing = await db.users.find_one({
        "$or": [{"username": body.username}, {"email": body.email.lower()}]
    })
    if existing:
        field = "username" if existing.get("username") == body.username else "email"
        raise HTTPException(status_code=409, detail=f"This {field} is already taken")

    user_doc = {
        "username": body.username,
        "email": body.email.lower(),
        "displayName": body.displayName,
        "password_hash": hash_password(body.password),
        "avatar": None,
        "bio": None,
        "followersCount": 0,
        "followingCount": 0,
        "storiesCount": 0,
        "joinedAt": datetime.utcnow().isoformat(),
        "isVerified": False,
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_token(str(result.inserted_id))
    return user_response(user_doc, token)


@router.post("/refresh")
async def refresh(request: Request):
    body = await request.json()
    token = body.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token required")

    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_token = create_token(user_id)
    return user_response(user, new_token)


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    db = get_db()
    user = await db.users.find_one({"email": body.email.lower()})
    # Always return 200 to prevent email enumeration
    if user:
        reset_token = create_token(str(user["_id"]))
        # In production: send email with reset link
        # For now: store token in DB with expiry
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"reset_token": reset_token}}
        )
    return {"message": "If that email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    user_id = decode_token(body.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id), "reset_token": body.token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": hash_password(body.password)}, "$unset": {"reset_token": ""}}
    )
    return {"message": "Password updated successfully"}
