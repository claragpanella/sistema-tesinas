import sqlite3

import config
from utils.auth_utils import hash_password


def crear_admin():
    """
    Crea el usuario administrador con los datos de ADMIN_EMAIL y ADMIN_PASSWORD.
    Si ADMIN_PASSWORD no está definida, no crea nada: así nunca queda una
    cuenta de administrador con una contraseña conocida por defecto.
    """
    if not config.ADMIN_PASSWORD:
        print("ℹ️  ADMIN_PASSWORD no definida: no se crea el usuario administrador")
        return

    try:
        conn = sqlite3.connect(config.DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT OR IGNORE INTO usuarios (nombre, email, password, rol, activo)
            VALUES (?, ?, ?, ?, ?)
        """, (
            "Administrador",
            config.ADMIN_EMAIL,
            hash_password(config.ADMIN_PASSWORD),
            "admin",
            1
        ))

        if cursor.rowcount > 0:
            print(f"✅ Usuario administrador creado: {config.ADMIN_EMAIL}")
        else:
            print("ℹ️  El usuario administrador ya existe")

        conn.commit()
        conn.close()

    except Exception as e:
        print(f"❌ Error al crear administrador: {e}")


if __name__ == "__main__":
    crear_admin()
