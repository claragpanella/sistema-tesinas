import sqlite3
from contextlib import contextmanager
from config import DB_PATH

@contextmanager
def get_db():
    """
    Context manager que abre una conexión a la base de datos,
    hace commit/rollback automático y CIERRA la conexión al salir.
    Uso: with get_db() as conn:
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()