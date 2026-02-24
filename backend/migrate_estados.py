from database import init_db
from utils.db_utils import get_db

def migrar_estados():
    print("Migrando estados...")

    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE tesinas
            SET estado = 'pendiente'
            WHERE estado = 'En revisión'
        """)
        print(f"  ✅ Tesinas actualizadas: {cursor.rowcount}")

        cursor.execute("""
            UPDATE versiones_tesinas
            SET estado = 'pendiente'
            WHERE estado = 'En revisión'
        """)
        print(f"  ✅ Versiones actualizadas: {cursor.rowcount}")

        conn.commit()

    print("✅ Migración completada")

if __name__ == "__main__":
    migrar_estados()