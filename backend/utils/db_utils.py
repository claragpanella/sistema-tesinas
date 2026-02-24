import sqlite3
from config import DB_PATH

def get_db():
    """
    Retorna una conexión a la base de datos con row_factory
    para acceder a columnas por nombre
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn