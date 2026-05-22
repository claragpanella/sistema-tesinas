import sqlite3
from config import DB_PATH

def migrar_conversaciones():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Verificar si ya tiene la columna rol_usuario
        cursor.execute("PRAGMA table_info(conversaciones)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'rol_usuario' not in columns:
            print("🔄 Agregando soporte para tutores en conversaciones...")
            
            # Renombrar alumno_id a usuario_id y agregar rol_usuario
            cursor.execute("""
                CREATE TABLE conversaciones_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    usuario_id INTEGER NOT NULL,
                    rol_usuario TEXT NOT NULL CHECK(rol_usuario IN ('alumno', 'tutor')),
                    tesina_id INTEGER,
                    titulo TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
                    FOREIGN KEY (tesina_id) REFERENCES tesinas(id) ON DELETE SET NULL
                )
            """)
            
            # Copiar datos (todas las conversaciones existentes son de alumnos)
            cursor.execute("""
                INSERT INTO conversaciones_new 
                (id, usuario_id, rol_usuario, tesina_id, titulo, created_at, updated_at)
                SELECT 
                    id, 
                    alumno_id as usuario_id, 
                    'alumno' as rol_usuario,
                    tesina_id, 
                    titulo, 
                    created_at, 
                    updated_at
                FROM conversaciones
            """)
            
            cursor.execute("DROP TABLE conversaciones")
            cursor.execute("ALTER TABLE conversaciones_new RENAME TO conversaciones")
            
            print("✅ Migración completada")
        else:
            print("✓ Tabla conversaciones ya tiene soporte para tutores")
        
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    migrar_conversaciones()