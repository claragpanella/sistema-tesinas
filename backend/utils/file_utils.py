import os
import uuid
import zipfile
from werkzeug.utils import secure_filename

def generate_unique_filename(original_filename):
    """
    Genera un nombre de archivo único y seguro
    
    Args:
        original_filename: Nombre original del archivo
        
    Returns:
        str: Nombre único en formato: {uuid}_{nombre_seguro}
    """
    # Sanitizar el nombre
    safe_name = secure_filename(original_filename)
    
    # Generar nombre único
    unique_id = uuid.uuid4().hex[:8]
    unique_filename = f"{unique_id}_{safe_name}"
    
    return unique_filename

def save_file_safely(file, upload_folder):
    """
    Guarda un archivo de forma segura en el directorio especificado
    """
    os.makedirs(upload_folder, exist_ok=True)
    
    unique_filename = generate_unique_filename(file.filename)
    filepath = os.path.join(upload_folder, unique_filename)
    
    file.save(filepath)
    
    return unique_filename

def contenido_coincide_con_extension(file):
    """
    Verifica que el contenido real del archivo corresponda a su extensión,
    mirando sus primeros bytes ("firma" del formato), para que no alcance con
    renombrar otro tipo de archivo a .pdf o .docx.
    - PDF: empieza con "%PDF-".
    - DOCX: es un ZIP (empieza con "PK") que contiene word/document.xml.
    Deja el archivo posicionado al inicio para poder guardarlo después.
    """
    extension = (file.filename or "").rsplit(".", 1)[-1].lower()
    stream = file.stream
    try:
        stream.seek(0)
        inicio = stream.read(8)
        stream.seek(0)

        if extension == "pdf":
            return inicio.startswith(b"%PDF-")

        if extension == "docx":
            if not inicio.startswith(b"PK\x03\x04"):
                return False
            with zipfile.ZipFile(stream) as documento:
                return "word/document.xml" in documento.namelist()

        return False
    except (zipfile.BadZipFile, OSError, ValueError):
        return False
    finally:
        stream.seek(0)


MENSAJE_CONTENIDO_INVALIDO = "El archivo no es un PDF o DOCX válido"
