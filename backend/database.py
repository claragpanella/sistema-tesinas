import sqlite3
from config import DB_PATH

def init_db():
    print("👉 DB USADA:", DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # =========================
    # Tabla usuarios (AUTH + ROLES)
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            rol TEXT NOT NULL CHECK (rol IN ('admin', 'tutor', 'alumno')),
            activo INTEGER NOT NULL DEFAULT 0
        )
    """)

    # =========================
    # Tabla tesinas
    # =========================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tesinas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT,
        resumen TEXT,
        alumno_id INTEGER,
        tutor_id INTEGER,
        nombre_archivo TEXT,
        estado TEXT DEFAULT 'pendiente',
        observaciones TEXT DEFAULT '',
        FOREIGN KEY (alumno_id) REFERENCES usuarios(id),
        FOREIGN KEY (tutor_id) REFERENCES usuarios(id)
    )
""")

    # =========================
    # Tabla versiones de tesinas
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS versiones_tesinas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tesina_id INTEGER NOT NULL,
            numero_version INTEGER NOT NULL,
            nombre_archivo TEXT NOT NULL,
            estado TEXT DEFAULT 'pendiente',
            observaciones TEXT,
            fecha_creacion TEXT,
            FOREIGN KEY (tesina_id) REFERENCES tesinas(id)
        )
    """)

    # =========================
    # Tabla ejemplos
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ejemplos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            nombre_estudiante TEXT NOT NULL,
            anio INTEGER NOT NULL,
            resumen TEXT,
            tutor TEXT,
            nombre_archivo TEXT NOT NULL
        )
    """)

    # =========================
    # Categorías de pautas
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categorias_pautas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            orden INTEGER DEFAULT 0
        )
    """)

    # =========================
    # Pautas
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pautas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria_id INTEGER,
            titulo TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            enlace_externo TEXT,
            orden INTEGER DEFAULT 0,
            FOREIGN KEY (categoria_id) REFERENCES categorias_pautas(id)
        )
    """)

    conn.commit()
    conn.close()
    
    print("✅ Base de datos inicializada correctamente")
    
if __name__ == "__main__":
    init_db()