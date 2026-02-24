import os
import uuid
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
    
    Args:
        file: Objeto FileStorage de Flask
        upload_folder: Carpeta donde guardar el archivo
        
    Returns:
        str: Nombre del archivo guardado
    """
    os.makedirs(upload_folder, exist_ok=True)
    
    unique_filename = generate_unique_filename(file.filename)
    filepath = os.path.join(upload_folder, unique_filename)
    
    file.save(filepath)
    
    return unique_filename