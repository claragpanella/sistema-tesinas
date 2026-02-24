import os
import sys
from config import DB_PATH

def setup_project():
    """
    Configura el proyecto completo desde cero
    """
    print("="*60)
    print("🚀 CONFIGURACIÓN INICIAL DEL PROYECTO")
    print("   Sistema de Gestión de Tesinas")
    print("="*60)
    
    # Verificar si ya existe la base de datos
    if os.path.exists(DB_PATH):
        print(f"\n⚠️  La base de datos ya existe en: {DB_PATH}")
        respuesta = input("¿Deseas eliminarla y empezar de cero? (si/no): ")
        
        if respuesta.lower() != "si":
            print("❌ Configuración cancelada")
            return
        
        os.remove(DB_PATH)
        print("🗑️  Base de datos anterior eliminada")
    
    try:
        # 1. Crear estructura de la base de datos
        print("\n" + "="*60)
        print("📊 Paso 1/3: Creando estructura de la base de datos...")
        print("="*60)
        from database import init_db
        init_db()
        
        # 2. Crear administrador
        print("\n" + "="*60)
        print("👤 Paso 2/3: Creando usuario administrador...")
        print("="*60)
        from seed_admin import crear_admin
        crear_admin()
        
        # 3. Cargar pautas
        print("\n" + "="*60)
        print("📋 Paso 3/3: Cargando pautas del sistema...")
        print("="*60)
        from seed_pautas import cargar_pautas
        cargar_pautas()
        
        # Opcional: Datos de prueba
        print("\n" + "="*60)
        print("🎯 DATOS DE PRUEBA (OPCIONAL)")
        print("="*60)
        print("\nPuedes cargar datos de ejemplo para desarrollo:")
        print("- 3 tutores")
        print("- 3 alumnos")
        print("- Todos con contraseñas de prueba")
        
        cargar_datos = input("\n¿Cargar datos de prueba? (si/no): ")
        if cargar_datos.lower() == "si":
            from seed_data import seed_database
            seed_database()
        
        # Resumen final
        print("\n" + "="*60)
        print("✅ PROYECTO CONFIGURADO CORRECTAMENTE")
        print("="*60)
        print("\n📧 CREDENCIALES DE ACCESO:")
        print("\n   👤 Administrador:")
        print("      Email:    admin@admin.com")
        print("      Password: admin123")
        
        if cargar_datos.lower() == "si":
            print("\n   👨‍🏫 Tutores de prueba:")
            print("      Email:    juan.perez@universidad.edu")
            print("      Email:    maria.garcia@universidad.edu")
            print("      Email:    carlos.rodriguez@universidad.edu")
            print("      Password: tutor123")
            print("\n   👨‍🎓 Alumnos de prueba:")
            print("      Email:    ana.martinez@estudiante.edu")
            print("      Email:    pedro.lopez@estudiante.edu")
            print("      Email:    laura.fernandez@estudiante.edu")
            print("      Password: alumno123")
        
        print("\n📊 BASE DE DATOS:")
        print(f"   Ubicación: {DB_PATH}")
        
        print("\n🚀 SIGUIENTE PASO:")
        print("   Inicia el servidor con: python app.py")
        print("   La API estará disponible en: http://127.0.0.1:5000")
        
        print("\n" + "="*60)
        
    except Exception as e:
        print(f"\n❌ Error durante la configuración: {e}")
        print("Por favor, revisa los errores e intenta nuevamente")
        sys.exit(1)

if __name__ == "__main__":
    setup_project()