from flask import Blueprint, send_from_directory, jsonify
import os
from config import UPLOAD_FOLDER, UPLOAD_EJEMPLOS_FOLDER
from utils.jwt_utils import token_required
from utils.db_utils import get_db

files_bp = Blueprint("files", __name__)


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

        # Verificar que el archivo pertenece a una tesina accesible para el usuario
        current_user = getattr(__import__('flask', fromlist=['request']).request, 'current_user', None)
        if current_user:
            user_id = current_user.get('id')
            role = current_user.get('role')

            with get_db() as conn:
                cursor = conn.cursor()

                if role == 'alumno':
                    # El alumno solo puede acceder a sus propias tesinas
                    cursor.execute(
                        "SELECT id FROM tesinas WHERE nombre_archivo = ? AND alumno_id = ?",
                        (filename, user_id)
                    )
                elif role == 'tutor':
                    # El tutor solo puede acceder a tesinas que le fueron asignadas
                    cursor.execute(
                        "SELECT id FROM tesinas WHERE nombre_archivo = ? AND tutor_id = ?",
                        (filename, user_id)
                    )
                else:
                    # Admin puede acceder a todo
                    cursor.execute(
                        "SELECT id FROM tesinas WHERE nombre_archivo = ?",
                        (filename,)
                    )

                if cursor.fetchone() is None:
                    return jsonify({"error": "No tenés permiso para acceder a este archivo"}), 403

        return send_from_directory(
            UPLOAD_FOLDER,
            filename,
            as_attachment=True
        )

    except Exception as e:
        return jsonify({"error": f"Error al descargar archivo: {str(e)}"}), 500


# =========================
# Descargar archivo de ejemplo (AUTENTICADO)
# =========================
@files_bp.route("/uploads_ejemplos/<path:filename>")
@token_required  # ← Cualquier usuario autenticado
def descargar_archivo_ejemplo(filename):
    try:
        filepath = os.path.join(UPLOAD_EJEMPLOS_FOLDER, filename)
        
        if not os.path.exists(filepath):
            return jsonify({"error": "Archivo no encontrado"}), 404

        return send_from_directory(
            UPLOAD_EJEMPLOS_FOLDER,
            filename,
            as_attachment=True
        )
    
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

        current_user = getattr(__import__('flask', fromlist=['request']).request, 'current_user', None)
        if current_user:
            user_id = current_user.get('id')
            role = current_user.get('role')

            with get_db() as conn:
                cursor = conn.cursor()

                if role == 'alumno':
                    cursor.execute(
                        "SELECT id FROM tesinas WHERE nombre_archivo = ? AND alumno_id = ?",
                        (filename, user_id)
                    )
                elif role == 'tutor':
                    cursor.execute(
                        "SELECT id FROM tesinas WHERE nombre_archivo = ? AND tutor_id = ?",
                        (filename, user_id)
                    )
                else:
                    cursor.execute(
                        "SELECT id FROM tesinas WHERE nombre_archivo = ?",
                        (filename,)
                    )

                if cursor.fetchone() is None:
                    return jsonify({"error": "No tenés permiso para acceder a este archivo"}), 403

        return send_from_directory(
            UPLOAD_FOLDER,
            filename,
            as_attachment=False
        )

    except Exception as e:
        return jsonify({"error": f"Error al mostrar archivo: {str(e)}"}), 500


# =========================
# Vista previa de ejemplo (AUTENTICADO)
# =========================
@files_bp.route("/preview/uploads_ejemplos/<path:filename>")
@token_required  # ← Cualquier usuario autenticado
def preview_archivo_ejemplo(filename):
    try:
        filepath = os.path.join(UPLOAD_EJEMPLOS_FOLDER, filename)
        
        if not os.path.exists(filepath):
            return jsonify({"error": "Archivo no encontrado"}), 404

        return send_from_directory(
            UPLOAD_EJEMPLOS_FOLDER,
            filename,
            as_attachment=False
        )
    
    except Exception as e:
        return jsonify({"error": f"Error al mostrar archivo: {str(e)}"}), 500