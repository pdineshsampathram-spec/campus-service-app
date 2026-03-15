from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "campus_service_db"
    secret_key: str = "campus_service_super_secret_key_2024_jwt"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    puter_api_key: str = "your_puter_api_key_here"

    class Config:
        env_file = ".env"

settings = Settings()
