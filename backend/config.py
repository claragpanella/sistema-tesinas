import os
from datetime import timedelta
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Base de datos
DB_PATH = os.path.join(BASE_DIR, os.getenv("DB_NAME", "database.db"))

# Carpetas de uploads
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
UPLOAD_EJEMPLOS_FOLDER = os.path.join(BASE_DIR, "uploads_ejemplos")

# Extensiones permitidas para tesinas
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc'}

# Configuración de Flask
SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key-change-in-production")
DEBUG = os.getenv("DEBUG", "True") == "True"

# Configuración de JWT
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-jwt-secret-key-change-in-production")
JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 3600)))  # 1 hora
JWT_REFRESH_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 2592000)))  # 30 días
JWT_ALGORITHM = "HS256"

# API de GEMINI 
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "") 
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

def allowed_file(filename):
    """Verifica si la extensión del archivo es válida"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS