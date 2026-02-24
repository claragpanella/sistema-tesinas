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

app = Flask(__name__)
app.config['SECRET_KEY'] = config.SECRET_KEY
CORS(app, origins=[
    "http://localhost:5173",
    "https://sistema-tesinas.vercel.app",  # ← Cambiar por tu URL real de Vercel
    "https://sistema-tesinas-*.vercel.app"  # ← Permite previews de Vercel
], supports_credentials=True)

# Inicializa la base de datos
init_db()

# =========================
# Blueprints
# =========================
app.register_blueprint(tesinas_bp)
app.register_blueprint(ejemplos_bp)
app.register_blueprint(files_bp)
app.register_blueprint(pautas_bp, url_prefix="/pautas")
app.register_blueprint(tutores_bp)
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(admin_usuarios_bp)
app.register_blueprint(perfil_bp)
app.register_blueprint(chat_bp)

if __name__ == "__main__":
    # Asegura que existan las carpetas de uploads
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(UPLOAD_EJEMPLOS_FOLDER, exist_ok=True)

    # Para desarrollo local
    if os.getenv('FLASK_ENV') == 'development':
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        # Para producción (Render, etc)
        app.run(debug=False, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
