from flask import Blueprint, request, jsonify, send_from_directory
import os
from datetime import datetime
from config import UPLOAD_FOLDER, allowed_file
from models.tesina import Tesina
from utils.db_utils import get_db
from utils.file_utils import save_file_safely
from utils.jwt_utils import token_required, alumno_required, tutor_required, admin_required
from utils.pagination_utils import create_pagination_response, get_pagination_params
from utils.filter_utils import get_filter_params, build_where_clause

tesinas_bp = Blueprint("tesinas", __name__)


# =========================
# Subir tesina (SOLO ALUMNOS)
# =========================
@tesinas_bp.route("/upload", methods=["POST"])
@alumno_required
def upload_tesina():
    try:
        titulo = request.form.get("titulo", "")
        resumen = request.form.get("resumen", "")
        tutor_id = request.form.get("tutor_id")

        alumno_id = request.current_user['user_id']

        if not tutor_id:
            return jsonify({"error": "Falta tutor"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            # ← AGREGAR ESTA VALIDACIÓN
            # Verificar si el alumno ya tiene una tesina
            cursor.execute("""
                SELECT id FROM tesinas WHERE alumno_id = ?
            """, (alumno_id,))
            
            if cursor.fetchone():
                return jsonify({
                    "error": "Ya tenés una tesina registrada. Para enviar correcciones, usá la opción 'Reenviar versión' desde el detalle de tu tesina."
                }), 400

            # Verificar que el tutor existe y está activo
            cursor.execute("""
                SELECT activo FROM usuarios
                WHERE id = ? AND rol = 'tutor'
            """, (tutor_id,))

            row = cursor.fetchone()
            if not row:
                return jsonify({"error": "Tutor inexistente"}), 400
            if row['activo'] == 0:
                return jsonify({"error": "El tutor seleccionado está inactivo"}), 400

            file = request.files.get("file")
            if not file:
                return jsonify({"error": "No se subió archivo"}), 400

            if not allowed_file(file.filename):
                return jsonify({
                    "error": "Tipo de archivo no permitido. Solo se aceptan: PDF, DOCX, DOC"
                }), 400

            nombre_archivo = save_file_safely(file, UPLOAD_FOLDER)

            cursor.execute("""
                INSERT INTO tesinas (
                    titulo, resumen, alumno_id, tutor_id,
                    nombre_archivo, estado, observaciones
                )
                VALUES (?, ?, ?, ?, ?, 'pendiente', '')
            """, (titulo, resumen, alumno_id, tutor_id, nombre_archivo))

            tesina_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO versiones_tesinas (
                    tesina_id, numero_version, nombre_archivo,
                    estado, observaciones, fecha_creacion
                )
                VALUES (?, 1, ?, 'pendiente', NULL, ?)
            """, (tesina_id, nombre_archivo, datetime.now().isoformat()))

            conn.commit()

        return jsonify({"message": "Tesina subida correctamente"})

    except Exception as e:
        return jsonify({"error": f"Error al subir tesina: {str(e)}"}), 500

# =========================
# Listar tesinas (AUTENTICADO)
# =========================
@tesinas_bp.route("/tesinas", methods=["GET"])
@token_required
def list_tesinas():
    try:
        limit, offset = get_pagination_params()
        filters = get_filter_params()

        allowed_filters = {
            'search': ['t.titulo', 't.resumen'],
            'estado': 't.estado',
            'tutor_id': 't.tutor_id'
        }

        where_clause, params = build_where_clause(filters, allowed_filters)

        # Si es alumno, solo ver sus tesinas
        rol = request.current_user['role']
        user_id = request.current_user['user_id']

        if rol == 'alumno':
            where_clause = f"t.alumno_id = ? AND ({where_clause})"
            params = [user_id] + params

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                f"SELECT COUNT(*) FROM tesinas t WHERE {where_clause}",
                params
            )
            total_count = cursor.fetchone()[0]

            cursor.execute(f"""
                SELECT
                    t.id,
                    t.titulo,
                    t.resumen,
                    t.tutor_id,
                    t.nombre_archivo,
                    t.estado,
                    t.observaciones,
                    u_alumno.nombre AS alumno_nombre,
                    u_tutor.nombre  AS tutor_nombre
                FROM tesinas t
                LEFT JOIN usuarios u_alumno ON u_alumno.id = t.alumno_id
                LEFT JOIN usuarios u_tutor  ON u_tutor.id  = t.tutor_id
                WHERE {where_clause}
                ORDER BY t.id DESC
                LIMIT ? OFFSET ?
            """, params + [limit, offset])

            rows = cursor.fetchall()

        tesinas = []
        for r in rows:
            tesina = Tesina(
                r['id'], r['titulo'], r['resumen'],
                r['tutor_id'], r['nombre_archivo'],
                r['estado'], r['observaciones']
            ).to_dict()
            tesina['alumno_nombre'] = r['alumno_nombre'] or 'Sin alumno'
            tesina['tutor_nombre']  = r['tutor_nombre']  or 'Sin tutor'
            tesinas.append(tesina)

        response = create_pagination_response(tesinas, total_count)

        if filters:
            response['filters_applied'] = filters

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": f"Error al listar tesinas: {str(e)}"}), 500
    
# =========================
# Obtener una tesina por ID
# =========================
@tesinas_bp.route("/tesinas/<int:tesina_id>", methods=["GET"])
@token_required
def get_tesina(tesina_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT
                    t.id,
                    t.titulo,
                    t.resumen,
                    t.tutor_id,
                    t.nombre_archivo,
                    t.estado,
                    t.observaciones,
                    u_alumno.nombre AS alumno_nombre,
                    u_tutor.nombre  AS tutor_nombre
                FROM tesinas t
                LEFT JOIN usuarios u_alumno ON u_alumno.id = t.alumno_id
                LEFT JOIN usuarios u_tutor  ON u_tutor.id  = t.tutor_id
                WHERE t.id = ?
            """, (tesina_id,))

            r = cursor.fetchone()

        if not r:
            return jsonify({"error": "Tesina no encontrada"}), 404

        tesina = Tesina(
            r['id'], r['titulo'], r['resumen'],
            r['tutor_id'], r['nombre_archivo'],
            r['estado'], r['observaciones']
        ).to_dict()
        tesina['alumno_nombre'] = r['alumno_nombre'] or 'Sin alumno'
        tesina['tutor_nombre']  = r['tutor_nombre']  or 'Sin tutor'

        return jsonify(tesina)

    except Exception as e:
        return jsonify({"error": f"Error al obtener tesina: {str(e)}"}), 500

# =========================
# Cambiar estado de versión (TUTOR)
# =========================
@tesinas_bp.route("/tutor/versiones/<int:version_id>/estado", methods=["POST"])
@tutor_required  # ← Solo tutores
def cambiar_estado_version(version_id):
    try:
        estado = request.json.get("estado")

        if not estado:
            return jsonify({"error": "Falta estado"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE versiones_tesinas
                SET estado = ?
                WHERE id = ?
            """, (estado, version_id))

            cursor.execute("""
                SELECT tesina_id
                FROM versiones_tesinas
                WHERE id = ?
            """, (version_id,))

            row = cursor.fetchone()
            if not row:
                return jsonify({"error": "Versión no encontrada"}), 404

            tesina_id = row['tesina_id']

            cursor.execute("""
                UPDATE tesinas
                SET estado = ?
                WHERE id = ?
            """, (estado, tesina_id))

            conn.commit()

        return jsonify({"message": "Estado de versión y tesina actualizado"})
    
    except Exception as e:
        return jsonify({"error": f"Error al cambiar estado: {str(e)}"}), 500


# =========================
# Guardar observaciones (TUTOR)
# =========================
@tesinas_bp.route("/tutor/versiones/<int:version_id>/observaciones", methods=["POST"])
@tutor_required  # ← Solo tutores
def guardar_observaciones_version(version_id):
    try:
        observaciones = request.json.get("observaciones", "")

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE versiones_tesinas
                SET observaciones = ?
                WHERE id = ?
            """, (observaciones, version_id))

            cursor.execute("""
                SELECT tesina_id
                FROM versiones_tesinas
                WHERE id = ?
            """, (version_id,))

            row = cursor.fetchone()
            if not row:
                return jsonify({"error": "Versión no encontrada"}), 404

            tesina_id = row['tesina_id']

            cursor.execute("""
                UPDATE tesinas
                SET observaciones = ?
                WHERE id = ?
            """, (observaciones, tesina_id))

            conn.commit()

        return jsonify({"message": "Observaciones guardadas en versión y tesina"})
    
    except Exception as e:
        return jsonify({"error": f"Error al guardar observaciones: {str(e)}"}), 500
    
# =========================
# Editar archivo tesina (ALUMNO)
# =========================
@tesinas_bp.route("/tesinas/<int:tesina_id>/archivo", methods=["PUT"])
@alumno_required
def reemplazar_archivo_tesina(tesina_id):
    """
    Permite al alumno reemplazar el archivo de una tesina PENDIENTE
    Solo si aún no fue revisada por el tutor
    """
    try:
        alumno_id = request.current_user['user_id']

        with get_db() as conn:
            cursor = conn.cursor()

            # Verificar que la tesina existe y pertenece al alumno
            cursor.execute("""
                SELECT id, estado, nombre_archivo, alumno_id
                FROM tesinas
                WHERE id = ? AND alumno_id = ?
            """, (tesina_id, alumno_id))

            tesina = cursor.fetchone()

            if not tesina:
                return jsonify({
                    "error": "Tesina no encontrada o no tenés permisos"
                }), 404

            # Verificar que está PENDIENTE
            if tesina['estado'] != 'pendiente':
                return jsonify({
                    "error": "Solo podés editar tesinas que aún no fueron revisadas"
                }), 400

            # Obtener el nuevo archivo
            file = request.files.get("file")
            if not file:
                return jsonify({"error": "No se subió archivo"}), 400

            if not allowed_file(file.filename):
                return jsonify({
                    "error": "Tipo de archivo no permitido. Solo se aceptan: PDF, DOCX, DOC"
                }), 400

            # Eliminar archivo anterior
            old_filepath = os.path.join(UPLOAD_FOLDER, tesina['nombre_archivo'])
            if os.path.exists(old_filepath):
                try:
                    os.remove(old_filepath)
                except Exception as e:
                    print(f"Error al eliminar archivo anterior: {e}")

            # Guardar nuevo archivo
            nuevo_nombre = save_file_safely(file, UPLOAD_FOLDER)

            # Actualizar en base de datos
            cursor.execute("""
                UPDATE tesinas
                SET nombre_archivo = ?
                WHERE id = ?
            """, (nuevo_nombre, tesina_id))

            # Actualizar también en versiones_tesinas (versión actual)
            cursor.execute("""
                UPDATE versiones_tesinas
                SET nombre_archivo = ?
                WHERE tesina_id = ? AND numero_version = 1
            """, (nuevo_nombre, tesina_id))

            conn.commit()

        return jsonify({
            "message": "Archivo actualizado correctamente",
            "nuevo_archivo": nuevo_nombre
        })

    except Exception as e:
        return jsonify({
            "error": f"Error al actualizar archivo: {str(e)}"
        }), 500

# =========================
# Editar tesina (ALUMNO)
# =========================
@tesinas_bp.route("/tesinas/<int:tesina_id>", methods=["PUT"])
@alumno_required
def editar_tesina(tesina_id):
    """
    Permite al alumno editar título, resumen y tutor de una tesina PENDIENTE
    Solo si aún no fue revisada por el tutor
    """
    try:
        alumno_id = request.current_user['user_id']
        data = request.get_json()

        titulo = data.get("titulo", "").strip()
        resumen = data.get("resumen", "").strip()
        tutor_id = data.get("tutor_id")

        if not titulo:
            return jsonify({"error": "El título es obligatorio"}), 400

        if not tutor_id:
            return jsonify({"error": "Debes seleccionar un tutor"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            # Verificar que la tesina existe y pertenece al alumno
            cursor.execute("""
                SELECT id, estado, alumno_id
                FROM tesinas
                WHERE id = ? AND alumno_id = ?
            """, (tesina_id, alumno_id))

            tesina = cursor.fetchone()

            if not tesina:
                return jsonify({
                    "error": "Tesina no encontrada o no tenés permisos"
                }), 404

            # Verificar que está PENDIENTE
            if tesina['estado'] != 'pendiente':
                return jsonify({
                    "error": "Solo podés editar tesinas que aún no fueron revisadas"
                }), 400

            # Verificar que el tutor existe y está activo
            cursor.execute("""
                SELECT activo FROM usuarios
                WHERE id = ? AND rol = 'tutor'
            """, (tutor_id,))

            tutor = cursor.fetchone()
            if not tutor:
                return jsonify({"error": "Tutor no encontrado"}), 404

            if tutor['activo'] == 0:
                return jsonify({"error": "El tutor seleccionado está inactivo"}), 400

            # Actualizar tesina
            cursor.execute("""
                UPDATE tesinas
                SET titulo = ?, resumen = ?, tutor_id = ?
                WHERE id = ?
            """, (titulo, resumen, tutor_id, tesina_id))

            conn.commit()

        return jsonify({
            "message": "Tesina actualizada correctamente"
        })

    except Exception as e:
        return jsonify({
            "error": f"Error al actualizar tesina: {str(e)}"
        }), 500
# =========================
# Reentregar tesina (ALUMNO)
# =========================
@tesinas_bp.route("/tesinas/<int:tesina_id>/reentrega", methods=["POST"])
@alumno_required  # ← Solo alumnos
def reentregar_tesina(tesina_id):
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No se subió archivo"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                "error": "Tipo de archivo no permitido. Solo se aceptan: PDF, DOCX, DOC"
            }), 400

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT COUNT(*)
                FROM versiones_tesinas
                WHERE tesina_id = ?
                AND estado = 'aprobada'
            """, (tesina_id,))

            if cursor.fetchone()[0] > 0:
                return jsonify({"error": "Tesina ya aprobada"}), 400

            nombre_archivo = save_file_safely(file, UPLOAD_FOLDER)

            cursor.execute("""
                SELECT MAX(numero_version)
                FROM versiones_tesinas
                WHERE tesina_id = ?
            """, (tesina_id,))

            new_version = (cursor.fetchone()[0] or 0) + 1

            cursor.execute("""
                INSERT INTO versiones_tesinas (
                    tesina_id,
                    numero_version,
                    nombre_archivo,
                    estado,
                    observaciones,
                    fecha_creacion
                )
                VALUES (?, ?, ?, 'pendiente', NULL, ?)
            """, (
                tesina_id,
                new_version,
                nombre_archivo,
                datetime.now().isoformat()
            ))

            cursor.execute("""
                UPDATE tesinas
                SET estado = 'pendiente'
                WHERE id = ?
            """, (tesina_id,))

            conn.commit()

        return jsonify({"message": "Nueva versión subida", "version": new_version})
    
    except Exception as e:
        return jsonify({"error": f"Error al reenviar tesina: {str(e)}"}), 500


# =========================
# Historial de versiones (AUTENTICADO)
# =========================
@tesinas_bp.route("/tesinas/<int:tesina_id>/versions", methods=["GET"])
@token_required  # ← Cualquier usuario autenticado
def obtener_versiones_tesina(tesina_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT MAX(numero_version)
                FROM versiones_tesinas
                WHERE tesina_id = ?
            """, (tesina_id,))
            current_version = cursor.fetchone()[0]

            cursor.execute("""
                SELECT
                    id,
                    numero_version,
                    nombre_archivo,
                    estado,
                    observaciones,
                    fecha_creacion
                FROM versiones_tesinas
                WHERE tesina_id = ?
                ORDER BY numero_version DESC
            """, (tesina_id,))

            rows = cursor.fetchall()

        versiones = []
        for r in rows:
            versiones.append({
                "version_id": r['id'],
                "numero_version": r['numero_version'],
                "nombre_archivo": r['nombre_archivo'],
                "estado": r['estado'],
                "observaciones": r['observaciones'],
                "fecha_creacion": r['fecha_creacion'],
                "is_current": r['numero_version'] == current_version
            })

        return jsonify(versiones)
    
    except Exception as e:
        return jsonify({"error": f"Error al obtener versiones: {str(e)}"}), 500

# =========================
# Eliminar tesina (ADMIN)
# =========================
@tesinas_bp.route("/tesinas/<int:tesina_id>", methods=["DELETE"])
@admin_required
def eliminar_tesina(tesina_id):
    """
    Permite al admin eliminar una tesina permanentemente
    Elimina también todas las versiones y archivos asociados
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            # Obtener información de la tesina y sus versiones
            cursor.execute("""
                SELECT nombre_archivo FROM tesinas WHERE id = ?
            """, (tesina_id,))
            
            tesina = cursor.fetchone()
            if not tesina:
                return jsonify({"error": "Tesina no encontrada"}), 404

            # Obtener todos los archivos de las versiones
            cursor.execute("""
                SELECT nombre_archivo FROM versiones_tesinas
                WHERE tesina_id = ?
            """, (tesina_id,))
            
            versiones = cursor.fetchall()
            
            # Eliminar archivos físicos
            archivos_eliminados = []
            archivos_no_encontrados = []
            archivos_con_error = []
            
            archivos_a_eliminar = set([tesina['nombre_archivo']])
            
            for v in versiones:
                archivos_a_eliminar.add(v['nombre_archivo'])
            
            print(f"📁 Intentando eliminar {len(archivos_a_eliminar)} archivos...")
            
            for nombre_archivo in archivos_a_eliminar:
                filepath = os.path.join(UPLOAD_FOLDER, nombre_archivo)
                
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                        archivos_eliminados.append(nombre_archivo)
                        print(f"✓ Archivo eliminado: {nombre_archivo}")
                    except Exception as e:
                        archivos_con_error.append(nombre_archivo)
                        print(f"❌ Error al eliminar {nombre_archivo}: {e}")
                else:
                    archivos_no_encontrados.append(nombre_archivo)
                    print(f"⚠️ Archivo no existe: {nombre_archivo}")

            # Eliminar versiones de la base de datos
            cursor.execute("""
                DELETE FROM versiones_tesinas WHERE tesina_id = ?
            """, (tesina_id,))
            versiones_eliminadas = cursor.rowcount
            print(f"✓ {versiones_eliminadas} versiones eliminadas de BD")

            # Eliminar tesina de la base de datos
            cursor.execute("""
                DELETE FROM tesinas WHERE id = ?
            """, (tesina_id,))
            print(f"✓ Tesina {tesina_id} eliminada de BD")

            conn.commit()
            print(f"✓ Cambios guardados en BD")

        return jsonify({
            "message": "Tesina eliminada permanentemente",
            "archivos_eliminados": len(archivos_eliminados),
            "archivos_no_encontrados": len(archivos_no_encontrados),
            "archivos_con_error": len(archivos_con_error),
            "versiones_eliminadas": versiones_eliminadas
        })

    except Exception as e:
        print(f"❌ ERROR COMPLETO al eliminar tesina {tesina_id}:")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            "error": f"Error al eliminar tesina: {str(e)}"
        }), 500