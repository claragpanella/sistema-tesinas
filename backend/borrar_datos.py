import sqlite3
from config import DB_PATH

def limpiar_tesinas():
    print(f"👉 Conectando a: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Borramos primero las versiones (por la relación de clave foránea)
        cursor.execute("DELETE FROM versiones_tesinas")
        print(f"✅ Se eliminaron {cursor.rowcount} versiones de tesinas.")

        # Borramos todas las tesinas
        cursor.execute("DELETE FROM tesinas")
        print(f"✅ Se eliminaron {cursor.rowcount} tesinas.")

        # Opcional: Reiniciar los contadores de ID (para que la próxima empiece en 1)
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='tesinas'")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='versiones_tesinas'")

        conn.commit()
        print("\n🚀 Base de datos de tesinas limpiada por completo.")

    except Exception as e:
        print(f"❌ Error al limpiar: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    confirmacion = input("⚠️ ¿Estás seguro de que querés borrar TODAS las tesinas? (s/n): ")
    if confirmacion.lower() == 's':
        limpiar_tesinas()
    else:
        print("Operación cancelada.")