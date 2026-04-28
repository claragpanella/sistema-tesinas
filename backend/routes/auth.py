from flask import Blueprint, request, jsonify
from utils.db_utils import get_db
from utils.auth_utils import verify_password, hash_password
from utils.jwt_utils import (
    generate_access_token,
    generate_refresh_token,
    decode_token,
    token_required
)

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Endpoint de login que retorna tokens JWT
    """
    try:
        data = request.json

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Faltan datos"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT id, nombre, email, rol, activo, password
                FROM usuarios
                WHERE email = ?
            """, (email,))

            user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Credenciales inválidas"}), 401

        # Verificar contraseña
        if not verify_password(password, user["password"]):
            return jsonify({"error": "Credenciales inválidas"}), 401

        # ← VALIDACIÓN: Verificar que el usuario esté activo
        if user["activo"] == 0:
            return jsonify({
                "error": "Tu cuenta está inactiva. Contactá al administrador para activarla."
            }), 403

        # Generar tokens
        access_token = generate_access_token(user["id"], user["rol"])
        refresh_token = generate_refresh_token(user["id"])

        return jsonify({
            "message": "Login exitoso",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user["id"],
                "nombre": user["nombre"],
                "email": user["email"],
                "rol": user["rol"]
            }
        })
    
    except Exception as e:
        return jsonify({"error": f"Error en el login: {str(e)}"}), 500


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    """
    Endpoint para refrescar el access token usando el refresh token
    """
    try:
        data = request.json
        refresh_token = data.get("refresh_token")

        if not refresh_token:
            return jsonify({"error": "Refresh token faltante"}), 400

        # Decodificar refresh token
        payload = decode_token(refresh_token)

        if not payload:
            return jsonify({"error": "Refresh token inválido o expirado"}), 401

        if payload.get('type') != 'refresh':
            return jsonify({"error": "Tipo de token inválido"}), 401

        user_id = payload['user_id']

        # Obtener información actualizada del usuario
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT id, rol, activo
                FROM usuarios
                WHERE id = ?
            """, (user_id,))

            user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 404

        if user["activo"] == 0:
            return jsonify({"error": "Usuario inactivo"}), 403

        # Generar nuevo access token
        new_access_token = generate_access_token(user["id"], user["rol"])

        return jsonify({
            "access_token": new_access_token
        })
    
    except Exception as e:
        return jsonify({"error": f"Error al refrescar token: {str(e)}"}), 500


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    """
    Endpoint para obtener información del usuario actual
    Requiere autenticación con JWT
    """
    try:
        user_id = request.current_user['user_id']

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT id, nombre, email, rol, activo
                FROM usuarios
                WHERE id = ?
            """, (user_id,))

            user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 404

        return jsonify({
            "id": user["id"],
            "nombre": user["nombre"],
            "email": user["email"],
            "rol": user["rol"],
            "activo": bool(user["activo"])
        })
    
    except Exception as e:
        return jsonify({"error": f"Error al obtener usuario: {str(e)}"}), 500


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Endpoint de registro de nuevos usuarios
    Los usuarios se crean INACTIVOS y deben ser activados por un admin
    """
    try:
        data = request.get_json()
        nombre = data.get("nombre", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        rol = data.get("rol", "alumno")

        # Validaciones
        if not nombre or not email or not password:
            return jsonify({"error": "Faltan campos obligatorios"}), 400

        if len(password) < 6:
            return jsonify({
                "error": "La contraseña debe tener al menos 6 caracteres"
            }), 400

        if rol not in ["alumno", "tutor"]:
            return jsonify({"error": "Rol inválido"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            # Verificar que el email no exista
            cursor.execute("SELECT id FROM usuarios WHERE email = ?", (email,))
            if cursor.fetchone():
                return jsonify({"error": "El email ya está registrado"}), 400

            # Hashear contraseña
            hashed = hash_password(password)

            # Insertar usuario INACTIVO (activo = 0)
            cursor.execute("""
                INSERT INTO usuarios (nombre, email, password, rol, activo)
                VALUES (?, ?, ?, ?, 0)
            """, (nombre, email, hashed, rol))


        # NO generar tokens ni hacer login automático
        # El usuario debe esperar a ser activado por un admin
        
        return jsonify({
            "message": "Cuenta creada correctamente. Un administrador debe activar tu cuenta antes de que puedas iniciar sesión."
        }), 201

    except Exception as e:
        return jsonify({"error": f"Error al registrar usuario: {str(e)}"}), 500