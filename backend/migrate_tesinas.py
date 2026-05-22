import sqlite3
from config import DB_PATH

def migrar_estados():
    """
    Migra las tablas tesinas y versiones_tesinas para agregar estados separados
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("🔄 Iniciando migración de estados...")
        
        # ========================================
        # 1. Migrar tabla TESINAS
        # ========================================
        cursor.execute("PRAGMA table_info(tesinas)")
        columns_tesinas = [col[1] for col in cursor.fetchall()]
        
        if 'estado_alumno' not in columns_tesinas:
            print("📋 Migrando tabla TESINAS...")
            
            # Crear tabla nueva con estructura actualizada
            cursor.execute("""
                CREATE TABLE tesinas_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    titulo TEXT,
                    resumen TEXT,
                    alumno_id INTEGER,
                    tutor_id INTEGER,
                    nombre_archivo TEXT,
                    estado_alumno TEXT DEFAULT 'borrador' CHECK(estado_alumno IN ('borrador', 'enviada')),
                    estado_tutor TEXT DEFAULT 'pendiente' CHECK(estado_tutor IN ('pendiente', 'en_revision', 'aprobada', 'rechazada')),
                    observaciones TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (alumno_id) REFERENCES usuarios(id),
                    FOREIGN KEY (tutor_id) REFERENCES usuarios(id)
                )
            """)
            
            # Copiar datos existentes
            # Las tesinas existentes las marcamos como 'enviada' (ya estaban en el sistema)
            cursor.execute("""
                INSERT INTO tesinas_new 
                (id, titulo, resumen, alumno_id, tutor_id, nombre_archivo, 
                 estado_alumno, estado_tutor, observaciones, created_at, updated_at)
                SELECT 
                    id, titulo, resumen, alumno_id, tutor_id, nombre_archivo,
                    'enviada' as estado_alumno,
                    CASE 
                        WHEN estado = 'aprobada' THEN 'aprobada'
                        WHEN estado = 'rechazada' THEN 'rechazada'
                        ELSE 'pendiente'
                    END as estado_tutor,
                    observaciones,
                    CURRENT_TIMESTAMP as created_at,
                    CURRENT_TIMESTAMP as updated_at
                FROM tesinas
            """)
            
            # Reemplazar tabla vieja
            cursor.execute("DROP TABLE tesinas")
            cursor.execute("ALTER TABLE tesinas_new RENAME TO tesinas")
            
            print("✅ Tabla TESINAS migrada")
        else:
            print("✓ Tabla TESINAS ya tiene los nuevos campos")
        
        # ========================================
        # 2. Migrar tabla VERSIONES_TESINAS
        # ========================================
        cursor.execute("PRAGMA table_info(versiones_tesinas)")
        columns_versiones = [col[1] for col in cursor.fetchall()]
        
        if 'estado_alumno' not in columns_versiones:
            print("📋 Migrando tabla VERSIONES_TESINAS...")
            
            # Crear tabla nueva
            cursor.execute("""
                CREATE TABLE versiones_tesinas_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tesina_id INTEGER NOT NULL,
                    numero_version INTEGER NOT NULL,
                    nombre_archivo TEXT NOT NULL,
                    estado_alumno TEXT DEFAULT 'borrador' CHECK(estado_alumno IN ('borrador', 'enviada')),
                    estado_tutor TEXT DEFAULT 'pendiente' CHECK(estado_tutor IN ('pendiente', 'en_revision', 'aprobada', 'rechazada')),
                    observaciones TEXT,
                    is_current INTEGER DEFAULT 1,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (tesina_id) REFERENCES tesinas(id) ON DELETE CASCADE
                )
            """)
            
            # Copiar datos existentes
            cursor.execute("""
                INSERT INTO versiones_tesinas_new 
                (id, tesina_id, numero_version, nombre_archivo, 
                 estado_alumno, estado_tutor, observaciones, is_current, fecha_creacion)
                SELECT 
                    id, tesina_id, numero_version, nombre_archivo,
                    'enviada' as estado_alumno,
                    CASE 
                        WHEN estado = 'aprobada' THEN 'aprobada'
                        WHEN estado = 'rechazada' THEN 'rechazada'
                        ELSE 'pendiente'
                    END as estado_tutor,
                    observaciones,
                    1 as is_current,
                    COALESCE(fecha_creacion, CURRENT_TIMESTAMP) as fecha_creacion
                FROM versiones_tesinas
            """)
            
            # Reemplazar tabla vieja
            cursor.execute("DROP TABLE versiones_tesinas")
            cursor.execute("ALTER TABLE versiones_tesinas_new RENAME TO versiones_tesinas")
            
            print("✅ Tabla VERSIONES_TESINAS migrada")
        else:
            print("✓ Tabla VERSIONES_TESINAS ya tiene los nuevos campos")
        
        conn.commit()
        
        # ========================================
        # 3. Verificación final
        # ========================================
        print("\n📊 Verificando migración...")
        
        cursor.execute("SELECT COUNT(*) FROM tesinas")
        count_tesinas = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM versiones_tesinas")
        count_versiones = cursor.fetchone()[0]
        
        print(f"✅ {count_tesinas} tesinas migradas")
        print(f"✅ {count_versiones} versiones migradas")
        
        print("\n🎉 Migración completada exitosamente")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error en migración: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    print("="*60)
    print("🔄 MIGRACIÓN DE BASE DE DATOS - ESTADOS DE TESINAS")
    print("="*60)
    print()
    
    respuesta = input("⚠️  Esta operación modificará la base de datos. ¿Continuar? (si/no): ")
    
    if respuesta.lower() == 'si':
        migrar_estados()
    else:
        print("❌ Migración cancelada")