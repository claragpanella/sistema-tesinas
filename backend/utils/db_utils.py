import sqlite3
import unicodedata
from contextlib import contextmanager
from config import DB_PATH


def _normalize(text):
    """
    Normaliza texto para búsquedas: minúsculas y sin tildes/diacríticos.
    Ej: "Fernández" → "fernandez", "LUCAS" → "lucas"
    """
    if text is None:
        return None
    nfkd = unicodedata.normalize("NFKD", str(text))
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


@contextmanager
def get_db():
    """
    Context manager que abre una conexión a la base de datos,
    hace commit/rollback automático y CIERRA la conexión al salir.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.create_function("NORMALIZE", 1, _normalize)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()