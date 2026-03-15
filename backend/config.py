from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    mongodb_url: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    database_name: str = os.getenv("DATABASE_NAME", "campus_service_db")
    secret_key: str = os.getenv("SECRET_KEY", "campus_service_super_secret_key_2024_jwt")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    puter_api_key: str = os.getenv("PUTER_API_KEY", "your_puter_api_key_here")

    class Config:
        env_file = ".env"

settings = Settings()
