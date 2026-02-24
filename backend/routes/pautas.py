from flask import Blueprint, jsonify, request
from utils.db_utils import get_db
from utils.jwt_utils import token_required, admin_required

pautas_bp = Blueprint("pautas", __name__)


# =========================
# LISTAR TODAS LAS PAUTAS AGRUPADAS (AUTENTICADO)
# =========================
@pautas_bp.route("/", methods=["GET"])
@token_required  # ← Cualquier usuario autenticado
def listar_pautas():
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT c.id, c.nombre, p.id, p.titulo, p.descripcion, p.enlace_externo
                FROM categorias_pautas c
                LEFT JOIN pautas p ON p.categoria_id = c.id
                ORDER BY c.orden, p.orden
            """)

            datos = cursor.fetchall()

        resultado = {}

        for row in datos:
            cat_id = row[0]
            cat_nombre = row[1]
            p_id = row[2]
            titulo = row[3]
            descripcion = row[4]
            enlace = row[5]

            if cat_nombre not in resultado:
                resultado[cat_nombre] = {
                    "id": cat_id,
                    "nombre": cat_nombre,
                    "pautas": []
                }

            if p_id:
                resultado[cat_nombre]["pautas"].append({
                    "id": p_id,
                    "titulo": titulo,
                    "descripcion": descripcion,
                    "enlace_externo": enlace
                })

        return jsonify(list(resultado.values()))
    
    except Exception as e:
        return jsonify({"error": f"Error al listar pautas: {str(e)}"}), 500


# =========================
# LISTAR CATEGORÍAS (AUTENTICADO)
# =========================
@pautas_bp.route("/categorias", methods=["GET"])
@token_required  # ← Cualquier usuario autenticado
def listar_categorias():
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT id, nombre, orden
                FROM categorias_pautas
                ORDER BY orden
            """)
            
            categorias = [
                {
                    "id": row["id"],
                    "nombre": row["nombre"],
                    "orden": row["orden"]
                }
                for row in cursor.fetchall()
            ]

        return jsonify(categorias)
    
    except Exception as e:
        return jsonify({"error": f"Error al listar categorías: {str(e)}"}), 500


# =========================
# CREAR CATEGORÍA (SOLO ADMIN)
# =========================
@pautas_bp.route("/categorias", methods=["POST"])
@admin_required  # ← Solo admin
def crear_categoria():
    try:
        data = request.json

        nombre = data.get("nombre")
        orden = data.get("orden", 0)

        if not nombre:
            return jsonify({"error": "Falta el nombre de la categoría"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT COUNT(*)
                FROM categorias_pautas
                WHERE nombre = ?
            """, (nombre,))

            if cursor.fetchone()[0] > 0:
                return jsonify({"error": "Ya existe una categoría con ese nombre"}), 400

            cursor.execute("""
                INSERT INTO categorias_pautas (nombre, orden)
                VALUES (?, ?)
            """, (nombre, orden))

            conn.commit()

        return jsonify({"message": "Categoría creada correctamente"}), 201
    
    except Exception as e:
        return jsonify({"error": f"Error al crear categoría: {str(e)}"}), 500


# =========================
# EDITAR CATEGORÍA (SOLO ADMIN)
# =========================
@pautas_bp.route("/categorias/<int:categoria_id>", methods=["PUT"])
@admin_required  # ← Solo admin
def editar_categoria(categoria_id):
    try:
        data = request.json

        nombre = data.get("nombre")
        orden = data.get("orden")

        if not nombre:
            return jsonify({"error": "Falta el nombre de la categoría"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT COUNT(*)
                FROM categorias_pautas
                WHERE id = ?
            """, (categoria_id,))

            if cursor.fetchone()[0] == 0:
                return jsonify({"error": "Categoría no encontrada"}), 404

            cursor.execute("""
                SELECT COUNT(*)
                FROM categorias_pautas
                WHERE nombre = ?
                AND id != ?
            """, (nombre, categoria_id))

            if cursor.fetchone()[0] > 0:
                return jsonify({"error": "Ya existe otra categoría con ese nombre"}), 400

            cursor.execute("""
                UPDATE categorias_pautas
                SET nombre = ?, orden = ?
                WHERE id = ?
            """, (nombre, orden, categoria_id))

            conn.commit()

        return jsonify({"message": "Categoría actualizada correctamente"})
    
    except Exception as e:
        return jsonify({"error": f"Error al editar categoría: {str(e)}"}), 500


# =========================
# ELIMINAR CATEGORÍA (SOLO ADMIN)
# =========================
@pautas_bp.route("/categorias/<int:categoria_id>", methods=["DELETE"])
@admin_required  # ← Solo admin
def eliminar_categoria(categoria_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT COUNT(*)
                FROM pautas
                WHERE categoria_id = ?
            """, (categoria_id,))

            if cursor.fetchone()[0] > 0:
                return jsonify({
                    "error": "No se puede eliminar la categoría: tiene pautas asociadas"
                }), 400

            cursor.execute("""
                DELETE FROM categorias_pautas
                WHERE id = ?
            """, (categoria_id,))

            if cursor.rowcount == 0:
                return jsonify({"error": "Categoría no encontrada"}), 404

            conn.commit()

        return jsonify({"message": "Categoría eliminada correctamente"})
    
    except Exception as e:
        return jsonify({"error": f"Error al eliminar categoría: {str(e)}"}), 500


# =========================
# LISTAR PAUTAS POR CATEGORÍA (AUTENTICADO)
# =========================
@pautas_bp.route("/categoria/<int:categoria_id>", methods=["GET"])
@token_required  # ← Cualquier usuario autenticado
def pautas_por_categoria(categoria_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT nombre
                FROM categorias_pautas
                WHERE id = ?
            """, (categoria_id,))

            categoria = cursor.fetchone()
            if not categoria:
                return jsonify({"error": "Categoría no encontrada"}), 404

            cursor.execute("""
                SELECT id, titulo, descripcion, enlace_externo, orden
                FROM pautas
                WHERE categoria_id = ?
                ORDER BY orden
            """, (categoria_id,))

            pautas = [
                {
                    "id": row["id"],
                    "titulo": row["titulo"],
                    "descripcion": row["descripcion"],
                    "enlace_externo": row["enlace_externo"],
                    "orden": row["orden"]
                }
                for row in cursor.fetchall()
            ]

        return jsonify({
            "categoria": categoria["nombre"],
            "pautas": pautas
        })
    
    except Exception as e:
        return jsonify({"error": f"Error al listar pautas de la categoría: {str(e)}"}), 500


# =========================
# OBTENER UNA PAUTA (AUTENTICADO)
# =========================
@pautas_bp.route("/<int:pauta_id>", methods=["GET"])
@token_required  # ← Cualquier usuario autenticado
def obtener_pauta(pauta_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT id, titulo, descripcion, categoria_id, enlace_externo, orden
                FROM pautas
                WHERE id = ?
            """, (pauta_id,))

            pauta = cursor.fetchone()

        if not pauta:
            return jsonify({"error": "Pauta no encontrada"}), 404

        return jsonify({
            "id": pauta["id"],
            "titulo": pauta["titulo"],
            "descripcion": pauta["descripcion"],
            "categoria_id": pauta["categoria_id"],
            "enlace_externo": pauta["enlace_externo"],
            "orden": pauta["orden"]
        })
    
    except Exception as e:
        return jsonify({"error": f"Error al obtener pauta: {str(e)}"}), 500


# =========================
# CREAR NUEVA PAUTA (SOLO ADMIN)
# =========================
@pautas_bp.route("/", methods=["POST"])
@admin_required  # ← Solo admin
def crear_pauta():
    try:
        data = request.json

        titulo = data.get("titulo")
        descripcion = data.get("descripcion")
        categoria_id = data.get("categoria_id")
        enlace = data.get("enlace_externo", "")
        orden = data.get("orden", 0)

        if not all([titulo, descripcion, categoria_id]):
            return jsonify({"error": "Faltan datos obligatorios"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT COUNT(*)
                FROM categorias_pautas
                WHERE id = ?
            """, (categoria_id,))

            if cursor.fetchone()[0] == 0:
                return jsonify({"error": "La categoría especificada no existe"}), 400

            cursor.execute("""
                INSERT INTO pautas (titulo, descripcion, categoria_id, enlace_externo, orden)
                VALUES (?, ?, ?, ?, ?)
            """, (titulo, descripcion, categoria_id, enlace, orden))

            conn.commit()

        return jsonify({"message": "Pauta creada correctamente"}), 201
    
    except Exception as e:
        return jsonify({"error": f"Error al crear pauta: {str(e)}"}), 500


# =========================
# EDITAR PAUTA (SOLO ADMIN)
# =========================
@pautas_bp.route("/<int:pauta_id>", methods=["PUT"])
@admin_required  # ← Solo admin
def editar_pauta(pauta_id):
    try:
        data = request.json

        titulo = data.get("titulo")
        descripcion = data.get("descripcion")
        categoria_id = data.get("categoria_id")
        enlace = data.get("enlace_externo", "")
        orden = data.get("orden", 0)

        if not all([titulo, descripcion, categoria_id]):
            return jsonify({"error": "Faltan datos obligatorios"}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT COUNT(*)
                FROM pautas
                WHERE id = ?
            """, (pauta_id,))

            if cursor.fetchone()[0] == 0:
                return jsonify({"error": "Pauta no encontrada"}), 404

            cursor.execute("""
                SELECT COUNT(*)
                FROM categorias_pautas
                WHERE id = ?
            """, (categoria_id,))

            if cursor.fetchone()[0] == 0:
                return jsonify({"error": "La categoría especificada no existe"}), 400

            cursor.execute("""
                UPDATE pautas
                SET titulo = ?, descripcion = ?, categoria_id = ?, enlace_externo = ?, orden = ?
                WHERE id = ?
            """, (titulo, descripcion, categoria_id, enlace, orden, pauta_id))

            conn.commit()

        return jsonify({"message": "Pauta actualizada correctamente"})
    
    except Exception as e:
        return jsonify({"error": f"Error al editar pauta: {str(e)}"}), 500


# =========================
# ELIMINAR PAUTA (SOLO ADMIN)
# =========================
@pautas_bp.route("/<int:pauta_id>", methods=["DELETE"])
@admin_required  # ← Solo admin
def eliminar_pauta(pauta_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("DELETE FROM pautas WHERE id = ?", (pauta_id,))

            if cursor.rowcount == 0:
                return jsonify({"error": "Pauta no encontrada"}), 404

            conn.commit()

        return jsonify({"message": "Pauta eliminada correctamente"})
    
    except Exception as e:
        return jsonify({"error": f"Error al eliminar pauta: {str(e)}"}), 500