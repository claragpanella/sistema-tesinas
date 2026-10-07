import sqlite3

import config
from utils.auth_utils import hash_password

TUTORES = [
    ("Dr. Juan Pérez", "juan.perez@universidad.edu"),
    ("Dra. María García", "maria.garcia@universidad.edu"),
    ("Dr. Carlos Rodríguez", "carlos.rodriguez@universidad.edu"),
]

ALUMNOS = [
    ("Ana Martínez", "ana.martinez@estudiante.edu"),
    ("Pedro López", "pedro.lopez@estudiante.edu"),
    ("Laura Fernández", "laura.fernandez@estudiante.edu"),
]


def _crear_usuarios(cursor, usuarios, password, rol):
    password_hash = hash_password(password)
    for nombre, email in usuarios:
        cursor.execute("""
            INSERT OR IGNORE INTO usuarios (nombre, email, password, rol, activo)
            VALUES (?, ?, ?, ?, 1)
        """, (nombre, email, password_hash, rol))


def seed_database():
    """
    Crea tutores y alumnos de prueba. Sus contraseñas se leen de
    DEMO_TUTOR_PASSWORD y DEMO_ALUMNO_PASSWORD; si una no está definida,
    ese grupo de usuarios no se crea.
    """
    if not config.DEMO_TUTOR_PASSWORD and not config.DEMO_ALUMNO_PASSWORD:
        print("ℹ️  DEMO_TUTOR_PASSWORD y DEMO_ALUMNO_PASSWORD no definidas: no se cargan usuarios de prueba")
        return

    try:
        conn = sqlite3.connect(config.DB_PATH)
        cursor = conn.cursor()

        print("🌱 Cargando usuarios de prueba...")

        if config.DEMO_TUTOR_PASSWORD:
            _crear_usuarios(cursor, TUTORES, config.DEMO_TUTOR_PASSWORD, "tutor")
            print(f"✅ {len(TUTORES)} tutores creados")

        if config.DEMO_ALUMNO_PASSWORD:
            _crear_usuarios(cursor, ALUMNOS, config.DEMO_ALUMNO_PASSWORD, "alumno")
            print(f"✅ {len(ALUMNOS)} alumnos creados")

        conn.commit()
        conn.close()

    except Exception as e:
        print(f"❌ Error al cargar datos de prueba: {e}")


if __name__ == "__main__":
    respuesta = input("⚠️  ¿Cargar datos de prueba en la base de datos? (si/no): ")
    if respuesta.lower() == "si":
        seed_database()
    else:
        print("❌ Operación cancelada")
