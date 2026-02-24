import bcrypt

def hash_password(password):
    """
    Hashea una contraseña usando bcrypt
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        str: Contraseña hasheada
    """
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password, hashed):
    """
    Verifica una contraseña contra su hash
    
    Args:
        password: Contraseña en texto plano
        hashed: Hash de la contraseña
        
    Returns:
        bool: True si coincide, False si no
    """
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))