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

# =========================
# CORS CONFIGURACIÓN MEJORADA
# =========================
# Obtener orígenes permitidos desde variable de entorno o usar por defecto
FRONTEND_URLS = os.getenv('FRONTEND_URLS', 'http://localhost:5173').split(',')

# Lista completa de orígenes permitidos
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

# Agregar URLs de producción desde variable de entorno
if os.getenv('FRONTEND_URLS'):
    allowed_origins.extend(FRONTEND_URLS)

# Agregar URLs específicas conocidas
allowed_origins.extend([
    "https://sistema-tesinas.vercel.app",
    "https://tesinas-frontend.vercel.app",  # Tu URL de Vercel
])

# CORS con configuración completa
CORS(app, 
    origins=allowed_origins,
    supports_credentials=True,
    allow_headers=['Content-Type', 'Authorization', 'X-User-Id'],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    expose_headers=['Content-Type', 'Authorization']
)

# =========================
# LOGGING EN PRODUCCIÓN
# =========================
if os.getenv('FLASK_ENV') != 'development':
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)
    logger.info(f"App iniciada con orígenes permitidos: {allowed_origins}")

# =========================
# HEALTH CHECK ENDPOINT
# =========================
@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint para verificar que el servidor está funcionando"""
    return {
        'status': 'ok',
        'message': 'API funcionando correctamente',
        'environment': os.getenv('FLASK_ENV', 'production')
    }, 200

@app.route('/', methods=['GET'])
def root():
    """Endpoint raíz"""
    return {
        'message': 'API de Tesinas',
        'version': '1.0',
        'endpoints': {
            'health': '/health',
            'auth': '/auth/login',
            'tesinas': '/tesinas',
            'tutores': '/tutores',
            'pautas': '/pautas'
        }
    }, 200

# =========================
# ERROR HANDLERS
# =========================
@app.errorhandler(404)
def not_found(error):
    return {'error': 'Endpoint no encontrado'}, 404

@app.errorhandler(500)
def internal_error(error):
    return {'error': 'Error interno del servidor'}, 500

@app.errorhandler(Exception)
def handle_exception(error):
    """Manejo global de excepciones"""
    if os.getenv('FLASK_ENV') != 'development':
        logger = logging.getLogger(__name__)
        logger.error(f"Error no manejado: {str(error)}")
    
    return {
        'error': 'Error en el servidor',
        'message': str(error) if os.getenv('FLASK_ENV') == 'development' else 'Error interno'
    }, 500

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
app.register_blueprint(auth_bp)
app.register_blueprint(admin_usuarios_bp)
app.register_blueprint(perfil_bp)
app.register_blueprint(chat_bp)

if __name__ == "__main__":
    # Asegura que existan las carpetas de uploads
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(UPLOAD_EJEMPLOS_FOLDER, exist_ok=True)

    # Puerto desde variable de entorno o 5000 por defecto
    port = int(os.getenv('PORT', 5000))
    
    # Para desarrollo local
    if os.getenv('FLASK_ENV') == 'development':
        app.run(debug=True, host='0.0.0.0', port=port)
    else:
        # Para producción (Render, etc)
        app.run(debug=False, host='0.0.0.0', port=port)