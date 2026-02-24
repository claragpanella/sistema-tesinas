from utils.db_utils import get_db

def migrar():
    print("Agregando columna alumno_id a tesinas...")

    with get_db() as conn:
        cursor = conn.cursor()

        # Verificar si ya existe la columna
        cursor.execute("PRAGMA table_info(tesinas)")
        columnas = [row[1] for row in cursor.fetchall()]

        if 'alumno_id' in columnas:
            print("  ℹ️  La columna alumno_id ya existe")
            return

        # Agregar la columna
        cursor.execute("""
            ALTER TABLE tesinas
            ADD COLUMN alumno_id INTEGER
        """)

        print(f"  ✅ Columna alumno_id agregada")
        conn.commit()

    print("✅ Migración completada")

if __name__ == "__main__":
    migrar()