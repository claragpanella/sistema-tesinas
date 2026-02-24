from flask import Flask
from flask_cors import CORS
import os
import config

from database import init_db
from config import UPLOAD_FOLDER, UPLOAD_EJEMPLOS_FOLDER

from routes.tesinas import tesinas_bp
from routes.ejemplos import ejemplos_bp
from routes.files import files_bp
from routes.pautas import pautas_bp
from routes.tutores import tutores_bp
from routes.auth import auth_bp
from routes.admin_usuarios import admin_usuarios_bp
from routes.perfil import perfil_bp
from routes.chat import chat_bp

SEED_EJECUTADO = False

app = Flask(__name__)
app.config['SECRET_KEY'] = config.SECRET_KEY

# =========================
# CORS (SIN wildcard + credentials)
# =========================
CORS(
    app,
    origins=[
        "http://localhost:5173",
        "https://sistema-tesinas.vercel.app"
    ],
    supports_credentials=True
)

# =========================
# Inicializar base de datos
# =========================
init_db()

# =========================
# Auto-seed (admin + datos iniciales)
# =========================
try:
    from seed_admin import crear_admin
    from seed_data import seed_database
    from seed_pautas import seed_pautas
    from utils.db_utils import get_db

    # Evita doble ejecución en modo debug
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" and not SEED_EJECUTADO:
        print("🔄 Verificando base de datos...")

        crear_admin()

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) FROM usuarios WHERE rol != 'admin'")
            count_usuarios = cursor.fetchone()[0]

            if count_usuarios == 0:
                print("🌱 Cargando usuarios de prueba...")
                seed_database()

            cursor.execute("SELECT COUNT(*) FROM pautas")
            count_pautas = cursor.fetchone()[0]

            if count_pautas == 0:
                print("📚 Cargando pautas...")
                seed_pautas()

        SEED_EJECUTADO = True
        print("✅ Inicialización completada")

except Exception as e:
    print(f"⚠️ Error en inicialización: {e}")

# =========================
# Blueprints
# =========================
app.register_blueprint(tesinas_bp)
app.register_blueprint(ejemplos_bp)
app.register_blueprint(files_bp)
app.register_blueprint(pautas_bp, url_prefix="/pautas")
app.register_blueprint(tutores_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(admin_usuarios_bp)
app.register_blueprint(perfil_bp)
app.register_blueprint(chat_bp)

# =========================
# Ruta raíz
# =========================
@app.route("/")
def home():
    return {
        "message": "API de Sistema de Tesinas",
        "version": "1.0",
        "status": "online",
        "endpoints": {
            "auth": "/login, /register, /refresh",
            "tesinas": "/tesinas",
            "tutores": "/tutores",
            "admin": "/admin/*"
        }
    }

# =========================
# Run app
# =========================
if __name__ == "__main__":
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(UPLOAD_EJEMPLOS_FOLDER, exist_ok=True)

    app.run(
        debug=True,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000))
    )