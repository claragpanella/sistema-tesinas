import json
import logging
import os
import re
import traceback

from flask import Blueprint, jsonify, request

from config import GROQ_API_KEY
from utils.db_utils import get_db
from utils.jwt_utils import alumno_o_tutor_required

# ─── Logging ──────────────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)

chat_bp = Blueprint('chat', __name__)

# ─── Constantes ───────────────────────────────────────────────────────────────
# Palabras vacías excluidas del análisis de repetición (constante a nivel módulo)
HISTORIAL_LIMITE = 20  # mensajes del historial enviados a Groq

# ─── Cliente Groq ─────────────────────────────────────────────────────────────
# Inicializado en None para evitar NameError si la importación falla
client = None
USE_GROQ = bool(GROQ_API_KEY)

if USE_GROQ:
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)
        logger.info("Cliente Groq configurado correctamente")
    except Exception:
        logger.exception("Error configurando cliente Groq; se usará modo mock")
        USE_GROQ = False


def get_groq_client():
    """Retorna el cliente Groq si está disponible, None si no."""
    return client if USE_GROQ else None


# ─── Extracción de texto ──────────────────────────────────────────────────────
# Los imports de PyPDF2 y docx se hacen al nivel de módulo para evitar
# imports repetidos dentro de la función (aunque Python los cachea, es
# mala práctica y dificulta la detección de dependencias faltantes).
try:
    import PyPDF2
    _PYPDF2_OK = True
except ImportError:
    _PYPDF2_OK = False
    logger.warning("PyPDF2 no disponible; no se podrán leer PDFs")

try:
    import docx as _docx_module
    _DOCX_OK = True
except ImportError:
    _DOCX_OK = False
    logger.warning("python-docx no disponible; no se podrán leer archivos .docx")


def extract_text_from_file(filepath: str) -> str | None:
    """Extrae texto plano de un PDF o DOCX. Retorna None si falla."""
    try:
        ext = filepath.rsplit('.', 1)[-1].lower()
        if ext == 'pdf':
            if not _PYPDF2_OK:
                logger.error("PyPDF2 no instalado; no se puede leer el PDF")
                return None
            with open(filepath, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                return "".join(page.extract_text() or "" for page in reader.pages)
        elif ext in ('docx', 'doc'):
            if not _DOCX_OK:
                logger.error("python-docx no instalado; no se puede leer el DOCX")
                return None
            doc = _docx_module.Document(filepath)
            return "\n".join(p.text for p in doc.paragraphs)
        return None
    except Exception:
        logger.exception("Error extrayendo texto de %s", filepath)
        return None


# ─── Respuesta mock (fallback sin Groq) ──────────────────────────────────────
def get_mock_response(user_message: str, tesina_titulo: str | None = None) -> str:
    msg_lower = user_message.lower()

    if 'estructura' in msg_lower or 'organiz' in msg_lower:
        return """Para mejorar la estructura de tu tesina, te recomiendo seguir este esquema:

📋 **Estructura recomendada:**

1. **Portada**: Título, autor, institución, fecha
2. **Resumen/Abstract**: 200-300 palabras
3. **Introducción**: Contexto del problema, objetivos, justificación y alcance
4. **Marco Teórico**: Fundamentación bibliográfica
5. **Metodología**: Diseño, instrumentos, procedimientos
6. **Resultados**: Presentación clara de datos
7. **Análisis y Discusión**: Interpretación de resultados
8. **Conclusiones**: Síntesis y recomendaciones
9. **Referencias**: Formato APA 7ma edición
10. **Anexos**: Material complementario

¿Querés que revise alguna sección específica?"""

    elif any(k in msg_lower for k in ('apa', 'referencia', 'bibliograf', 'cita')):
        return """📚 **Guía rápida de formato APA 7ma edición:**

**LIBROS:**
Apellido, N. (Año). *Título del libro en cursiva*. Editorial.

**ARTÍCULOS DE REVISTA:**
Apellido, N. (Año). Título del artículo. *Nombre de la Revista*, volumen(número), páginas.

**SITIOS WEB:**
Apellido, N. (Año, día mes). Título del artículo. Nombre del sitio. URL

**CITAS EN EL TEXTO:**
- Un autor: (García, 2020)
- Dos autores: (García & López, 2020)
- Tres o más: (García et al., 2020)

¿Necesitás ayuda con alguna referencia específica?"""

    contexto_msg = f"\n\n📄 Estoy analizando tu tesina '{tesina_titulo}'" if tesina_titulo else ""
    return (
        f"¡Hola! Soy tu asistente académico.{contexto_msg}\n\n"
        "Puedo ayudarte con estructura, referencias APA, redacción académica y revisión de secciones.\n\n"
        "¿En qué específicamente puedo ayudarte hoy?"
    )


# ─── System prompts ───────────────────────────────────────────────────────────
_BASE_INSTRUCCIONES = """Usá español rioplatense (vos, querés, tenés).
Limitá tus respuestas exclusivamente a temas académicos. Si el usuario consulta algo fuera de ese ámbito, indicalo de forma clara y breve.
No inventes información. Si no tenés suficiente contexto, pedí más detalles."""


def get_system_prompt(user_role: str) -> str:
    if user_role == 'alumno':
        return f"""Sos TesiBot, un asistente académico especializado en tesinas universitarias argentinas.

Tu rol es ayudar al alumno con:
- Estructura y organización del trabajo
- Formato APA 7ma edición para referencias y citas
- Redacción académica clara, formal y coherente
- Revisión de contenido (introducción, marco teórico, metodología, conclusiones)
- Sugerencias constructivas, específicas y educativas

Características de tus respuestas:
- Tono educativo, alentador y paciente
- Cuando detectés un error, explicá por qué es un problema y cómo corregirlo
- Proporcioná ejemplos concretos siempre que sea posible
- Podés referirte a vos mismo como "TesiBot" si es natural

{_BASE_INSTRUCCIONES}"""

    # tutor
    return f"""Sos TesiBot, un asistente para tutores académicos de tesinas universitarias argentinas.

Tu rol es ayudar al tutor con:
- Evaluar la calidad académica y metodológica de una tesina
- Detectar problemas de estructura, redacción, coherencia y referencias
- Redactar devoluciones claras, precisas y constructivas para el alumno
- Sugerir qué correcciones pedirle al alumno y cómo comunicarlas
- Comparar el trabajo con los estándares académicos esperados

Características de tus respuestas:
- Tono técnico, analítico y directo
- Señalá los problemas con claridad, sin suavizarlos innecesariamente
- Cuando sugieras una devolución para el alumno, enmarcala explícitamente
- Recordá siempre que estás hablando con el tutor, no con el autor del trabajo
- Podés referirte a vos mismo como "TesiBot" si es natural

{_BASE_INSTRUCCIONES}"""


# ─── Análisis de tesina ───────────────────────────────────────────────────────
def _limpiar_json_respuesta(texto: str) -> str:
    """Elimina bloques de markdown (```json ... ```) de una respuesta."""
    return re.sub(r'^```(?:json)?\s*|\s*```$', '', texto.strip())


def analizar_tesina_con_ia(
    texto: str, titulo: str = "", resumen: str = ""
) -> tuple[list, str]:
    """
    Analiza la tesina con IA (Groq). Retorna (list[dict], str).
    Si Groq no está disponible o falla, retorna listas vacías.
    """
    groq = get_groq_client()
    if not groq:
        logger.warning("Groq no disponible; no se puede analizar la tesina")
        return [], ""

    prompt_analisis = f"""Sos un experto evaluador de tesinas universitarias argentinas.

Analizá la siguiente tesina y detectá problemas comunes.

TESINA:
Título: {titulo}
Resumen: {resumen}

CONTENIDO (extracto):
{texto[:15000]}

INSTRUCCIONES:
Analizá la tesina y detectá problemas en estas categorías:
1. Extensión del documento
2. Estructura (secciones obligatorias: introducción, marco teórico, metodología, resultados, conclusiones, referencias)
3. Referencias y citas (formato APA)
4. Redacción académica (uso de primera persona, párrafos largos, palabras repetitivas)
5. Figuras y tablas
6. Calidad del contenido

Para cada problema detectado, respondé en formato JSON con esta estructura:
{{
  "problemas": [
    {{
      "tipo": "error|warning|info",
      "categoria": "Extensión|Estructura|Referencias|Redacción|...",
      "titulo": "Título corto del problema",
      "descripcion": "Descripción detallada del problema detectado",
      "sugerencia": "Recomendación específica para solucionarlo"
    }}
  ],
  "resumen": "Resumen general del análisis en 2-3 oraciones"
}}

RESPONDE SOLO CON EL JSON, sin texto adicional."""

    try:
        response = groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "Sos un experto evaluador de tesinas. Respondés SOLO en formato JSON válido.",
                },
                {"role": "user", "content": prompt_analisis},
            ],
            temperature=0.3,
            max_tokens=2000,
        )

        respuesta_ia = _limpiar_json_respuesta(response.choices[0].message.content)
        resultado = json.loads(respuesta_ia)
        return resultado.get('problemas', []), resultado.get('resumen', '')

    except json.JSONDecodeError:
        logger.exception("Groq retornó JSON inválido")
    except Exception:
        logger.exception("Error en análisis con IA")

    return [], ""



# =============================================================================
# Endpoint principal del chat
# =============================================================================

@chat_bp.route("/chat/asistente", methods=["POST"])
@alumno_o_tutor_required
def chat_asistente():
    try:
        user_id   = request.current_user['user_id']
        user_role = request.current_user['role']
        data      = request.get_json()

        user_message        = data.get('message', '').strip()
        tesina_id_frontend  = data.get('tesina_id')
        conversacion_id     = data.get('conversacion_id')

        if not user_message:
            return jsonify({"error": "Mensaje vacío"}), 400

        # ── Una sola conexión para todas las lecturas de este request ─────────
        tesina_titulo        = None
        tesina_context       = ""
        nombre_alumno_tesina = None
        nombre_usuario       = "usuario"
        tesina_id            = tesina_id_frontend
        historial_mensajes   = []

        with get_db() as conn:
            cursor = conn.cursor()

            # Nombre del usuario
            cursor.execute("SELECT nombre FROM usuarios WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            nombre_usuario = row['nombre'] if row else "usuario"

            # Si hay conversación activa, el tesina_id viene de la BD (fuente de verdad)
            if conversacion_id:
                cursor.execute(
                    "SELECT tesina_id FROM conversaciones WHERE id = ? AND usuario_id = ?",
                    (conversacion_id, user_id),
                )
                conv_row = cursor.fetchone()
                if conv_row:
                    tesina_id = conv_row['tesina_id']
                logger.debug(
                    "tesina_id_frontend=%s conversacion_id=%s tesina_id_final=%s",
                    tesina_id_frontend, conversacion_id, tesina_id,
                )

            # Contexto de la tesina
            if tesina_id:
                cursor.execute(
                    "SELECT titulo, resumen, nombre_archivo FROM tesinas WHERE id = ?",
                    (tesina_id,),
                )
                tesina = cursor.fetchone()
                if tesina:
                    tesina_titulo = tesina['titulo']
                    filepath = os.path.join('uploads', tesina['nombre_archivo'])
                    if os.path.exists(filepath):
                        file_content = extract_text_from_file(filepath)
                        if file_content:
                            tesina_context = (
                                "INSTRUCCIÓN CRÍTICA: Ya tenés acceso COMPLETO al contenido de la tesina. "
                                "NUNCA le pidas al usuario que comparta, envíe, suba o adjunte su trabajo. "
                                "NUNCA digas que no tenés acceso al archivo. El texto completo está abajo.\n\n"
                                f"=== TESINA ===\n"
                                f"Título: {tesina['titulo']}\n"
                                f"Resumen: {tesina['resumen']}\n\n"
                                f"CONTENIDO COMPLETO:\n{file_content[:12000]}\n"
                                "=== FIN TESINA ===\n\n"
                                "Analizá ESTE contenido directamente. No necesitás pedir nada más al usuario."
                            )

                if user_role == 'tutor':
                    cursor.execute(
                        """SELECT u.nombre FROM usuarios u
                           JOIN tesinas t ON t.alumno_id = u.id
                           WHERE t.id = ?""",
                        (tesina_id,),
                    )
                    alumno_row = cursor.fetchone()
                    nombre_alumno_tesina = alumno_row['nombre'] if alumno_row else None

            # Historial de la conversación
            if conversacion_id:
                cursor.execute(
                    "SELECT id FROM conversaciones WHERE id = ? AND usuario_id = ?",
                    (conversacion_id, user_id),
                )
                if cursor.fetchone():
                    cursor.execute(
                        """SELECT rol, contenido FROM mensajes_chat
                           WHERE conversacion_id = ?
                           ORDER BY created_at ASC
                           LIMIT ?""",
                        (conversacion_id, HISTORIAL_LIMITE),
                    )
                    historial_mensajes = [
                        {"role": "assistant" if r['rol'] == 'assistant' else "user",
                         "content": r['contenido']}
                        for r in cursor.fetchall()
                    ]

        # ── Construcción del system prompt ────────────────────────────────────
        aviso_alumno = (
            f"\n\n⚠️ CONTEXTO: Estás revisando la tesina de {nombre_alumno_tesina}. "
            "Dirigite siempre al tutor, no al autor del trabajo."
            if user_role == 'tutor' and nombre_alumno_tesina else ""
        )
        nombre_rol = "alumno" if user_role == 'alumno' else "tutor"
        system_instruction = (
            get_system_prompt(user_role)
            + f"\n\nEl nombre del {nombre_rol} con quien estás hablando es {nombre_usuario}. "
              "Saludalo usando su nombre completo al inicio de la conversación si es el primer mensaje. "
              "No uses ningún otro nombre para referirte a esta persona."
            + (f"\n\n{tesina_context}" if tesina_context else "")
            + aviso_alumno
        )

        groq_messages = [{"role": "system", "content": system_instruction}]
        groq_messages.extend(historial_mensajes)
        groq_messages.append({"role": "user", "content": user_message})

        # ── Llamada a Groq ────────────────────────────────────────────────────
        response_text = None
        mode = "mock"

        if USE_GROQ:
            try:
                # Usamos el modelo más capaz cuando hay contenido de tesina para analizar
                model = "llama-3.3-70b-versatile" if tesina_context else "llama-3.1-8b-instant"
                max_tok = 2048 if tesina_context else 1024
                response = client.chat.completions.create(
                    model=model,
                    messages=groq_messages,
                    max_tokens=max_tok,
                    temperature=0.7,
                )
                response_text = response.choices[0].message.content
                mode = "groq"

            except Exception as e:
                logger.exception("Error al llamar a Groq")
                error_str = str(e)
                if "429" in error_str or "rate_limit" in error_str.lower():
                    match = re.search(r'(\d+(?:\.\d+)?)\s*s', error_str)
                    wait_time = match.group(1) if match else "unos segundos"
                    response_text = (
                        f"⚠️ El asistente está recibiendo muchas consultas. "
                        f"Por favor, reintentá en {wait_time} segundos."
                    )
                    mode = "rate_limited"
                else:
                    response_text = get_mock_response(user_message, tesina_titulo)
                    mode = "error_fallback"

        if response_text is None:
            response_text = get_mock_response(user_message, tesina_titulo)

        # ── Persistencia ──────────────────────────────────────────────────────
        with get_db() as conn:
            cursor = conn.cursor()

            if not conversacion_id:
                titulo_auto = user_message[:50] + ("..." if len(user_message) > 50 else "")
                cursor.execute(
                    "INSERT INTO conversaciones (usuario_id, rol_usuario, tesina_id, titulo) VALUES (?, ?, ?, ?)",
                    (user_id, user_role, tesina_id, titulo_auto),
                )
                conversacion_id = cursor.lastrowid
            else:
                cursor.execute(
                    "UPDATE conversaciones SET updated_at = CURRENT_TIMESTAMP WHERE id = ? AND usuario_id = ?",
                    (conversacion_id, user_id),
                )

            cursor.executemany(
                "INSERT INTO mensajes_chat (conversacion_id, rol, contenido) VALUES (?, ?, ?)",
                [
                    (conversacion_id, 'user',      user_message),
                    (conversacion_id, 'assistant',  response_text),
                ],
            )

        return jsonify({
            "response":              response_text,
            "tesina_id":             tesina_id,
            "conversacion_id":       conversacion_id,
            "nombre_alumno_tesina":  nombre_alumno_tesina,
            "mode":                  mode,
        })

    except Exception:
        logger.exception("Error inesperado en chat_asistente")
        return jsonify({"error": "Error en el asistente"}), 500


# =============================================================================
# Gestión de conversaciones
# =============================================================================

@chat_bp.route("/chat/conversaciones", methods=["GET"])
@alumno_o_tutor_required
def listar_conversaciones():
    try:
        user_id = request.current_user['user_id']
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT
                    c.id, c.titulo, c.tesina_id, c.created_at, c.updated_at,
                    t.titulo  AS tesina_titulo,
                    COUNT(m.id) AS total_mensajes,
                    (SELECT contenido FROM mensajes_chat
                     WHERE conversacion_id = c.id
                     ORDER BY created_at DESC LIMIT 1) AS ultimo_mensaje
                FROM conversaciones c
                LEFT JOIN tesinas t ON c.tesina_id = t.id
                LEFT JOIN mensajes_chat m ON m.conversacion_id = c.id
                WHERE c.usuario_id = ?
                GROUP BY c.id
                ORDER BY c.updated_at DESC
            """, (user_id,))
            return jsonify([dict(row) for row in cursor.fetchall()])
    except Exception:
        logger.exception("Error al listar conversaciones")
        return jsonify({"error": "Error al obtener conversaciones"}), 500


@chat_bp.route("/chat/conversaciones", methods=["POST"])
@alumno_o_tutor_required
def crear_conversacion():
    try:
        user_id   = request.current_user['user_id']
        user_role = request.current_user['role']
        data      = request.get_json()
        tesina_id = data.get('tesina_id')
        titulo    = data.get('titulo', 'Nueva conversación')
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO conversaciones (usuario_id, rol_usuario, tesina_id, titulo) VALUES (?, ?, ?, ?)",
                (user_id, user_role, tesina_id, titulo),
            )
            return jsonify({'id': cursor.lastrowid, 'titulo': titulo, 'tesina_id': tesina_id})
    except Exception:
        logger.exception("Error al crear conversación")
        return jsonify({"error": "Error al crear conversación"}), 500


@chat_bp.route("/chat/conversaciones/<int:conversacion_id>/mensajes", methods=["GET"])
@alumno_o_tutor_required
def obtener_mensajes(conversacion_id):
    try:
        user_id = request.current_user['user_id']
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id FROM conversaciones WHERE id = ? AND usuario_id = ?",
                (conversacion_id, user_id),
            )
            if not cursor.fetchone():
                return jsonify({"error": "Conversación no encontrada"}), 404
            cursor.execute(
                """SELECT id, rol, contenido, created_at
                   FROM mensajes_chat
                   WHERE conversacion_id = ?
                   ORDER BY created_at ASC""",
                (conversacion_id,),
            )
            mensajes = [
                {'id': r['id'], 'role': r['rol'], 'content': r['contenido'], 'created_at': r['created_at']}
                for r in cursor.fetchall()
            ]
        return jsonify(mensajes)
    except Exception:
        logger.exception("Error al obtener mensajes de conversación %s", conversacion_id)
        return jsonify({"error": "Error al obtener mensajes"}), 500


@chat_bp.route("/chat/conversaciones/<int:conversacion_id>", methods=["DELETE"])
@alumno_o_tutor_required
def eliminar_conversacion(conversacion_id):
    try:
        user_id = request.current_user['user_id']
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id FROM conversaciones WHERE id = ? AND usuario_id = ?",
                (conversacion_id, user_id),
            )
            if not cursor.fetchone():
                return jsonify({"error": "Conversación no encontrada"}), 404
            cursor.execute("DELETE FROM conversaciones WHERE id = ?", (conversacion_id,))
        return jsonify({"message": "Conversación eliminada"})
    except Exception:
        logger.exception("Error al eliminar conversación %s", conversacion_id)
        return jsonify({"error": "Error al eliminar conversación"}), 500


@chat_bp.route("/chat/conversaciones/<int:conversacion_id>/titulo", methods=["PUT"])
@alumno_o_tutor_required
def actualizar_titulo_conversacion(conversacion_id):
    try:
        user_id      = request.current_user['user_id']
        nuevo_titulo = (request.get_json() or {}).get('titulo', '').strip()
        if not nuevo_titulo:
            return jsonify({"error": "Título vacío"}), 400
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """UPDATE conversaciones
                   SET titulo = ?, updated_at = CURRENT_TIMESTAMP
                   WHERE id = ? AND usuario_id = ?""",
                (nuevo_titulo, conversacion_id, user_id),
            )
            if cursor.rowcount == 0:
                return jsonify({"error": "Conversación no encontrada"}), 404
        return jsonify({"message": "Título actualizado", "titulo": nuevo_titulo})
    except Exception:
        logger.exception("Error al actualizar título de conversación %s", conversacion_id)
        return jsonify({"error": "Error al actualizar título"}), 500


# =============================================================================
# Analizar tesina
# =============================================================================

@chat_bp.route("/chat/analizar-tesina/<int:tesina_id>", methods=["GET"])
@alumno_o_tutor_required
def analizar_tesina_problemas(tesina_id):
    """
    Analiza una tesina usando IA y retorna la lista de problemas detectados.
    Alumnos solo pueden analizar sus propias tesinas; tutores las asignadas.
    """
    try:
        user_id   = request.current_user['user_id']
        user_role = request.current_user['role']

        with get_db() as conn:
            cursor = conn.cursor()
            if user_role == 'alumno':
                cursor.execute(
                    "SELECT titulo, resumen, nombre_archivo FROM tesinas WHERE id = ? AND alumno_id = ?",
                    (tesina_id, user_id),
                )
            else:  # tutor
                cursor.execute(
                    """SELECT titulo, resumen, nombre_archivo FROM tesinas
                       WHERE id = ? AND tutor_id = ? AND estado_alumno = 'enviada'""",
                    (tesina_id, user_id),
                )
            tesina = cursor.fetchone()

        if not tesina:
            return jsonify({"error": "Tesina no encontrada o sin permisos"}), 404

        filepath = os.path.join('uploads', tesina['nombre_archivo'])
        if not os.path.exists(filepath):
            return jsonify({"error": "Archivo no encontrado"}), 404

        texto_completo = extract_text_from_file(filepath)
        if not texto_completo:
            return jsonify({"error": "No se pudo extraer el texto del archivo"}), 500

        problemas, resumen_analisis = analizar_tesina_con_ia(
            texto_completo,
            titulo=tesina['titulo'],
            resumen=tesina['resumen'],
        )

        total_palabras    = len(texto_completo.split())
        paginas_estimadas = total_palabras // 250

        return jsonify({
            "problemas":        problemas,
            "resumen":          resumen_analisis,
            "metodo":           "ia",
            "estadisticas": {
                "palabras":           total_palabras,
                "caracteres":         len(texto_completo),
                "paginas_estimadas":  paginas_estimadas,
            },
            "total_problemas": len(problemas),
            "nivel_gravedad": {
                "errores":      sum(1 for p in problemas if p.get('tipo') == 'error'),
                "advertencias": sum(1 for p in problemas if p.get('tipo') == 'warning'),
                "informacion":  sum(1 for p in problemas if p.get('tipo') == 'info'),
            },
        })

    except Exception:
        logger.exception("Error al analizar tesina %s", tesina_id)
        return jsonify({"error": "Error al analizar la tesina"}), 500