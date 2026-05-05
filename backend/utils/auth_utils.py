import bcrypt

def hash_password(password):
    """Hashea una contraseña usando bcrypt + salt aleatorio."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password, hashed):
    """Retorna True si la contraseña coincide con el hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))