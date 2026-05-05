import sqlite3
from config import DB_PATH

def cargar_pautas():
    """
    Carga las pautas y categorías en la base de datos
    ⚠️ CUIDADO: Elimina las pautas y categorías existentes
    """
    try:
        print("🌱 Iniciando carga de pautas...")

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # =========================
        # 1. Limpiar datos previos
        # =========================
        cursor.execute("DELETE FROM pautas")
        cursor.execute("DELETE FROM categorias_pautas")
        print("🗑️  Datos previos eliminados")

        # Reiniciar autoincrement
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='pautas'")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='categorias_pautas'")

        # =========================
        # 2. Insertar categorías
        # =========================
        categorias = [
            "Procedimientos generales",
            "Formato del documento",
            "Estructura del trabajo",
            "Bibliografía y normas APA",
            "Impresión y presentación",
            "Defensa de la tesis",
            "Recomendaciones de redacción"
        ]

        categoria_ids = {}

        for i, nombre in enumerate(categorias, start=1):
            cursor.execute("""
                INSERT INTO categorias_pautas (nombre, orden)
                VALUES (?, ?)
            """, (nombre, i))

            categoria_ids[nombre] = cursor.lastrowid

        print(f"✅ {len(categorias)} categorías creadas")

        # =========================
        # 3. Insertar pautas
        # =========================
        pautas = [

            # PROCEDIMIENTOS GENERALES
            {
                "categoria": "Procedimientos generales",
                "titulo": "Carpeta compartida",
                "descripcion": """
Crear una carpeta compartida en Google Drive donde volcar TODOS los documentos del trabajo:
presentaciones, videos, bibliografía, imágenes, prototipos, etc.
Esta carpeta debe compartirse con los profesores evaluadores y/o tutor asignado.
                """,
                "orden": 1
            },

            {
                "categoria": "Procedimientos generales",
                "titulo": "Subcarpeta de fuentes",
                "descripcion": """
Crear una subcarpeta llamada "Fuentes del proyecto" donde se deberán colocar:
documentos, código fuente, proyectos, herramientas utilizadas y versiones del trabajo.
                """,
                "orden": 2
            },

            {
                "categoria": "Procedimientos generales",
                "titulo": "Formato de versiones",
                "descripcion": """
Las versiones del documento deben subirse en formato PDF con la nomenclatura:

ApellidoNombre_AAAA-MM-DD_vXX.pdf

Ejemplo: LopezEduardo_2025-04-22_v05.pdf
                """,
                "orden": 3
            },

            # FORMATO DEL DOCUMENTO
            {
                "categoria": "Formato del documento",
                "titulo": "Formato general",
                "descripcion": """
El trabajo debe presentarse en tamaño A4, fuente Times New Roman 12,
interlineado 1.5, márgenes estándar.
                """,
                "orden": 1
            },

            {
                "categoria": "Formato del documento",
                "titulo": "Encabezados y pies de página",
                "descripcion": """
Las cabeceras no deben figurar en carátulas, agradecimientos, resumen o introducción.
Los pies de página deben estar presentes en el resto del documento.
                """,
                "orden": 2
            },

            # ESTRUCTURA DEL TRABAJO
            {
                "categoria": "Estructura del trabajo",
                "titulo": "Apartados obligatorios",
                "descripcion": """
El trabajo debe incluir como mínimo:

- Carátula  
- Agradecimientos  
- Resumen  
- Introducción  
- Marco teórico  
- Desarrollo  
- Implementación  
- Conclusiones  
- Bibliografía  
- Anexos  
                """,
                "orden": 1
            },

            {
                "categoria": "Estructura del trabajo",
                "titulo": "Conclusiones",
                "descripcion": """
La sección de conclusiones es una de las más importantes del proyecto.
Debe incluir logros, dificultades, cumplimiento de objetivos y aportes realizados.
                """,
                "orden": 2
            },

            # BIBLIOGRAFÍA
            {
                "categoria": "Bibliografía y normas APA",
                "titulo": "Uso de normas APA",
                "descripcion": """
Todas las citas y referencias bibliográficas deben ajustarse a las normas APA vigentes.
Toda referencia en bibliografía debe haber sido citada en el texto.
                """,
                "enlace_externo": "http://normasapa.com",
                "orden": 1
            },

            # IMPRESIÓN
            {
                "categoria": "Impresión y presentación",
                "titulo": "Formato de impresión",
                "descripcion": """
El documento final debe imprimirse en dos copias:

- Una para la Universidad  
- Una para el alumno firmada por los profesores  

Se recomienda anillado metálico con tapas duras tipo alto impacto.
                """,
                "orden": 1
            },

            # DEFENSA
            {
                "categoria": "Defensa de la tesis",
                "titulo": "Duración de la presentación",
                "descripcion": """
La exposición debe durar aproximadamente 20 minutos más preguntas.
Se recomienda no superar 10 a 15 diapositivas.
                """,
                "orden": 1
            },

            {
                "categoria": "Defensa de la tesis",
                "titulo": "Recomendaciones de exposición",
                "descripcion": """
- Hablar con seguridad y fluidez  
- Vestimenta formal  
- No leer diapositivas  
- Usar material visual claro  
- Ensayar previamente  
                """,
                "orden": 2
            },

            # REDACCIÓN
            {
                "categoria": "Recomendaciones de redacción",
                "titulo": "Tiempos verbales",
                "descripcion": """
Cuidar el uso de tiempos verbales según la sección del trabajo.
Se recomienda consultar guías de redacción académica.
                """,
                "enlace_externo": "https://www.uvrcorrectoresdetextos.com/post/qué-tiempos-verbales-debes-usar-en-cada-sección-de-tu-tesis",
                "orden": 1
            }

        ]

        # Insertar pautas
        for p in pautas:
            cursor.execute("""
                INSERT INTO pautas
                (categoria_id, titulo, descripcion, enlace_externo, orden)
                VALUES (?, ?, ?, ?, ?)
            """, (
                categoria_ids[p["categoria"]],
                p["titulo"],
                p["descripcion"].strip(),
                p.get("enlace_externo"),
                p["orden"]
            ))

        print(f"✅ {len(pautas)} pautas cargadas")

        # Guardar cambios
        conn.commit()
        conn.close()

        print("✅ Pautas cargadas correctamente en la base de datos")

    except Exception as e:
        print(f"❌ Error al cargar pautas: {e}")

if __name__ == "__main__":
    respuesta = input("⚠️  ¿Cargar/recargar pautas? Esto eliminará las existentes (si/no): ")
    if respuesta.lower() == "si":
        cargar_pautas()
    else:
        print("❌ Operación cancelada")