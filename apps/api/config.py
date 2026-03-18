from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "crail"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-70b-8192"

    POLLINATIONS_BASE: str = "https://image.pollinations.ai/prompt"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
