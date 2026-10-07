import os
from datetime import timedelta
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Base de datos
DB_PATH = os.path.join(BASE_DIR, os.getenv("DB_NAME", "database.db"))

# Carpetas de uploads (configurables por entorno; los tests usan carpetas temporales)
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER") or os.path.join(BASE_DIR, "uploads")
UPLOAD_EJEMPLOS_FOLDER = os.getenv("UPLOAD_EJEMPLOS_FOLDER") or os.path.join(BASE_DIR, "uploads_ejemplos")

# Extensiones permitidas para tesinas
ALLOWED_EXTENSIONS = {'pdf', 'docx'}  # .doc (Word 97-2003) no se puede leer con python-docx

# Entorno: Render define automáticamente la variable RENDER=true
EN_PRODUCCION = os.getenv("RENDER") == "true"

# Configuración de JWT
# En producción la clave es obligatoria: si faltara, cualquiera que conozca
# la clave por defecto podría firmar tokens válidos y hacerse pasar por admin.
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    if EN_PRODUCCION:
        raise RuntimeError("Falta la variable de entorno JWT_SECRET_KEY")
    JWT_SECRET_KEY = "clave-solo-para-desarrollo-local"
    print("⚠️  JWT_SECRET_KEY no definida: se usa una clave de desarrollo (no usar en producción)")

JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 3600)))  # 1 hora
JWT_REFRESH_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 2592000)))  # 30 días
JWT_ALGORITHM = "HS256"

# Configuración de Flask (la app no usa sesiones de Flask; se reutiliza la clave JWT)
SECRET_KEY = os.getenv("SECRET_KEY") or JWT_SECRET_KEY

# API de GROQ
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Usuarios iniciales
# Las contraseñas no se escriben en el código (el repositorio es público):
# se leen del entorno. Si una variable no está definida, esa cuenta no se crea.
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL") or "admin@admin.com"
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
DEMO_TUTOR_PASSWORD = os.getenv("DEMO_TUTOR_PASSWORD")
DEMO_ALUMNO_PASSWORD = os.getenv("DEMO_ALUMNO_PASSWORD")

def allowed_file(filename):
    """Verifica si la extensión del archivo es válida"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS