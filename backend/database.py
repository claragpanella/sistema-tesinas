import sqlite3
from config import DB_PATH


def init_db():
    print("👉 DB USADA:", DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # =========================
    # Tabla usuarios
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre  TEXT    NOT NULL,
            email   TEXT    UNIQUE NOT NULL,
            password TEXT   NOT NULL,
            rol     TEXT    NOT NULL CHECK (rol IN ('admin', 'tutor', 'alumno')),
            activo  INTEGER NOT NULL DEFAULT 0
        )
    """)

    # =========================
    # Tabla tesinas
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tesinas (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo         TEXT,
            resumen        TEXT,
            alumno_id      INTEGER,
            tutor_id       INTEGER,
            nombre_archivo TEXT,
            estado_alumno  TEXT DEFAULT 'borrador'  CHECK (estado_alumno IN ('borrador', 'enviada')),
            estado_tutor   TEXT DEFAULT 'pendiente' CHECK (estado_tutor  IN ('pendiente', 'en_revision', 'aprobada', 'rechazada')),
            observaciones  TEXT DEFAULT '',
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (alumno_id) REFERENCES usuarios(id),
            FOREIGN KEY (tutor_id)  REFERENCES usuarios(id)
        )
    """)

    # =========================
    # Tabla versiones_tesinas
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS versiones_tesinas (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            tesina_id       INTEGER NOT NULL,
            numero_version  INTEGER NOT NULL,
            nombre_archivo  TEXT    NOT NULL,
            estado_alumno   TEXT DEFAULT 'borrador'  CHECK (estado_alumno IN ('borrador', 'enviada')),
            estado_tutor    TEXT DEFAULT 'pendiente' CHECK (estado_tutor  IN ('pendiente', 'en_revision', 'aprobada', 'rechazada')),
            observaciones   TEXT,
            is_current      INTEGER DEFAULT 1,
            fecha_creacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tesina_id) REFERENCES tesinas(id) ON DELETE CASCADE
        )
    """)

    # =========================
    # Tabla ejemplos
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ejemplos (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo           TEXT    NOT NULL,
            nombre_estudiante TEXT   NOT NULL,
            anio             INTEGER NOT NULL,
            resumen          TEXT,
            tutor            TEXT,
            nombre_archivo   TEXT    NOT NULL
        )
    """)

    # =========================
    # Tabla categorias_pautas
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categorias_pautas (
            id     INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT    NOT NULL,
            orden  INTEGER DEFAULT 0
        )
    """)

    # =========================
    # Tabla pautas
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pautas (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria_id INTEGER,
            titulo       TEXT NOT NULL,
            descripcion  TEXT NOT NULL,
            enlace_externo TEXT,
            orden        INTEGER DEFAULT 0,
            FOREIGN KEY (categoria_id) REFERENCES categorias_pautas(id)
        )
    """)

    # =========================
    # Tabla conversaciones
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversaciones (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id  INTEGER NOT NULL,
            rol_usuario TEXT    NOT NULL CHECK (rol_usuario IN ('alumno', 'tutor')),
            tesina_id   INTEGER,
            titulo      TEXT    NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
            FOREIGN KEY (tesina_id) REFERENCES tesinas(id) ON DELETE SET NULL
        )
    """)

    # =========================
    # Tabla mensajes_chat
    # =========================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mensajes_chat (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            conversacion_id INTEGER NOT NULL,
            rol             TEXT    NOT NULL CHECK (rol IN ('user', 'assistant')),
            contenido       TEXT    NOT NULL,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()

    print("✅ Base de datos inicializada correctamente")


if __name__ == "__main__":
    init_db()