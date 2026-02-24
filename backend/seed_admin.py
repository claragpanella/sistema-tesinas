import sqlite3
from config import DB_PATH
from utils.auth_utils import hash_password

def crear_admin():
    """
    Crea el usuario administrador por defecto con contraseña hasheada
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Hashear la contraseña
        password_plano = "admin123"
        password_hash = hash_password(password_plano)

        cursor.execute("""
            INSERT OR IGNORE INTO usuarios (nombre, email, password, rol, activo)
            VALUES (?, ?, ?, ?, ?)
        """, (
            "Administrador",
            "admin@admin.com",
            password_hash,
            "admin",
            1
        ))

        if cursor.rowcount > 0:
            print("✅ Usuario administrador creado correctamente")
            print("   📧 Email: admin@admin.com")
            print("   🔑 Password: admin123")
            print("   🔒 Contraseña hasheada con bcrypt")
        else:
            print("ℹ️  El usuario administrador ya existe")

        conn.commit()
        conn.close()

    except Exception as e:
        print(f"❌ Error al crear administrador: {e}")

if __name__ == "__main__":
    crear_admin()