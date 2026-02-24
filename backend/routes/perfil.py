from flask import Blueprint, request, jsonify
from utils.db_utils import get_db
from utils.auth_utils import hash_password, verify_password
from utils.jwt_utils import token_required

perfil_bp = Blueprint('perfil', __name__)

# =========================
# Actualizar nombre
# =========================
@perfil_bp.route("/perfil", methods=["PUT"])
@token_required
def actualizar_perfil():
    try:
        data = request.get_json()
        nombre = data.get('nombre', '').strip()
        user_id = request.current_user['user_id']

        if not nombre:
            return jsonify({"error": "El nombre no puede estar vacío"}), 400

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE usuarios
                SET nombre = ?
                WHERE id = ?
            """, (nombre, user_id))
            conn.commit()

        return jsonify({"message": "Perfil actualizado correctamente"})

    except Exception as e:
        return jsonify({"error": f"Error al actualizar perfil: {str(e)}"}), 500


# =========================
# Cambiar contraseña propia
# =========================
@perfil_bp.route("/perfil/password", methods=["PUT"])
@token_required
def cambiar_password():
    try:
        data = request.get_json()
        password_actual = data.get('password_actual', '')
        password_nueva = data.get('password_nueva', '')
        user_id = request.current_user['user_id']

        if not password_actual or not password_nueva:
            return jsonify({"error": "Faltan campos obligatorios"}), 400

        if len(password_nueva) < 6:
            return jsonify({
                "error": "La nueva contraseña debe tener al menos 6 caracteres"
            }), 400

        with get_db() as conn:
            cursor = conn.cursor()

            # Verificar contraseña actual
            cursor.execute("""
                SELECT password FROM usuarios WHERE id = ?
            """, (user_id,))
            row = cursor.fetchone()

            if not row:
                return jsonify({"error": "Usuario no encontrado"}), 404

            if not verify_password(password_actual, row['password']):
                return jsonify({"error": "La contraseña actual es incorrecta"}), 400

            # Actualizar contraseña
            nueva_hash = hash_password(password_nueva)
            cursor.execute("""
                UPDATE usuarios
                SET password = ?
                WHERE id = ?
            """, (nueva_hash, user_id))
            conn.commit()

        return jsonify({"message": "Contraseña actualizada correctamente"})

    except Exception as e:
        return jsonify({"error": f"Error al cambiar contraseña: {str(e)}"}), 500