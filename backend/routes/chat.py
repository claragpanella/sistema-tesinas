from flask import Blueprint, request, jsonify
from utils.db_utils import get_db
from utils.jwt_utils import alumno_required
from config import GEMINI_API_KEY
import os
import traceback

chat_bp = Blueprint('chat', __name__)

USE_GEMINI = bool(GEMINI_API_KEY)

if USE_GEMINI:
    from google import genai
    from google.genai import types
    
    try:
        # Usamos v1beta y el alias 'gemini-flash-latest' que es el más robusto
        client = genai.Client(
            api_key=GEMINI_API_KEY,
            http_options={'api_version': 'v1beta'}
        )
        print("✓ Cliente Gemini configurado con alias 'flash-latest'")
    except Exception as e:
        print(f"❌ Error configurando cliente: {e}")
        USE_GEMINI = False

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

@chat_bp.route("/chat/asistente", methods=["POST"])
@alumno_required
def chat_asistente():
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        tesina_id = data.get('tesina_id')
        
        if not user_message:
            return jsonify({"error": "Mensaje vacío"}), 400

        tesina_context = ""
        if tesina_id:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT titulo, nombre_archivo FROM tesinas WHERE id = ?", (tesina_id,))
                tesina = cursor.fetchone()
                if tesina:
                    path = os.path.join('uploads', tesina['nombre_archivo'])
                    if os.path.exists(path):
                        texto = extract_text_from_file(path)
                        if texto:
                            # Enviamos un fragmento pequeño para no agotar el cupo gratuito rápido
                            tesina_context = f"\nCONTEXTO TESINA '{tesina['titulo']}':\n{texto[:5000]}"

        if USE_GEMINI:
            try:
                system_prompt = "Sos TesiBot, un tutor académico virtual para tesinas y trabajos finales en Argentina. Usás voseo argentino y un tono profesional, amable y motivador. Acompañás al estudiante durante todo el proceso de la tesina, transmitiendo confianza y ayudándolo a avanzar paso a paso. Brindás orientaciones académicas y metodológicas de manera clara y accesible. Respondés de forma breve, precisa y técnica, reforzando siempre la motivación y la confianza del estudiante."
                prompt_final = f"{system_prompt}\n\n{tesina_context}\n\nPregunta: {user_message}"

                # Llamada usando el alias 'gemini-flash-latest'
                response = client.models.generate_content(
                    model='gemini-flash-latest',
                    contents=prompt_final
                )

                if response and response.text:
                    return jsonify({"response": response.text, "mode": "gemini"})
                else:
                    return jsonify({"response": "La IA no pudo generar una respuesta ahora.", "mode": "empty"})

            except Exception as e:
                print("\n" + "="*40)
                print("DETALLE DEL ERROR DE API:")
                traceback.print_exc()
                print("="*40 + "\n")
                
                # Mensaje amigable para el usuario según el error
                error_msg = str(e)
                if "429" in error_msg:
                    res = "Google tiene mucha demanda o está en mantenimiento. Reintentá en un minuto."
                else:
                    res = "El servicio de asistencia está experimentando problemas técnicos."
                    
                return jsonify({"response": res, "mode": "error"})
        
        return jsonify({"response": "Asistente en modo offline.", "mode": "mock"})

    except Exception as e:
        print(f"Error general: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500