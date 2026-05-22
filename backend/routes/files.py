from flask import Blueprint, send_from_directory, jsonify, request
import os
from config import UPLOAD_FOLDER, UPLOAD_EJEMPLOS_FOLDER
from utils.jwt_utils import token_required
from utils.db_utils import get_db

files_bp = Blueprint("files", __name__)


def _verificar_acceso_archivo(filename, current_user):
    """
    Verifica que el usuario tiene acceso al archivo.
    Busca tanto en tesinas (nombre_archivo principal) como en versiones_tesinas.
    Retorna True si tiene acceso, False si no.
    """
    if not current_user:
        return False

    user_id = current_user.get('user_id')  # FIX: era 'id', debe ser 'user_id'
    role = current_user.get('role')

    with get_db() as conn:
        cursor = conn.cursor()

        if role == 'alumno':
            cursor.execute("""
                SELECT t.id FROM tesinas t
                WHERE t.alumno_id = ? AND (
                    t.nombre_archivo = ?
                    OR EXISTS (
                        SELECT 1 FROM versiones_tesinas v
                        WHERE v.tesina_id = t.id AND v.nombre_archivo = ?
                    )
                )
            """, (user_id, filename, filename))

        elif role == 'tutor':
            cursor.execute("""
                SELECT t.id FROM tesinas t
                WHERE t.tutor_id = ? AND t.estado_alumno = 'enviada' AND (
                    t.nombre_archivo = ?
                    OR EXISTS (
                        SELECT 1 FROM versiones_tesinas v
                        WHERE v.tesina_id = t.id AND v.nombre_archivo = ?
                    )
                )
            """, (user_id, filename, filename))

        else:
            cursor.execute("""
                SELECT t.id FROM tesinas t
                WHERE t.nombre_archivo = ?
                OR EXISTS (
                    SELECT 1 FROM versiones_tesinas v
                    WHERE v.tesina_id = t.id AND v.nombre_archivo = ?
                )
            """, (filename, filename))

        return cursor.fetchone() is not None


# =========================
# Descargar archivo de tesina (AUTENTICADO + VALIDACIÓN DE ACCESO)
# =========================
@files_bp.route("/uploads/<path:filename>")
@token_required
def descargar_archivo_tesina(filename):
    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        if not os.path.exists(filepath):
            return jsonify({"error": "Archivo no encontrado"}), 404

        current_user = request.current_user
        if not _verificar_acceso_archivo(filename, current_user):
            return jsonify({"error": "No tenés permiso para acceder a este archivo"}), 403

        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)

    except Exception as e:
        return jsonify({"error": f"Error al descargar archivo: {str(e)}"}), 500


# =========================
# Descargar archivo de ejemplo (AUTENTICADO)
# =========================
@files_bp.route("/uploads_ejemplos/<path:filename>")
@token_required
def descargar_archivo_ejemplo(filename):
    try:
        filepath = os.path.join(UPLOAD_EJEMPLOS_FOLDER, filename)

        if not os.path.exists(filepath):
            return jsonify({"error": "Archivo no encontrado"}), 404

        return send_from_directory(UPLOAD_EJEMPLOS_FOLDER, filename, as_attachment=True)

    except Exception as e:
        return jsonify({"error": f"Error al descargar archivo: {str(e)}"}), 500


# =========================
# Vista previa de archivo tesina (AUTENTICADO + VALIDACIÓN DE ACCESO)
# =========================
@files_bp.route("/preview/uploads/<path:filename>")
@token_required
def preview_archivo_tesina(filename):
    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        if not os.path.exists(filepath):
            return jsonify({"error": "Archivo no encontrado"}), 404

        current_user = request.current_user
        if not _verificar_acceso_archivo(filename, current_user):
            return jsonify({"error": "No tenés permiso para acceder a este archivo"}), 403

        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=False)

    except Exception as e:
        return jsonify({"error": f"Error al mostrar archivo: {str(e)}"}), 500


# =========================
# Vista previa de ejemplo (AUTENTICADO)
# =========================
@files_bp.route("/preview/uploads_ejemplos/<path:filename>")
@token_required
def preview_archivo_ejemplo(filename):
    try:
        filepath = os.path.join(UPLOAD_EJEMPLOS_FOLDER, filename)

        if not os.path.exists(filepath):
            return jsonify({"error": "Archivo no encontrado"}), 404

        return send_from_directory(UPLOAD_EJEMPLOS_FOLDER, filename, as_attachment=False)

    except Exception as e:
        return jsonify({"error": f"Error al mostrar archivo: {str(e)}"}), 500