import os
import sys
from config import DB_PATH

def reset_database():
    """
    Elimina y recrea la base de datos desde cero
    ⚠️ CUIDADO: Borra todos los datos
    """
    print("="*60)
    print("⚠️  REINICIAR BASE DE DATOS")
    print("="*60)
    print("\nEsto eliminará TODOS los datos:")
    print("- Usuarios (admin, tutores, alumnos)")
    print("- Tesinas y versiones")
    print("- Ejemplos")
    print("- Pautas y categorías")
    
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("\n🗑️  Base de datos eliminada")
    else:
        print("\n⚠️  No se encontró base de datos existente")
    
    # Recrear estructura
    print("\n📊 Recreando estructura de tablas...")
    from database import init_db
    init_db()
    
    print("✅ Base de datos recreada")
    print("\n💡 Ahora puedes ejecutar:")
    print("   - python seed_admin.py      (crear admin)")
    print("   - python seed_pautas.py     (cargar pautas)")
    print("   - python seed_data.py       (datos de prueba)")
    print("\n   O ejecutar todo de una vez:")
    print("   - python setup_project.py")

if __name__ == "__main__":
    print("⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos")
    print("\nPara confirmar, escribe: ELIMINAR")
    respuesta = input("\nTu respuesta: ")
    
    if respuesta == "ELIMINAR":
        reset_database()
    else:
        print("\n❌ Operación cancelada (escribiste: '{}')".format(respuesta))
        print("Debes escribir exactamente: ELIMINAR")