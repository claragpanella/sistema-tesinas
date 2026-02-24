from flask import Blueprint, jsonify, request
from utils.db_utils import get_db
from utils.jwt_utils import admin_required
from utils.auth_utils import hash_password
from utils.pagination_utils import create_pagination_response, get_pagination_params
from utils.filter_utils import get_filter_params, build_where_clause

admin_usuarios_bp = Blueprint("admin_usuarios", __name__)


# =========================
# LISTAR USUARIOS (SOLO ADMIN)
# =========================
@admin_usuarios_bp.route("/admin/usuarios", methods=["GET"])
@admin_required
def listar_usuarios():
    """
    Listar SOLO ALUMNOS con paginación y filtros
    """
    try:
        limit, offset = get_pagination_params()
        filters = get_filter_params()
        
        allowed_filters = {
            'search': ['nombre', 'email'],
            'activo': 'activo'
        }
        
        where_clause, params = build_where_clause(filters, allowed_filters)
        
        # ← CAMBIAR: Filtrar solo alumnos (no admins ni tutores)
        where_clause = f"rol = 'alumno' AND ({where_clause})"
        
        with get_db() as conn:
            cursor = conn.cursor()

            count_query = f"SELECT COUNT(*) FROM usuarios WHERE {where_clause}"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]

            query = f"""
                SELECT 
                    u.id, 
                    u.nombre, 
                    u.email, 
                    u.rol, 
                    u.activo,
                    (SELECT COUNT(*) FROM tesinas WHERE alumno_id = u.id) as total_tesinas
                FROM usuarios u
                WHERE {where_clause}
                ORDER BY u.nombre
                LIMIT ? OFFSET ?
            """
            cursor.execute(query, params + [limit, offset])

            usuarios = []
            for u in cursor.fetchall():
                usuarios.append({
                    "id": u["id"],
                    "nombre": u["nombre"],
                    "email": u["email"],
                    "rol": u["rol"],
                    "activo": bool(u["activo"]),
                    "total_tesinas": u["total_tesinas"]
                })

        response = create_pagination_response(usuarios, total_count)
        
        if filters:
            response['filters_applied'] = filters
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": f"Error al listar usuarios: {str(e)}"}), 500

# =========================
# OBTENER UN USUARIO (SOLO ADMIN)
# =========================
@admin_usuarios_bp.route("/admin/usuarios/<int:usuario_id>", methods=["GET"])
@admin_required  # ← PROTECCIÓN JWT
def obtener_usuario(usuario_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT id, nombre, email, rol, activo
                FROM usuarios
                WHERE id = ?
                AND rol != 'admin'
            """, (usuario_id,))

            usuario = cursor.fetchone()

        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404

        return jsonify({
            "id": usuario["id"],
            "nombre": usuario["nombre"],
            "email": usuario["email"],
            "rol": usuario["rol"],
            "activo": bool(usuario["activo"])
        })
    
    except Exception as e:
        return jsonify({"error": f"Error al obtener usuario: {str(e)}"}), 500


# =========================
# CREAR USUARIO (SOLO ADMIN)
# =========================
@admin_usuarios_bp.route("/admin/usuarios", methods=["POST"])
@admin_required
def crear_usuario():
    try:
        data = request.json

        nombre = data.get("nombre")
        email = data.get("email")
        password = data.get("password", "123456")
        rol = "alumno"  # ← FORZAR a alumno siempre

        if not all([nombre, email]):
            return jsonify({"error": "Faltan datos obligatorios"}), 400

        hashed_password = hash_password(password)

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT COUNT(*)
                FROM usuarios
                WHERE email = ?
            """, (email,))

            if cursor.fetchone()[0] > 0:
                return jsonify({"error": "El email ya está registrado"}), 400

            cursor.execute("""
                INSERT INTO usuarios (nombre, email, password, rol, activo)
                VALUES (?, ?, ?, ?, 1)
            """, (nombre, email, hashed_password, rol))

            conn.commit()

        return jsonify({"message": "Alumno creado correctamente"}), 201
    
    except Exception as e:
        return jsonify({"error": f"Error al crear alumno: {str(e)}"}), 500

# =========================
# EDITAR USUARIO (SOLO ADMIN)
# =========================
@admin_usuarios_bp.route("/admin/usuarios/<int:usuario_id>", methods=["PUT"])
@admin_required
def editar_usuario(usuario_id):
    try:
        data = request.json

        nombre = data.get("nombre")
        email = data.get("email")

        if not all([nombre, email]):
            return jsonify({"error": "Faltan datos obligatorios"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT rol
                FROM usuarios
                WHERE id = ?
            """, (usuario_id,))

            usuario = cursor.fetchone()
            if not usuario:
                return jsonify({"error": "Usuario no encontrado"}), 404

            if usuario["rol"] != "alumno":
                return jsonify({"error": "Solo se pueden editar alumnos desde esta sección"}), 403

            cursor.execute("""
                SELECT COUNT(*)
                FROM usuarios
                WHERE email = ?
                AND id != ?
            """, (email, usuario_id))

            if cursor.fetchone()[0] > 0:
                return jsonify({"error": "El email ya está en uso por otro usuario"}), 400

            cursor.execute("""
                UPDATE usuarios
                SET nombre = ?, email = ?
                WHERE id = ?
            """, (nombre, email, usuario_id))

            if cursor.rowcount == 0:
                return jsonify({"error": "No se pudo actualizar el usuario"}), 400

            conn.commit()

        return jsonify({"message": "Alumno actualizado correctamente"})
    
    except Exception as e:
        return jsonify({"error": f"Error al editar alumno: {str(e)}"}), 500

# =========================
# ACTIVAR / DESACTIVAR USUARIO (SOLO ADMIN)
# =========================
@admin_usuarios_bp.route("/admin/usuarios/<int:usuario_id>/estado", methods=["PUT"])
@admin_required  # ← PROTECCIÓN JWT
def cambiar_estado_usuario(usuario_id):
    try:
        data = request.json
        activo = data.get("activo")

        if activo is None:
            return jsonify({"error": "Falta el estado"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT rol
                FROM usuarios
                WHERE id = ?
            """, (usuario_id,))

            usuario = cursor.fetchone()
            if not usuario:
                return jsonify({"error": "Usuario no encontrado"}), 404

            if usuario["rol"] == "admin":
                return jsonify({"error": "No se puede desactivar un usuario administrador"}), 403

            cursor.execute("""
                UPDATE usuarios
                SET activo = ?
                WHERE id = ?
            """, (1 if activo else 0, usuario_id))

            if cursor.rowcount == 0:
                return jsonify({"error": "No se pudo actualizar el estado"}), 400

            conn.commit()

        estado_texto = "activado" if activo else "desactivado"
        return jsonify({"message": f"Usuario {estado_texto} correctamente"})
    
    except Exception as e:
        return jsonify({"error": f"Error al cambiar estado: {str(e)}"}), 500


# =========================
# ELIMINAR USUARIO (SOLO ADMIN) - DELETE PERMANENTE
# =========================
@admin_usuarios_bp.route("/admin/usuarios/<int:usuario_id>", methods=["DELETE"])
@admin_required
def eliminar_usuario(usuario_id):
    """
    Elimina permanentemente un usuario de la base de datos
    Solo si no tiene tesinas asociadas
    """
    try:
        # No permitir que el admin se elimine a sí mismo
        if usuario_id == request.current_user['user_id']:
            return jsonify({"error": "No podés eliminar tu propia cuenta"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            # Verificar que el usuario existe
            cursor.execute("""
                SELECT rol
                FROM usuarios
                WHERE id = ?
            """, (usuario_id,))

            usuario = cursor.fetchone()
            if not usuario:
                return jsonify({"error": "Usuario no encontrado"}), 404

            # No permitir eliminar admins
            if usuario["rol"] == "admin":
                return jsonify({"error": "No se puede eliminar un usuario administrador"}), 403

            # Verificar si tiene tesinas asociadas (como alumno o tutor)
            cursor.execute("""
                SELECT COUNT(*) FROM tesinas 
                WHERE alumno_id = ? OR tutor_id = ?
            """, (usuario_id, usuario_id))
            
            count = cursor.fetchone()[0]
            if count > 0:
                return jsonify({
                    "error": "No se puede eliminar: el usuario tiene tesinas asociadas"
                }), 400

            # ELIMINAR permanentemente
            cursor.execute("DELETE FROM usuarios WHERE id = ?", (usuario_id,))
            conn.commit()

        return jsonify({"message": "Usuario eliminado permanentemente"})
    
    except Exception as e:
        return jsonify({"error": f"Error al eliminar usuario: {str(e)}"}), 500


# =========================
# CAMBIAR CONTRASEÑA (SOLO ADMIN)
# =========================
@admin_usuarios_bp.route("/admin/usuarios/<int:usuario_id>/password", methods=["PUT"])
@admin_required  # ← PROTECCIÓN JWT
def cambiar_password(usuario_id):
    try:
        data = request.json
        nueva_password = data.get("password")

        if not nueva_password:
            return jsonify({"error": "Falta la nueva contraseña"}), 400

        if len(nueva_password) < 6:
            return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400

        hashed_password = hash_password(nueva_password)

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT rol
                FROM usuarios
                WHERE id = ?
            """, (usuario_id,))

            usuario = cursor.fetchone()
            if not usuario:
                return jsonify({"error": "Usuario no encontrado"}), 404

            if usuario["rol"] == "admin":
                return jsonify({"error": "No se puede cambiar la contraseña de un administrador"}), 403

            cursor.execute("""
                UPDATE usuarios
                SET password = ?
                WHERE id = ?
            """, (hashed_password, usuario_id))

            conn.commit()

        return jsonify({"message": "Contraseña actualizada correctamente"})
    
    except Exception as e:
        return jsonify({"error": f"Error al cambiar contraseña: {str(e)}"}), 500