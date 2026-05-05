from flask import Blueprint, request, jsonify
from utils.db_utils import get_db
from utils.jwt_utils import alumno_required
from config import GROQ_API_KEY
import os
import traceback
import re

chat_bp = Blueprint('chat', __name__)

USE_GROQ = bool(GROQ_API_KEY)

if USE_GROQ:
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)
        print("✓ Cliente Groq configurado")
    except Exception as e:
        print(f"❌ Error configurando cliente Groq: {e}")
        traceback.print_exc()
        USE_GROQ = False


def extract_text_from_file(filepath):
    try:
        ext = filepath.split('.')[-1].lower()
        if ext == 'pdf':
            import PyPDF2
            with open(filepath, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                return "".join([page.extract_text() or "" for page in reader.pages])
        elif ext in ['docx', 'doc']:
            import docx
            doc = docx.Document(filepath)
            return "\n".join([p.text for p in doc.paragraphs])
        return None
    except Exception as e:
        print(f"Error extrayendo archivo: {e}")
        return None


def get_mock_response(user_message, tesina_titulo=None):
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

    elif 'apa' in msg_lower or 'referencia' in msg_lower or 'bibliograf' in msg_lower or 'cita' in msg_lower:
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

    else:
        contexto_msg = f"\n\n📄 Estoy analizando tu tesina '{tesina_titulo}'" if tesina_titulo else ""
        return f"""¡Hola! Soy tu asistente académico.{contexto_msg}

Puedo ayudarte con estructura, referencias APA, redacción académica y revisión de secciones.

¿En qué específicamente puedo ayudarte hoy?"""


SYSTEM_PROMPT = """Sos Tesibot, un asistente académico especializado en tesinas universitarias argentinas.

Tu rol es ayudar a estudiantes con:
- Estructura y organización del trabajo
- Formato APA 7ma edición para referencias y citas
- Redacción académica clara, formal y coherente
- Revisión de contenido (introducción, marco teórico, metodología, conclusiones)
- Sugerencias constructivas, específicas y educativas

Características de tus respuestas:
- Usá español rioplatense (vos, querés, tenés)
- Sé claro, específico y constructivo
- Proporcioná ejemplos concretos cuando sea posible
- Mantené un tono educativo y alentador
- Si detectás errores, explicá por qué y cómo corregirlos

Comportamiento adicional:
- Podés referirte a vos mismo como "TesiBot" si es natural en la respuesta
- Limitá tus respuestas exclusivamente a temas académicos, si el usuario realiza una consulta fuera de ese ámbito, 
indicá de forma clara y breve que solo podés ayudar con temas académicos

No inventes información. Si no tenés suficiente contexto, pedí más detalles."""

def detectar_problemas_tesina(texto, titulo="", resumen=""):
    """
    Analiza el texto de una tesina y detecta problemas comunes
    Retorna lista de problemas encontrados
    """
    problemas = []
    
    # Convertir a minúsculas para búsquedas
    texto_lower = texto.lower()
    
    # Verificar largo del documento
    palabras = len(texto.split())
    if palabras < 5000:
        problemas.append({
            "tipo": "warning",
            "categoria": "Extensión",
            "titulo": "Documento muy corto",
            "descripcion": f"Tu tesina tiene {palabras:,} palabras. Se recomienda un mínimo de 5,000 palabras para un trabajo completo.",
            "sugerencia": "Considerá expandir las secciones de marco teórico, metodología y análisis."
        })
    elif palabras > 30000:
        problemas.append({
            "tipo": "info",
            "categoria": "Extensión",
            "titulo": "Documento muy extenso",
            "descripcion": f"Tu tesina tiene {palabras:,} palabras. Asegurate de mantener la concisión.",
            "sugerencia": "Revisá que no haya contenido redundante o innecesario."
        })
    
    # Buscar secciones obligatorias
    secciones_requeridas = {
        "introducción": ["introduccion", "introducción"],
        "marco teórico": ["marco teórico", "marco teorico", "fundamentación teórica", "fundamentacion teorica"],
        "metodología": ["metodología", "metodologia", "método", "metodo"],
        "resultados": ["resultados", "hallazgos", "análisis de datos"],
        "conclusiones": ["conclusiones", "conclusion"],
        "referencias": ["referencias", "bibliografía", "bibliografia", "fuentes"]
    }
    
    for seccion, variantes in secciones_requeridas.items():
        encontrada = any(variante in texto_lower for variante in variantes)
        if not encontrada:
            problemas.append({
                "tipo": "error",
                "categoria": "Estructura",
                "titulo": f"Falta sección: {seccion.title()}",
                "descripcion": f"No se detectó la sección de {seccion} en tu tesina.",
                "sugerencia": f"Toda tesina debe incluir una sección de {seccion}. Agregala antes de continuar."
            })
    
    # Verificar citas en formato APA
    # Patrón: (Apellido, Año) o (Apellido et al., Año)
    import re
    citas_apa = re.findall(r'\([A-ZÁ-Ú][a-zá-ú]+(?:\s+et\s+al\.)?,\s*\d{4}\)', texto)
    
    if len(citas_apa) < 5:
        problemas.append({
            "tipo": "warning",
            "categoria": "Referencias",
            "titulo": "Pocas citas detectadas",
            "descripcion": f"Se detectaron solo {len(citas_apa)} citas en formato APA. Un trabajo académico sólido requiere más referencias.",
            "sugerencia": "Asegurate de citar correctamente en formato APA: (Autor, Año). Agregá más referencias bibliográficas."
        })
    
    # Verificar uso de primera persona
    primera_persona = re.findall(r'\b(yo|mi|mis|nosotros|nuestro|nuestra|nuestros|nuestras)\b', texto_lower)
    
    if len(primera_persona) > 10:
        problemas.append({
            "tipo": "warning",
            "categoria": "Redacción",
            "titulo": "Uso excesivo de primera persona",
            "descripcion": f"Se detectaron {len(primera_persona)} usos de primera persona (yo, mi, nosotros).",
            "sugerencia": "En escritura académica se recomienda usar tercera persona o voz pasiva. Ejemplo: 'Se realizó el análisis' en vez de 'Yo realicé el análisis'."
        })
    
    # Verificar párrafos muy largos
    parrafos = texto.split('\n\n')
    parrafos_largos = [p for p in parrafos if len(p.split()) > 200]
    
    if len(parrafos_largos) > 5:
        problemas.append({
            "tipo": "info",
            "categoria": "Redacción",
            "titulo": "Párrafos muy largos",
            "descripcion": f"Se detectaron {len(parrafos_largos)} párrafos con más de 200 palabras.",
            "sugerencia": "Dividí los párrafos largos en unidades más pequeñas para mejorar la legibilidad. Un párrafo ideal tiene entre 80-120 palabras."
        })
    
    # Verificar palabras repetidas
    palabras_comunes = texto_lower.split()
    from collections import Counter
    contador = Counter(palabras_comunes)
    
    # Excluir palabras muy comunes
    palabras_excluir = {'el', 'la', 'los', 'las', 'de', 'del', 'en', 'un', 'una', 'y', 'o', 'que', 'por', 'para', 'con', 'a', 'se', 'es', 'al', 'como', 'su', 'sus'}
    
    palabras_repetidas = {palabra: count for palabra, count in contador.items() 
                          if count > 50 and len(palabra) > 4 and palabra not in palabras_excluir}
    
    if palabras_repetidas:
        top_3 = sorted(palabras_repetidas.items(), key=lambda x: x[1], reverse=True)[:3]
        palabras_str = ', '.join([f"'{p[0]}' ({p[1]} veces)" for p in top_3])
        
        problemas.append({
            "tipo": "info",
            "categoria": "Redacción",
            "titulo": "Palabras muy repetidas",
            "descripcion": f"Algunas palabras aparecen con mucha frecuencia: {palabras_str}",
            "sugerencia": "Usá sinónimos para mejorar la variedad léxica. Herramientas: wordreference.com, sinónimos RAE."
        })
    
    # Verificar que el título esté presente en el documento
    if titulo and titulo.lower() not in texto_lower[:1000]:
        problemas.append({
            "tipo": "warning",
            "categoria": "Estructura",
            "titulo": "Título no aparece al inicio",
            "descripcion": "El título de tu tesina no aparece en el inicio del documento.",
            "sugerencia": "Asegurate de incluir el título completo en la portada y al inicio de la introducción."
        })
    
    # Verificar figuras/tablas sin referencia
    tiene_figuras = bool(re.search(r'figura\s+\d+|fig\.\s+\d+|gráfico\s+\d+', texto_lower))
    tiene_tablas = bool(re.search(r'tabla\s+\d+|cuadro\s+\d+', texto_lower))
    
    if tiene_figuras or tiene_tablas:
        if not re.search(r'(ver|véase|como se muestra en|según)\s+(la\s+)?(figura|tabla|gráfico|cuadro)', texto_lower):
            problemas.append({
                "tipo": "info",
                "categoria": "Figuras y Tablas",
                "titulo": "Figuras/Tablas sin referenciar",
                "descripcion": "Se detectaron figuras o tablas, pero no se encontraron referencias a ellas en el texto.",
                "sugerencia": "Todas las figuras y tablas deben ser referenciadas en el texto. Ejemplo: 'Como se observa en la Figura 1...'"
            })
    
    # Verificar introducción muy corta
    intro_match = re.search(r'introducción(.*?)(marco teórico|metodología|capítulo)', texto_lower, re.DOTALL)
    if intro_match:
        intro_palabras = len(intro_match.group(1).split())
        if intro_palabras < 300:
            problemas.append({
                "tipo": "warning",
                "categoria": "Introducción",
                "titulo": "Introducción muy breve",
                "descripcion": f"Tu introducción tiene solo {intro_palabras} palabras.",
                "sugerencia": "Una introducción completa debe tener al menos 500-800 palabras. Debe incluir: contexto, problema, objetivos, justificación y estructura del trabajo."
            })
    
    # Verificar referencias sin formato APA en la sección de bibliografía
    biblio_match = re.search(r'(referencias|bibliografía)(.*)', texto_lower, re.DOTALL)
    if biblio_match:
        biblio_texto = biblio_match.group(2)[:2000]  # Primeras 2000
        
        # Verificar si hay URLs sin formato
        urls_sin_formato = re.findall(r'http[s]?://[^\s]+', biblio_texto)
        if len(urls_sin_formato) > 3:
            problemas.append({
                "tipo": "warning",
                "categoria": "Referencias",
                "titulo": "URLs sin formato APA",
                "descripcion": "Se detectaron URLs sin el formato APA adecuado en las referencias.",
                "sugerencia": "En APA 7, las URLs deben ir al final de la referencia sin punto final. Ejemplo: Recuperado de https://..."
            })
    
    return problemas


@chat_bp.route("/chat/asistente", methods=["POST"])
@alumno_required
def chat_asistente():
    try:
        alumno_id = request.current_user['user_id']
        data = request.get_json()
        user_message    = data.get('message', '')
        tesina_id       = data.get('tesina_id')
        conversacion_id = data.get('conversacion_id')

        if not user_message:
            return jsonify({"error": "Mensaje vacío"}), 400

        # Nombre del usuario
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT nombre FROM usuarios WHERE id = ?", (alumno_id,))
            row = cursor.fetchone()
            nombre_usuario = row['nombre'].split()[0] if row else "estudiante"  # solo el primer nombre

        # Contexto de la tesina
        tesina_titulo  = None
        tesina_context = ""
        if tesina_id:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT titulo, resumen, nombre_archivo FROM tesinas WHERE id = ?",
                    (tesina_id,)
                )
                tesina = cursor.fetchone()

            if tesina:
                tesina_titulo = tesina['titulo']
                filepath = os.path.join('uploads', tesina['nombre_archivo'])
                if os.path.exists(filepath):
                    file_content = extract_text_from_file(filepath)
                    if file_content:
                        tesina_context = (
                            f"\nTESINA ANALIZADA:\nTítulo: {tesina['titulo']}\n"
                            f"Resumen: {tesina['resumen']}\n\n"
                            f"CONTENIDO (extracto):\n{file_content[:2000]}...\n"
                        )

        system_instruction = (
            SYSTEM_PROMPT
            + f"\n\nEl nombre del alumno con quien estás hablando es {nombre_usuario}. "
              f"Saludalo por su nombre al inicio de la conversación si es el primer mensaje."
            + (f"\n\n{tesina_context}" if tesina_context else "")
        )

        # Historial desde la BD
        # Groq usa formato OpenAI: [{role: "user"|"assistant"|"system", content: str}]
        groq_messages = [{"role": "system", "content": system_instruction}]

        if conversacion_id:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT id FROM conversaciones WHERE id = ? AND alumno_id = ?",
                    (conversacion_id, alumno_id)
                )
                if cursor.fetchone():
                    cursor.execute(
                        """SELECT rol, contenido FROM mensajes_chat
                           WHERE conversacion_id = ?
                           ORDER BY created_at ASC
                           LIMIT 20""",
                        (conversacion_id,)
                    )
                    for row in cursor.fetchall():
                        role = "assistant" if row['rol'] == 'assistant' else "user"
                        groq_messages.append({"role": role, "content": row['contenido']})

        groq_messages.append({"role": "user", "content": user_message})

        # Llamada a Groq
        response_text = None
        mode = "mock"

        if USE_GROQ:
            try:
                response = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=groq_messages,
                    max_tokens=1024,
                    temperature=0.7,
                )
                response_text = response.choices[0].message.content
                mode = "groq"

            except Exception as e:
                traceback.print_exc()
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

        # Guardar en BD
        with get_db() as conn:
            cursor = conn.cursor()

            if not conversacion_id:
                titulo_auto = user_message[:50] + ("..." if len(user_message) > 50 else "")
                cursor.execute(
                    "INSERT INTO conversaciones (alumno_id, tesina_id, titulo) VALUES (?, ?, ?)",
                    (alumno_id, tesina_id, titulo_auto)
                )
                conversacion_id = cursor.lastrowid
            else:
                cursor.execute(
                    "UPDATE conversaciones SET updated_at = CURRENT_TIMESTAMP WHERE id = ? AND alumno_id = ?",
                    (conversacion_id, alumno_id)
                )

            cursor.execute(
                "INSERT INTO mensajes_chat (conversacion_id, rol, contenido) VALUES (?, ?, ?)",
                (conversacion_id, 'user', user_message)
            )
            cursor.execute(
                "INSERT INTO mensajes_chat (conversacion_id, rol, contenido) VALUES (?, ?, ?)",
                (conversacion_id, 'assistant', response_text)
            )

        return jsonify({
            "response": response_text,
            "tesina_id": tesina_id,
            "conversacion_id": conversacion_id,
            "mode": mode
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Error en el asistente: {str(e)}"}), 500


# =========================
# Gestión de conversaciones
# =========================

@chat_bp.route("/chat/conversaciones", methods=["GET"])
@alumno_required
def listar_conversaciones():
    try:
        alumno_id = request.current_user['user_id']
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT
                    c.id, c.titulo, c.tesina_id, c.created_at, c.updated_at,
                    t.titulo as tesina_titulo,
                    COUNT(m.id) as total_mensajes,
                    (SELECT contenido FROM mensajes_chat
                     WHERE conversacion_id = c.id
                     ORDER BY created_at DESC LIMIT 1) as ultimo_mensaje
                FROM conversaciones c
                LEFT JOIN tesinas t ON c.tesina_id = t.id
                LEFT JOIN mensajes_chat m ON m.conversacion_id = c.id
                WHERE c.alumno_id = ?
                GROUP BY c.id
                ORDER BY c.updated_at DESC
            """, (alumno_id,))
            conversaciones = [dict(row) for row in cursor.fetchall()]
        return jsonify(conversaciones)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/chat/conversaciones", methods=["POST"])
@alumno_required
def crear_conversacion():
    try:
        alumno_id = request.current_user['user_id']
        data = request.get_json()
        tesina_id = data.get('tesina_id')
        titulo = data.get('titulo', 'Nueva conversación')
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO conversaciones (alumno_id, tesina_id, titulo) VALUES (?, ?, ?)",
                (alumno_id, tesina_id, titulo)
            )
            conversacion_id = cursor.lastrowid
        return jsonify({'id': conversacion_id, 'titulo': titulo, 'tesina_id': tesina_id})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/chat/conversaciones/<int:conversacion_id>/mensajes", methods=["GET"])
@alumno_required
def obtener_mensajes(conversacion_id):
    try:
        alumno_id = request.current_user['user_id']
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id FROM conversaciones WHERE id = ? AND alumno_id = ?",
                (conversacion_id, alumno_id)
            )
            if not cursor.fetchone():
                return jsonify({"error": "Conversación no encontrada"}), 404
            cursor.execute(
                "SELECT id, rol, contenido, created_at FROM mensajes_chat WHERE conversacion_id = ? ORDER BY created_at ASC",
                (conversacion_id,)
            )
            mensajes = [
                {'id': r['id'], 'role': r['rol'], 'content': r['contenido'], 'created_at': r['created_at']}
                for r in cursor.fetchall()
            ]
        return jsonify(mensajes)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/chat/conversaciones/<int:conversacion_id>", methods=["DELETE"])
@alumno_required
def eliminar_conversacion(conversacion_id):
    try:
        alumno_id = request.current_user['user_id']
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id FROM conversaciones WHERE id = ? AND alumno_id = ?",
                (conversacion_id, alumno_id)
            )
            if not cursor.fetchone():
                return jsonify({"error": "Conversación no encontrada"}), 404
            cursor.execute("DELETE FROM conversaciones WHERE id = ?", (conversacion_id,))
        return jsonify({"message": "Conversación eliminada"})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/chat/conversaciones/<int:conversacion_id>/titulo", methods=["PUT"])
@alumno_required
def actualizar_titulo_conversacion(conversacion_id):
    try:
        alumno_id = request.current_user['user_id']
        data = request.get_json()
        nuevo_titulo = data.get('titulo', '').strip()
        if not nuevo_titulo:
            return jsonify({"error": "Título vacío"}), 400
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE conversaciones SET titulo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND alumno_id = ?",
                (nuevo_titulo, conversacion_id, alumno_id)
            )
            if cursor.rowcount == 0:
                return jsonify({"error": "Conversación no encontrada"}), 404
        return jsonify({"message": "Título actualizado", "titulo": nuevo_titulo})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
# =========================
# Analizar tesina
# =========================

@chat_bp.route("/chat/analizar-tesina/<int:tesina_id>", methods=["GET"])
@alumno_required
def analizar_tesina_problemas(tesina_id):
    """
    Analiza una tesina y retorna lista de problemas detectados
    """
    try:
        alumno_id = request.current_user['user_id']
        
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Verificar que la tesina pertenece al alumno
            cursor.execute("""
                SELECT titulo, resumen, nombre_archivo
                FROM tesinas
                WHERE id = ? AND alumno_id = ?
            """, (tesina_id, alumno_id))
            
            tesina = cursor.fetchone()
            
            if not tesina:
                return jsonify({"error": "Tesina no encontrada"}), 404
        
        # Extraer texto del archivo
        filepath = os.path.join('uploads', tesina['nombre_archivo'])
        
        if not os.path.exists(filepath):
            return jsonify({"error": "Archivo no encontrado"}), 404
        
        texto_completo = extract_text_from_file(filepath)
        
        if not texto_completo:
            return jsonify({"error": "No se pudo extraer el texto del archivo"}), 500
        
        # Analizar y detectar problemas
        problemas = detectar_problemas_tesina(
            texto_completo,
            titulo=tesina['titulo'],
            resumen=tesina['resumen']
        )
        
        # Estadísticas adicionales
        palabras_total = len(texto_completo.split())
        caracteres_total = len(texto_completo)
        paginas_estimadas = palabras_total // 250  # ~250 palabras por página
        
        return jsonify({
            "problemas": problemas,
            "estadisticas": {
                "palabras": palabras_total,
                "caracteres": caracteres_total,
                "paginas_estimadas": paginas_estimadas
            },
            "total_problemas": len(problemas),
            "nivel_gravedad": {
                "errores": len([p for p in problemas if p['tipo'] == 'error']),
                "advertencias": len([p for p in problemas if p['tipo'] == 'warning']),
                "informacion": len([p for p in problemas if p['tipo'] == 'info'])
            }
        })
        
    except Exception as e:
        print(f"Error al analizar tesina: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500