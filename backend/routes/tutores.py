from flask import Blueprint, request, jsonify
from utils.db_utils import get_db
from utils.jwt_utils import admin_required, tutor_required, token_required
from utils.auth_utils import hash_password
from utils.pagination_utils import create_pagination_response, get_pagination_params
from utils.filter_utils import get_filter_params, build_where_clause

tutores_bp = Blueprint("tutores", __name__)


# =========================
# LISTAR TUTORES ACTIVOS (PÚBLICO - para formularios)
# =========================
@tutores_bp.route("/tutores", methods=["GET"])
@token_required
def listar_tutores():
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT id, nombre
                FROM usuarios
                WHERE rol = 'tutor'
                AND activo = 1
                ORDER BY nombre
            """)

            rows = cursor.fetchall()

        return jsonify([
            {
                "id": r["id"],
                "nombre": r["nombre"]
            }
            for r in rows
        ])
    
    except Exception as e:
        return jsonify({"error": f"Error al listar tutores: {str(e)}"}), 500


# =========================
# LISTAR TUTORES (SOLO ADMIN)
# =========================
@tutores_bp.route("/admin/tutores", methods=["GET"])
@admin_required
def listar_tutores_admin():
    """
    Listar tutores con paginación y filtros
    
    Parámetros de query:
    - page: número de página (default: 1)
    - per_page: items por página (default: 10, max: 100)
    - search: buscar en nombre y email
    - activo: filtrar por estado (true/false)
    """
    try:
        # Obtener parámetros
        limit, offset = get_pagination_params()
        filters = get_filter_params()
        
        # Definir filtros permitidos
        allowed_filters = {
            'search': ['u.nombre', 'u.email'],
            'activo': 'u.activo'
        }
        
        # Construir cláusula WHERE
        where_clause, params = build_where_clause(filters, allowed_filters)
        
        # Agregar filtro fijo: solo tutores
        where_clause = f"u.rol = 'tutor' AND ({where_clause})"
        
        with get_db() as conn:
            cursor = conn.cursor()

            # Contar total de tutores con filtros
            count_query = f"""
                SELECT COUNT(*)
                FROM usuarios u
                WHERE {where_clause}
            """
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]

            # Obtener tutores paginados y filtrados
            query = f"""
                SELECT
                    u.id,
                    u.nombre,
                    u.email,
                    u.activo,
                    COUNT(t.id) AS total_tesinas
                FROM usuarios u
                LEFT JOIN tesinas t ON t.tutor_id = u.id
                WHERE {where_clause}
                GROUP BY u.id
                ORDER BY u.nombre
                LIMIT ? OFFSET ?
            """
            cursor.execute(query, params + [limit, offset])

            rows = cursor.fetchall()

        tutores = [
            {
                "id": r["id"],
                "nombre": r["nombre"],
                "email": r["email"],
                "activo": bool(r["activo"]),
                "total_tesinas": r["total_tesinas"]
            }
            for r in rows
        ]

        # Crear respuesta paginada
        response = create_pagination_response(tutores, total_count)
        
        # Agregar filtros aplicados
        if filters:
            response['filters_applied'] = filters
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": f"Error al listar tutores (admin): {str(e)}"}), 500

# =========================
# CREAR TUTOR (SOLO ADMIN)
# =========================
@tutores_bp.route("/admin/tutores", methods=["POST"])
@admin_required
def crear_tutor():
    try:
        data = request.json

        nombre = data.get("nombre")
        email = data.get("email")
        password = data.get("password")

        if not all([nombre, email, password]):
            return jsonify({"error": "Faltan datos obligatorios (nombre, email y password son requeridos)"}), 400

        if len(password) < 8:
            return jsonify({"error": "La contraseña debe tener al menos 8 caracteres"}), 400

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
                VALUES (?, ?, ?, 'tutor', 1)
            """, (nombre, email, hashed_password))
            

        return jsonify({"message": "Tutor creado correctamente"})
    
    except Exception as e:
        return jsonify({"error": f"Error al crear tutor: {str(e)}"}), 500


# =========================
# OBTENER UN TUTOR (SOLO ADMIN)
# =========================
@tutores_bp.route("/admin/tutores/<int:tutor_id>", methods=["GET"])
@admin_required
def obtener_tutor(tutor_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT id, nombre, email, activo
                FROM usuarios
                WHERE id = ?
                AND rol = 'tutor'
            """, (tutor_id,))

            row = cursor.fetchone()

        if not row:
            return jsonify({"error": "Tutor no encontrado"}), 404

        return jsonify({
            "id": row["id"],
            "nombre": row["nombre"],
            "email": row["email"],
            "activo": bool(row["activo"])
        })
    
    except Exception as e:
        return jsonify({"error": f"Error al obtener tutor: {str(e)}"}), 500


# =========================
# EDITAR TUTOR (SOLO ADMIN)
# =========================
@tutores_bp.route("/admin/tutores/<int:tutor_id>", methods=["PUT"])
@admin_required
def editar_tutor(tutor_id):
    try:
        data = request.json

        nombre = data.get("nombre")
        email = data.get("email")

        if not nombre or not email:
            return jsonify({"error": "Datos incompletos"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT COUNT(*)
                FROM usuarios
                WHERE email = ?
                AND id != ?
            """, (email, tutor_id))

            if cursor.fetchone()[0] > 0:
                return jsonify({"error": "El email ya está en uso por otro usuario"}), 400

            cursor.execute("""
                UPDATE usuarios
                SET nombre = ?, email = ?
                WHERE id = ?
                AND rol = 'tutor'
            """, (nombre, email, tutor_id))

            if cursor.rowcount == 0:
                return jsonify({"error": "Tutor no encontrado"}), 404


        return jsonify({"message": "Tutor actualizado"})
    
    except Exception as e:
        return jsonify({"error": f"Error al editar tutor: {str(e)}"}), 500


# =========================
# ACTIVAR / DESACTIVAR TUTOR (SOLO ADMIN)
# =========================
@tutores_bp.route("/admin/tutores/<int:tutor_id>/estado", methods=["PUT"])
@admin_required
def cambiar_estado_tutor(tutor_id):
    try:
        data = request.json
        activo = data.get("activo")

        if activo not in [0, 1, True, False]:
            return jsonify({"error": "Estado inválido"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE usuarios
                SET activo = ?
                WHERE id = ?
                AND rol = 'tutor'
            """, (1 if activo else 0, tutor_id))

            if cursor.rowcount == 0:
                return jsonify({"error": "Tutor no encontrado"}), 404


        return jsonify({"message": "Estado del tutor actualizado"})
    
    except Exception as e:
        return jsonify({"error": f"Error al cambiar estado: {str(e)}"}), 500

# =========================
# ELIMINAR TUTOR PERMANENTEMENTE (SOLO ADMIN)
# =========================
@tutores_bp.route("/admin/tutores/<int:tutor_id>", methods=["DELETE"])
@admin_required 
def eliminar_tutor(tutor_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            # Verificar si tiene tesinas vinculadas
            cursor.execute("""
                SELECT COUNT(*)
                FROM tesinas
                WHERE tutor_id = ?
            """, (tutor_id,))

            if cursor.fetchone()[0] > 0:
                return jsonify({
                    "error": "No se puede eliminar el tutor: tiene tesinas asignadas. Primero reasigna esas tesinas."
                }), 400

            # Ejecutar el borrado permanente
            cursor.execute("""
                DELETE FROM usuarios
                WHERE id = ? 
                AND rol = 'tutor'
            """, (tutor_id,))

            # Verificamos si realmente se borró algo
            if cursor.rowcount == 0:
                return jsonify({"error": "Tutor no encontrado"}), 404


        return jsonify({"message": "Tutor eliminado permanentemente de la base de datos"})
    
    except Exception as e:
        # En caso de error de base de datos
        return jsonify({"error": f"Error al eliminar tutor: {str(e)}"}), 500
    
# =========================
# TESINAS ASIGNADAS A UN TUTOR (TUTOR o ADMIN)
# =========================
@tutores_bp.route("/tutor/tesinas", methods=["GET"])
@tutor_required
def tesinas_por_tutor():
    try:
        tutor_id = request.args.get("tutor_id")

        if not tutor_id:
            tutor_id = request.current_user['user_id']
        else:
            if request.current_user['role'] != 'admin' and int(tutor_id) != request.current_user['user_id']:
                return jsonify({"error": "No tenés permiso para ver tesinas de otro tutor"}), 403

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT
                    t.id       AS tesina_id,
                    t.titulo,
                    t.resumen,
                    t.estado   AS tesina_estado,
                    v.id       AS version_id,
                    v.numero_version,
                    v.nombre_archivo,
                    v.estado   AS version_estado,
                    v.observaciones,
                    v.fecha_creacion,
                    u.nombre   AS alumno_nombre
                FROM tesinas t
                JOIN versiones_tesinas v ON v.tesina_id = t.id
                LEFT JOIN usuarios u ON u.id = t.alumno_id
                WHERE t.tutor_id = ?
                AND v.numero_version = (
                    SELECT MAX(numero_version)
                    FROM versiones_tesinas
                    WHERE tesina_id = t.id
                )
                ORDER BY v.fecha_creacion DESC
            """, (tutor_id,))

            rows = cursor.fetchall()

        return jsonify([dict(r) for r in rows])

    except Exception as e:
        return jsonify({"error": f"Error al listar tesinas del tutor: {str(e)}"}), 500

# =========================
# REVISAR TESINA (TUTOR o ADMIN)
# =========================
@tutores_bp.route("/tutor/versiones/<int:version_id>/revisar", methods=["POST"])
@tutor_required 
def revisar_version(version_id):
    try:
        data = request.json
        estado = data.get("estado")
        observaciones = data.get("observaciones", "")

        if not estado:
            return jsonify({"error": "Falta estado"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            # Verificar que el tutor sea el asignado (excepto admin)
            cursor.execute("""
                SELECT t.tutor_id
                FROM versiones_tesinas v
                JOIN tesinas t ON v.tesina_id = t.id
                WHERE v.id = ?
            """, (version_id,))
            
            result = cursor.fetchone()
            if not result:
                return jsonify({"error": "Versión no encontrada"}), 404
            
            # Solo admin puede revisar tesinas de cualquier tutor
            if request.current_user['role'] != 'admin' and result['tutor_id'] != request.current_user['user_id']:
                return jsonify({"error": "No tienes permiso para revisar esta tesina"}), 403

            # Actualizar versión
            cursor.execute("""
                UPDATE versiones_tesinas
                SET estado = ?, observaciones = ?
                WHERE id = ?
            """, (estado, observaciones, version_id))

            # Obtener tesina_id
            cursor.execute("""
                SELECT tesina_id
                FROM versiones_tesinas
                WHERE id = ?
            """, (version_id,))
            
            row = cursor.fetchone()
            tesina_id = row["tesina_id"]

            # Actualizar tesina
            cursor.execute("""
                UPDATE tesinas
                SET estado = ?, observaciones = ?
                WHERE id = ?
            """, (estado, observaciones, tesina_id))


        return jsonify({
            "message": "Revisión guardada y estado de la tesina actualizado"
        })
    
    except Exception as e:
        return jsonify({"error": f"Error al revisar versión: {str(e)}"}), 500