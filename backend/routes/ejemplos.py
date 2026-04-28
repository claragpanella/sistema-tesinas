from flask import Blueprint, request, jsonify
import os
from config import UPLOAD_EJEMPLOS_FOLDER, allowed_file
from models.ejemplo import Ejemplo
from utils.db_utils import get_db
from utils.file_utils import save_file_safely
from utils.jwt_utils import token_required, admin_required
from utils.pagination_utils import create_pagination_response, get_pagination_params
from utils.filter_utils import get_filter_params, build_where_clause

ejemplos_bp = Blueprint("ejemplos", __name__)


# =========================
# Listar ejemplos (AUTENTICADO)
# =========================
@ejemplos_bp.route("/ejemplos", methods=["GET"])
@token_required
def obtener_ejemplos():
    """
    Listar ejemplos con paginación y filtros
    
    Parámetros de query:
    - page: número de página (default: 1)
    - per_page: items por página (default: 10, max: 100)
    - search: buscar en título, nombre_estudiante y tutor
    - anio: filtrar por año exacto
    - anio_desde: filtrar desde año
    - anio_hasta: filtrar hasta año
    """
    try:
        # Obtener parámetros
        limit, offset = get_pagination_params()
        filters = get_filter_params()
        
        # Definir filtros permitidos
        allowed_filters = {
            'search': ['titulo', 'nombre_estudiante', 'tutor'],
            'anio': 'anio',
            'anio_desde': 'anio_desde',
            'anio_hasta': 'anio_hasta'
        }
        
        # Construir cláusula WHERE
        where_clause, params = build_where_clause(filters, allowed_filters)
        
        with get_db() as conn:
            cursor = conn.cursor()

            # Contar total con filtros
            count_query = f"SELECT COUNT(*) FROM ejemplos WHERE {where_clause}"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]

            # Obtener ejemplos paginados y filtrados
            query = f"""
                SELECT id, titulo, nombre_estudiante, anio, resumen, tutor, nombre_archivo
                FROM ejemplos
                WHERE {where_clause}
                ORDER BY anio DESC
                LIMIT ? OFFSET ?
            """
            cursor.execute(query, params + [limit, offset])

            rows = cursor.fetchall()

        ejemplos = [Ejemplo(*r).to_dict() for r in rows]
        
        # Crear respuesta paginada
        response = create_pagination_response(ejemplos, total_count)
        
        # Agregar filtros aplicados
        if filters:
            response['filters_applied'] = filters
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": f"Error al obtener ejemplos: {str(e)}"}), 500

# =========================
# Listar ejemplos (SOLO ADMIN)
# =========================
@ejemplos_bp.route("/admin/ejemplos", methods=["GET"])
@admin_required  # ← Solo admin
def listar_ejemplos_admin():
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT id, titulo, nombre_estudiante, anio, resumen, tutor, nombre_archivo
                FROM ejemplos
                ORDER BY anio DESC
            """)

            rows = cursor.fetchall()

        ejemplos = [Ejemplo(*r).to_dict() for r in rows]
        return jsonify(ejemplos)
    
    except Exception as e:
        return jsonify({"error": f"Error al listar ejemplos (admin): {str(e)}"}), 500


# =========================
# Obtener UN ejemplo (SOLO ADMIN)
# =========================
@ejemplos_bp.route("/admin/ejemplos/<int:ejemplo_id>", methods=["GET"])
@admin_required  # ← Solo admin
def obtener_ejemplo_admin(ejemplo_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT id, titulo, nombre_estudiante, anio, resumen, tutor, nombre_archivo
                FROM ejemplos
                WHERE id = ?
            """, (ejemplo_id,))

            row = cursor.fetchone()

        if not row:
            return jsonify({"error": "Ejemplo no encontrado"}), 404

        return jsonify(Ejemplo(*row).to_dict())
    
    except Exception as e:
        return jsonify({"error": f"Error al obtener ejemplo: {str(e)}"}), 500


# =========================
# Subir ejemplo (SOLO ADMIN)
# =========================
@ejemplos_bp.route("/admin/ejemplos", methods=["POST"])
@admin_required  # ← Solo admin
def subir_ejemplo():
    try:
        titulo = request.form.get("titulo")
        nombre_estudiante = request.form.get("nombre_estudiante")
        anio = request.form.get("anio")
        resumen = request.form.get("resumen", "")
        tutor = request.form.get("tutor")
        file = request.files.get("file")

        if not all([titulo, nombre_estudiante, anio, tutor, file]):
            return jsonify({"error": "Faltan datos obligatorios"}), 400

        if not allowed_file(file.filename):
            return jsonify({
                "error": "Tipo de archivo no permitido. Solo se aceptan: PDF, DOCX, DOC"
            }), 400

        try:
            anio = int(anio)
        except ValueError:
            return jsonify({"error": "El año debe ser un número válido"}), 400

        nombre_archivo = save_file_safely(file, UPLOAD_EJEMPLOS_FOLDER)

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO ejemplos (
                    titulo, nombre_estudiante, anio, resumen, tutor, nombre_archivo
                )
                VALUES (?, ?, ?, ?, ?, ?)
            """, (titulo, nombre_estudiante, anio, resumen, tutor, nombre_archivo))


        return jsonify({"message": "Ejemplo subido correctamente"}), 201
    
    except Exception as e:
        return jsonify({"error": f"Error al subir ejemplo: {str(e)}"}), 500


# =========================
# Editar ejemplo (SOLO ADMIN)
# =========================
@ejemplos_bp.route("/admin/ejemplos/<int:ejemplo_id>", methods=["PUT"])
@admin_required  # ← Solo admin
def editar_ejemplo(ejemplo_id):
    try:
        data = request.get_json()

        required_fields = ["titulo", "nombre_estudiante", "anio", "tutor"]
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                "error": f"Faltan campos obligatorios: {', '.join(missing_fields)}"
            }), 400

        try:
            anio = int(data["anio"])
        except ValueError:
            return jsonify({"error": "El año debe ser un número válido"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("SELECT id FROM ejemplos WHERE id = ?", (ejemplo_id,))
            if not cursor.fetchone():
                return jsonify({"error": "Ejemplo no encontrado"}), 404

            cursor.execute("""
                UPDATE ejemplos
                SET titulo = ?, nombre_estudiante = ?, anio = ?, resumen = ?, tutor = ?
                WHERE id = ?
            """, (
                data["titulo"],
                data["nombre_estudiante"],
                anio,
                data.get("resumen", ""),
                data["tutor"],
                ejemplo_id
            ))


        return jsonify({"message": "Ejemplo actualizado correctamente"})
    
    except Exception as e:
        return jsonify({"error": f"Error al editar ejemplo: {str(e)}"}), 500


# =========================
# Eliminar ejemplo (SOLO ADMIN)
# =========================
@ejemplos_bp.route("/admin/ejemplos/<int:ejemplo_id>", methods=["DELETE"])
@admin_required  # ← Solo admin
def eliminar_ejemplo(ejemplo_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                "SELECT nombre_archivo FROM ejemplos WHERE id = ?",
                (ejemplo_id,)
            )
            ejemplo = cursor.fetchone()

            if not ejemplo:
                return jsonify({"error": "Ejemplo no encontrado"}), 404

            nombre_archivo = ejemplo["nombre_archivo"]

            cursor.execute(
                "DELETE FROM ejemplos WHERE id = ?",
                (ejemplo_id,)
            )


        try:
            ruta = os.path.join(UPLOAD_EJEMPLOS_FOLDER, nombre_archivo)
            if os.path.exists(ruta):
                os.remove(ruta)
        except OSError as e:
            print(f"⚠️ No se pudo eliminar el archivo {nombre_archivo}: {str(e)}")

        return jsonify({"message": "Ejemplo eliminado correctamente"})
    
    except Exception as e:
        return jsonify({"error": f"Error al eliminar ejemplo: {str(e)}"}), 500