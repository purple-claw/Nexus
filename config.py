import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-prod'
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    # SQLite database stored in the instance folder
    DATABASE = os.path.join(BASE_DIR, 'instance', 'app.db')
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload
