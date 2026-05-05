import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
import config

def generate_access_token(user_id, user_role):
    """
    Genera un token de acceso JWT
    """
    payload = {
        'user_id': user_id,
        'role': user_role,
        'exp': datetime.utcnow() + config.JWT_ACCESS_TOKEN_EXPIRES,
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)


def generate_refresh_token(user_id):
    """
    Genera un token de refresco JWT
    """
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + config.JWT_REFRESH_TOKEN_EXPIRES,
        'iat': datetime.utcnow(),
        'type': 'refresh'
    }
    
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)


def decode_token(token):
    """
    Decodifica y valida un token JWT
    """
    try:
        payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token expirado
    except jwt.InvalidTokenError:
        return None  # Token inválido


def token_required(f):
    """
    Decorador para proteger rutas que requieren autenticación
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Obtener token del header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # "Bearer TOKEN"
            except IndexError:
                return jsonify({'error': 'Token mal formado'}), 401
        
        if not token:
            return jsonify({'error': 'Token faltante'}), 401
        
        # Decodificar token
        payload = decode_token(token)
        
        if not payload:
            return jsonify({'error': 'Token inválido o expirado'}), 401
        
        if payload.get('type') != 'access':
            return jsonify({'error': 'Tipo de token inválido'}), 401
        
        # Agregar información del usuario al request
        request.current_user = {
            'user_id': payload['user_id'],
            'role': payload['role']
        }
        
        return f(*args, **kwargs)
    
    return decorated


def admin_required(f):
    """
    Decorador para rutas que solo puede acceder un administrador
    """
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.current_user['role'] != 'admin':
            return jsonify({'error': 'Acceso denegado. Se requiere rol de administrador'}), 403
        
        return f(*args, **kwargs)
    
    return decorated


def tutor_required(f):
    """
    Decorador para rutas que solo puede acceder un tutor
    """
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.current_user['role'] not in ['tutor', 'admin']:
            return jsonify({'error': 'Acceso denegado. Se requiere rol de tutor'}), 403
        
        return f(*args, **kwargs)
    
    return decorated


def alumno_required(f):
    """
    Decorador para rutas que solo puede acceder un alumno
    """
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.current_user['role'] not in ['alumno', 'admin']:
            return jsonify({'error': 'Acceso denegado. Se requiere rol de alumno'}), 403
        
        return f(*args, **kwargs)
    
    return decorated