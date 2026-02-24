import sqlite3
from config import DB_PATH
from utils.auth_utils import hash_password

def seed_database():
    """
    Puebla la base de datos con datos de ejemplo para desarrollo
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        print("🌱 Cargando datos de prueba...")

        # Hashear contraseñas
        tutor_password = hash_password("tutor123")
        alumno_password = hash_password("alumno123")

        # =========================
        # 1. Crear Tutores
        # =========================
        tutores = [
            ("Dr. Juan Pérez", "juan.perez@universidad.edu", tutor_password, "tutor", 1),
            ("Dra. María García", "maria.garcia@universidad.edu", tutor_password, "tutor", 1),
            ("Dr. Carlos Rodríguez", "carlos.rodriguez@universidad.edu", tutor_password, "tutor", 1),
        ]

        for tutor in tutores:
            cursor.execute("""
                INSERT OR IGNORE INTO usuarios (nombre, email, password, rol, activo)
                VALUES (?, ?, ?, ?, ?)
            """, tutor)

        print(f"✅ {len(tutores)} tutores creados")

        # =========================
        # 2. Crear Alumnos
        # =========================
        alumnos = [
            ("Ana Martínez", "ana.martinez@estudiante.edu", alumno_password, "alumno", 1),
            ("Pedro López", "pedro.lopez@estudiante.edu", alumno_password, "alumno", 1),
            ("Laura Fernández", "laura.fernandez@estudiante.edu", alumno_password, "alumno", 1),
        ]

        for alumno in alumnos:
            cursor.execute("""
                INSERT OR IGNORE INTO usuarios (nombre, email, password, rol, activo)
                VALUES (?, ?, ?, ?, ?)
            """, alumno)

        print(f"✅ {len(alumnos)} alumnos creados")

        conn.commit()
        conn.close()

        print("✅ Datos de prueba cargados correctamente")
        print("🔒 Todas las contraseñas fueron hasheadas con bcrypt")

    except Exception as e:
        print(f"❌ Error al cargar datos de prueba: {e}")

if __name__ == "__main__":
    respuesta = input("⚠️  ¿Cargar datos de prueba en la base de datos? (si/no): ")
    if respuesta.lower() == "si":
        seed_database()
    else:
        print("❌ Operación cancelada")