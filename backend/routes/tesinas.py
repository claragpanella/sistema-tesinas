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
# SUBIR TESINA (SOLO ALUMNOS)
# =========================
@tesinas_bp.route("/upload", methods=["POST"])
@alumno_required
def subir_tesina():
    """
    Sube una tesina en estado BORRADOR
    El alumno podrá analizarla con el chat antes de enviarla al tutor
    """
    try:
        alumno_id = request.current_user['user_id']

        # Validar archivo
        if 'file' not in request.files:
            return jsonify({"error": "No se envió ningún archivo"}), 400

        archivo = request.files['file']

        if archivo.filename == '':
            return jsonify({"error": "Nombre de archivo vacío"}), 400

        # Validar extensión
        ext = archivo.filename.rsplit('.', 1)[1].lower() if '.' in archivo.filename else ''
        if ext not in ['pdf', 'docx', 'doc']:
            return jsonify({"error": "Solo se permiten archivos PDF o DOCX"}), 400

        # Obtener datos del formulario
        titulo = request.form.get('titulo', '').strip()
        resumen = request.form.get('resumen', '').strip()
        tutor_id = request.form.get('tutor_id')

        if not titulo:
            return jsonify({"error": "El título es obligatorio"}), 400

        if not tutor_id:
            return jsonify({"error": "El tutor es obligatorio"}), 400

        # Generar nombre único
        import uuid
        nombre_unico = f"{uuid.uuid4().hex[:8]}_{archivo.filename}"
        filepath = os.path.join(UPLOAD_FOLDER, nombre_unico)

        # Guardar archivo
        archivo.save(filepath)

        # Guardar en base de datos
        with get_db() as conn:
            cursor = conn.cursor()

            # Insertar tesina en estado BORRADOR
            cursor.execute("""
                INSERT INTO tesinas 
                (titulo, resumen, alumno_id, tutor_id, nombre_archivo, estado_alumno, estado_tutor)
                VALUES (?, ?, ?, ?, ?, 'borrador', 'pendiente')
            """, (titulo, resumen, alumno_id, tutor_id, nombre_unico))

            tesina_id = cursor.lastrowid

            # Crear primera versión
            cursor.execute("""
                INSERT INTO versiones_tesinas 
                (tesina_id, numero_version, nombre_archivo, estado_alumno, estado_tutor, is_current)
                VALUES (?, 1, ?, 'borrador', 'pendiente', 1)
            """, (tesina_id, nombre_unico))

        return jsonify({
            "message": "✅ Tesina subida como BORRADOR. Podés analizarla con el chat antes de enviarla al tutor.",
            "tesina_id": tesina_id,
            "estado_alumno": "borrador",
            "estado_tutor": "pendiente"
        }), 201

    except Exception as e:
        print(f"Error al subir tesina: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error al subir la tesina: {str(e)}"}), 500

# =========================
# ENVIAR AL TUTOR (ALUMNO)
# =========================
@tesinas_bp.route("/tesinas/<int:tesina_id>/enviar-a-tutor", methods=["POST"])
@alumno_required
def enviar_tesina_a_tutor(tesina_id):
    """
    Marca la tesina como 'enviada' para que el tutor pueda verla
    Solo se puede enviar si está en estado 'borrador'
    """
    try:
        alumno_id = request.current_user['user_id']

        with get_db() as conn:
            cursor = conn.cursor()

            # Verificar que la tesina existe y pertenece al alumno
            cursor.execute("""
                SELECT estado_alumno, estado_tutor, titulo
                FROM tesinas 
                WHERE id = ? AND alumno_id = ?
            """, (tesina_id, alumno_id))

            tesina = cursor.fetchone()

            if not tesina:
                return jsonify({"error": "Tesina no encontrada"}), 404

            if tesina['estado_alumno'] == 'enviada':
                return jsonify({"error": "Esta tesina ya fue enviada al tutor"}), 400

            # Cambiar estado de la tesina
            cursor.execute("""
                UPDATE tesinas 
                SET estado_alumno = 'enviada',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (tesina_id,))

            # Actualizar versión actual también
            cursor.execute("""
                UPDATE versiones_tesinas
                SET estado_alumno = 'enviada'
                WHERE tesina_id = ? AND is_current = 1
            """, (tesina_id,))

        return jsonify({
            "message": f"✅ Tesina '{tesina['titulo']}' enviada al tutor correctamente",
            "estado_alumno": "enviada",
            "estado_tutor": "pendiente"
        })

    except Exception as e:
        print(f"Error al enviar tesina: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# =========================
# LISTAR TESINAS (AUTENTICADO)
# =========================
@tesinas_bp.route("/tesinas", methods=["GET"])
@token_required
def listar_tesinas():
    """
    Lista tesinas según el rol:
    - ALUMNO: Ve todas sus tesinas (borradores y enviadas)
    - TUTOR: Solo ve tesinas ENVIADAS (no borradores)
    - ADMIN: Ve todas las tesinas
    """
    try:
        user = request.current_user
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search = request.args.get('search', '').strip()
        estado_filter = request.args.get('estado', '')  # Filtro de estado_tutor

        with get_db() as conn:
            cursor = conn.cursor()

            # Query base — incluye version_id de la versión actual
            query_base = """
                SELECT 
                    t.id, t.titulo, t.resumen, t.nombre_archivo,
                    t.estado_alumno, t.estado_tutor, t.observaciones,
                    u_alumno.nombre as alumno_nombre,
                    u_tutor.nombre as tutor_nombre,
                    t.created_at, t.updated_at,
                    vt.id as version_id,
                    vt.numero_version
                FROM tesinas t
                LEFT JOIN usuarios u_alumno ON t.alumno_id = u_alumno.id
                LEFT JOIN usuarios u_tutor ON t.tutor_id = u_tutor.id
                LEFT JOIN versiones_tesinas vt ON vt.tesina_id = t.id AND vt.is_current = 1
            """

            # Construir WHERE según rol
            conditions = []
            params = []

            if user['role'] == 'alumno':
                # Alumno ve TODAS sus tesinas (borradores y enviadas)
                conditions.append("t.alumno_id = ?")
                params.append(user['user_id'])

            elif user['role'] == 'tutor':
                # Tutor SOLO ve tesinas ENVIADAS (no borradores)
                conditions.append("t.tutor_id = ?")
                conditions.append("t.estado_alumno = 'enviada'")
                params.append(user['user_id'])

            elif user['role'] == 'admin':
                # Admin ve todo
                pass

            # Búsqueda por título/alumno
            if search:
                conditions.append("(t.titulo LIKE ? OR u_alumno.nombre LIKE ?)")
                params.extend([f"%{search}%", f"%{search}%"])

            # Filtro de estado del tutor
            if estado_filter:
                conditions.append("t.estado_tutor = ?")
                params.append(estado_filter)

            # WHERE clause
            where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""

            # Contar total
            count_query = f"""
                SELECT COUNT(*) 
                FROM tesinas t
                LEFT JOIN usuarios u_alumno ON t.alumno_id = u_alumno.id
                LEFT JOIN usuarios u_tutor ON t.tutor_id = u_tutor.id
                {where_clause}
            """

            cursor.execute(count_query, params)
            total = cursor.fetchone()[0]

            # Paginación
            offset = (page - 1) * per_page
            query = query_base + where_clause + f" ORDER BY t.updated_at DESC LIMIT {per_page} OFFSET {offset}"

            cursor.execute(query, params)
            tesinas = [dict(row) for row in cursor.fetchall()]

        return jsonify({
            "items": tesinas,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total_items": total,
                "total_pages": (total + per_page - 1) // per_page,
                "has_prev": page > 1,
                "has_next": page * per_page < total
            }
        })

    except Exception as e:
        print(f"Error al listar tesinas: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
# =========================
# OBTENER UNA TESINA POR ID
# =========================
@tesinas_bp.route("/tesinas/<int:tesina_id>", methods=["GET"])
@token_required
def obtener_tesina(tesina_id):
    """
    Obtiene el detalle completo de una tesina
    Verifica permisos según rol y estado
    """
    try:
        user = request.current_user

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT 
                    t.id, t.titulo, t.resumen, t.nombre_archivo,
                    t.estado_alumno, t.estado_tutor, t.observaciones,
                    t.alumno_id, t.tutor_id,
                    u_alumno.nombre as alumno_nombre, u_alumno.email as alumno_email,
                    u_tutor.nombre as tutor_nombre, u_tutor.email as tutor_email,
                    t.created_at, t.updated_at
                FROM tesinas t
                LEFT JOIN usuarios u_alumno ON t.alumno_id = u_alumno.id
                LEFT JOIN usuarios u_tutor ON t.tutor_id = u_tutor.id
                WHERE t.id = ?
            """, (tesina_id,))

            tesina = cursor.fetchone()

            if not tesina:
                return jsonify({"error": "Tesina no encontrada"}), 404

            # Verificar permisos
            if user['role'] == 'alumno':
                # Alumno solo ve sus propias tesinas
                if tesina['alumno_id'] != user['user_id']:
                    return jsonify({"error": "No tenés permiso para ver esta tesina"}), 403

            elif user['role'] == 'tutor':
                # Tutor solo ve tesinas asignadas Y que estén ENVIADAS
                if tesina['tutor_id'] != user['user_id']:
                    return jsonify({"error": "No tenés permiso para ver esta tesina"}), 403
                if tesina['estado_alumno'] == 'borrador':
                    return jsonify({"error": "Esta tesina aún no fue enviada por el alumno"}), 403

            # Obtener versiones
            cursor.execute("""
                SELECT 
                    id, numero_version, nombre_archivo, 
                    estado_alumno, estado_tutor, observaciones,
                    is_current, fecha_creacion
                FROM versiones_tesinas
                WHERE tesina_id = ?
                ORDER BY numero_version DESC
            """, (tesina_id,))

            versiones = [dict(row) for row in cursor.fetchall()]

        return jsonify({
            **dict(tesina),
            "versiones": versiones
        })

    except Exception as e:
        print(f"Error al obtener tesina: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# =========================
# REVISAR TESINA (TUTOR)
# =========================
@tesinas_bp.route("/tesinas/<int:tesina_id>/revisar", methods=["PUT"])
@tutor_required
def revisar_tesina(tesina_id):
    """
    Permite al tutor aprobar o rechazar una tesina
    Solo puede revisar tesinas ENVIADAS (no borradores)
    """
    try:
        tutor_id = request.current_user['user_id']
        data = request.get_json()

        nuevo_estado = data.get('estado_tutor')  # 'aprobada' o 'rechazada'
        observaciones = data.get('observaciones', '')

        if nuevo_estado not in ['aprobada', 'rechazada']:
            return jsonify({"error": "Estado inválido"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            # Verificar que la tesina existe, está asignada al tutor Y está enviada
            cursor.execute("""
                SELECT id, estado_alumno, estado_tutor, titulo
                FROM tesinas
                WHERE id = ? AND tutor_id = ?
            """, (tesina_id, tutor_id))

            tesina = cursor.fetchone()

            if not tesina:
                return jsonify({"error": "Tesina no encontrada o no asignada a vos"}), 404

            if tesina['estado_alumno'] != 'enviada':
                return jsonify({"error": "Esta tesina aún no fue enviada por el alumno"}), 400

            # Actualizar estado
            cursor.execute("""
                UPDATE tesinas
                SET estado_tutor = ?,
                    observaciones = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (nuevo_estado, observaciones, tesina_id))

            # Actualizar versión actual también
            cursor.execute("""
                UPDATE versiones_tesinas
                SET estado_tutor = ?,
                    observaciones = ?
                WHERE tesina_id = ? AND is_current = 1
            """, (nuevo_estado, observaciones, tesina_id))

        mensaje = f"✅ Tesina '{tesina['titulo']}' {nuevo_estado}"

        return jsonify({
            "message": mensaje,
            "estado_tutor": nuevo_estado
        })

    except Exception as e:
        print(f"Error al revisar tesina: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# =========================
# GUARDAR OBSERVACIONES (TUTOR)
# =========================
@tesinas_bp.route("/tutor/versiones/<int:version_id>/observaciones", methods=["POST"])
@tutor_required
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


        return jsonify({"message": "Observaciones guardadas en versión y tesina"})
    
    except Exception as e:
        return jsonify({"error": f"Error al guardar observaciones: {str(e)}"}), 500


# =========================
# REVISAR VERSIÓN (TUTOR) — usado desde TutorTesinaPage
# =========================
@tesinas_bp.route("/tutor/versiones/<int:version_id>/revisar", methods=["POST"])
@tutor_required
def revisar_version(version_id):
    """
    Permite al tutor cambiar el estado y observaciones de una versión específica.
    Actualiza también la tesina principal.
    """
    try:
        data = request.get_json()
        estado = data.get("estado")
        observaciones = data.get("observaciones", "")

        if estado not in ["pendiente", "aprobada", "rechazada"]:
            return jsonify({"error": "Estado inválido. Debe ser: pendiente, aprobada o rechazada"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            # Verificar que la versión existe y obtener tesina_id
            cursor.execute("""
                SELECT vt.tesina_id, t.tutor_id, t.estado_alumno
                FROM versiones_tesinas vt
                JOIN tesinas t ON t.id = vt.tesina_id
                WHERE vt.id = ?
            """, (version_id,))

            row = cursor.fetchone()

            if not row:
                return jsonify({"error": "Versión no encontrada"}), 404

            # Verificar que la tesina fue enviada por el alumno
            if row['estado_alumno'] != 'enviada':
                return jsonify({"error": "Esta tesina aún no fue enviada por el alumno"}), 400

            tesina_id = row['tesina_id']

            # Actualizar la versión
            cursor.execute("""
                UPDATE versiones_tesinas
                SET estado_tutor = ?, observaciones = ?
                WHERE id = ?
            """, (estado, observaciones, version_id))

            # Actualizar la tesina principal
            cursor.execute("""
                UPDATE tesinas
                SET estado_tutor = ?, observaciones = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (estado, observaciones, tesina_id))

        return jsonify({"message": "Revisión guardada correctamente"})

    except Exception as e:
        print(f"Error al revisar versión: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error al revisar versión: {str(e)}"}), 500

    
# =========================
# EDITAR ARCHIVO TESINA (ALUMNO)
# =========================
@tesinas_bp.route("/tesinas/<int:tesina_id>/archivo", methods=["PUT"])
@alumno_required
def reemplazar_archivo_tesina(tesina_id):
    """
    Permite al alumno reemplazar el archivo de una tesina
    Solo si el tutor aún no la revisó (estado_tutor = 'pendiente')
    """
    try:
        alumno_id = request.current_user['user_id']

        with get_db() as conn:
            cursor = conn.cursor()

            # Verificar que la tesina existe y pertenece al alumno
            cursor.execute("""
                SELECT id, estado_alumno, estado_tutor, nombre_archivo, alumno_id
                FROM tesinas
                WHERE id = ? AND alumno_id = ?
            """, (tesina_id, alumno_id))

            tesina = cursor.fetchone()

            if not tesina:
                return jsonify({
                    "error": "Tesina no encontrada o no tenés permisos"
                }), 404

            # Verificar que el tutor aún no la revisó
            if tesina['estado_tutor'] != 'pendiente':
                return jsonify({
                    "error": "Solo podés editar tesinas que aún no fueron revisadas por el tutor"
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


        return jsonify({
            "message": "Archivo actualizado correctamente",
            "nuevo_archivo": nuevo_nombre
        })

    except Exception as e:
        return jsonify({
            "error": f"Error al actualizar archivo: {str(e)}"
        }), 500

# =========================
# EDITAR TESINA (ALUMNO)
# =========================
@tesinas_bp.route("/tesinas/<int:tesina_id>", methods=["PUT"])
@alumno_required
def editar_tesina(tesina_id):
    """
    Permite al alumno editar título, resumen y tutor de una tesina
    Solo si el tutor aún no la revisó (estado_tutor = 'pendiente')
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
                SELECT id, estado_alumno, estado_tutor, alumno_id
                FROM tesinas
                WHERE id = ? AND alumno_id = ?
            """, (tesina_id, alumno_id))

            tesina = cursor.fetchone()

            if not tesina:
                return jsonify({
                    "error": "Tesina no encontrada o no tenés permisos"
                }), 404

            # Verificar que el tutor aún no la revisó
            if tesina['estado_tutor'] != 'pendiente':
                return jsonify({
                    "error": "Solo podés editar tesinas que aún no fueron revisadas por el tutor"
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


        return jsonify({
            "message": "Tesina actualizada correctamente"
        })

    except Exception as e:
        return jsonify({
            "error": f"Error al actualizar tesina: {str(e)}"
        }), 500

# =========================
# REENTREGAR TESINA (ALUMNO)
# =========================
@tesinas_bp.route("/tesinas/<int:tesina_id>/reentrega", methods=["POST"])
@alumno_required
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
                AND estado_tutor = 'aprobada'
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
                    estado_alumno,
                    estado_tutor,
                    observaciones,
                    is_current,
                    fecha_creacion
                )
                VALUES (?, ?, ?, 'borrador', 'pendiente', NULL, 1, ?)
            """, (
                tesina_id,
                new_version,
                nombre_archivo,
                datetime.now().isoformat()
            ))

            # Marcar versiones anteriores como no actuales
            cursor.execute("""
                UPDATE versiones_tesinas
                SET is_current = 0
                WHERE tesina_id = ? AND numero_version != ?
            """, (tesina_id, new_version))

            cursor.execute("""
                UPDATE tesinas
                SET estado_alumno = 'borrador',
                    estado_tutor = 'pendiente',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (tesina_id,))


        return jsonify({"message": "Nueva versión subida", "version": new_version})
    
    except Exception as e:
        return jsonify({"error": f"Error al reenviar tesina: {str(e)}"}), 500


# =========================
# HISTORIAL DE VERSIONES (AUTENTICADO)
# =========================
@tesinas_bp.route("/tesinas/<int:tesina_id>/versions", methods=["GET"])
@token_required
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
                    estado_alumno,
                    estado_tutor,
                    observaciones,
                    is_current,
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
                "estado_alumno": r['estado_alumno'],
                "estado_tutor": r['estado_tutor'],
                "observaciones": r['observaciones'],
                "fecha_creacion": r['fecha_creacion'],
                "is_current": bool(r['is_current'])
            })

        return jsonify(versiones)
    
    except Exception as e:
        return jsonify({"error": f"Error al obtener versiones: {str(e)}"}), 500

# =========================
# ELIMINAR TESINA (ADMIN)
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