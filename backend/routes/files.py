from flask import Blueprint, send_from_directory, jsonify
import os
from config import UPLOAD_FOLDER, UPLOAD_EJEMPLOS_FOLDER
from utils.jwt_utils import token_required

files_bp = Blueprint("files", __name__)


# =========================
# Descargar archivo de tesina (AUTENTICADO)
# =========================
@files_bp.route("/uploads/<path:filename>")
@token_required  # ← Cualquier usuario autenticado
def descargar_archivo_tesina(filename):
    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(filepath):
            return jsonify({"error": "Archivo no encontrado"}), 404

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
# Vista previa de archivo tesina (AUTENTICADO)
# =========================
@files_bp.route("/preview/uploads/<path:filename>")
@token_required  # ← Cualquier usuario autenticado
def preview_archivo_tesina(filename):
    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(filepath):
            return jsonify({"error": "Archivo no encontrado"}), 404

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