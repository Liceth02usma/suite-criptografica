import os
from dotenv import load_dotenv

load_dotenv()


class DevConfig:
    DEBUG = True
    TESTING = False
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-inseguro")


class ProdConfig:
    DEBUG = False
    TESTING = False
    SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "CHANGE_IN_PRODUCTION")
