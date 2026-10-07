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
            "Defensa de la tesina",
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
        # Contenido tomado del "Documento general de redacción y exposición de
        # tesis, tesina o trabajo de fin de carrera" de la carrera. TesiBot usa
        # estas pautas como contexto, así que deben reflejar la guía tal cual.
        pautas = [

            # PROCEDIMIENTOS GENERALES
            {
                "categoria": "Procedimientos generales",
                "titulo": "Carpeta compartida del trabajo",
                "descripcion": """
Crear una carpeta compartida en Google Drive donde volcar TODOS los documentos del trabajo:
presentaciones, videos del desarrollo y del proyecto funcionando, bibliografía utilizada,
imágenes, la presentación final y videos de prototipos. El vínculo se envía por correo a los
profesores directores y colaboradores.

Dentro de ella, crear una subcarpeta "Fuentes del proyecto" con las fuentes del trabajo:
documentos .doc, bibliografía, proyectos de desarrollo y carpetas de fuentes de las herramientas utilizadas.
                """,
                "orden": 1
            },

            {
                "categoria": "Procedimientos generales",
                "titulo": "Nombre de las versiones del documento",
                "descripcion": """
Las versiones del documento general se suben siempre en PDF, para evitar problemas de formato.
El nombre del archivo lleva apellido y nombre del alumno, la fecha y el número de versión.

Ejemplo: LopezEduardo20200422v05.pdf
                """,
                "orden": 2
            },

            {
                "categoria": "Procedimientos generales",
                "titulo": "Avances y correcciones",
                "descripcion": """
Avisar por correo al grupo de evaluación cada avance sustancial que sea necesario revisar.
Los comentarios de los revisores se hacen en un archivo anexo de sugerencias y correcciones,
creado en la misma carpeta compartida, en formato Google Docs y con permiso de escritura para cada revisor.
                """,
                "orden": 3
            },

            # FORMATO DEL DOCUMENTO
            {
                "categoria": "Formato del documento",
                "titulo": "Encabezados",
                "descripcion": """
Las cabeceras no deben figurar en las páginas de apartados o títulos de capítulos,
como la carátula, los agradecimientos, el resumen o la introducción.
En las hojas de texto, el encabezado sigue este formato:

(nombre del capítulo actual)   (título de la tesis) - (nombre y apellido del alumno)
                """,
                "orden": 1
            },

            {
                "categoria": "Formato del documento",
                "titulo": "Pies de página",
                "descripcion": """
Los pies de página van en todas las páginas menos en las carátulas, con este formato:

Universidad y carrera   año   número de página / cantidad de páginas
                """,
                "orden": 2
            },

            {
                "categoria": "Formato del documento",
                "titulo": "Notas al pie y referencias cruzadas",
                "descripcion": """
Utilizar notas al pie donde corresponda ampliar algún concepto sin perder el hilo del relato.
Utilizar referencias cruzadas cuando se mencione un capítulo o tema que está abordado en otra parte del documento.
                """,
                "orden": 3
            },

            # ESTRUCTURA DEL TRABAJO
            {
                "categoria": "Estructura del trabajo",
                "titulo": "Apartados del documento",
                "descripcion": """
El documento debe incluir los siguientes apartados:

- Carátula
- Agradecimientos
- Resumen
- Introducción
- Desarrollo del tema y planteo de la hipótesis a demostrar
- Objetivos generales y particulares
- Índice de contenido
- Índice de figuras
- Marco teórico
- Capítulos de desarrollo de los temas abordados
- Desarrollo de la implementación
- Conclusiones: conclusiones generales, inconvenientes resueltos, camino recorrido y justificación del cumplimiento o no de los objetivos e hipótesis. Junto con la introducción, es el apartado más importante del proyecto
- Contribuciones y aportes a la sociedad, a otros alumnos o a interesados en la temática
- Futuro del proyecto: puntos a profundizar, otras metodologías o herramientas
- Bibliografía
- Anexos y apéndices
                """,
                "orden": 1
            },

            {
                "categoria": "Estructura del trabajo",
                "titulo": "Extensión del documento",
                "descripcion": """
La extensión del documento debería rondar entre las 120 y las 200 páginas aproximadamente.
                """,
                "orden": 2
            },

            # BIBLIOGRAFÍA
            {
                "categoria": "Bibliografía y normas APA",
                "titulo": "Bibliografía con normas APA",
                "descripcion": """
La bibliografía debe cumplir con el formato establecido por las normas APA.
Toda referencia del apartado bibliográfico tiene que haber sido citada al menos una vez en el cuerpo del documento.
Se recomienda numerar las entradas ([1], [2], ...) para que sea más fácil citarlas en el cuerpo del documento.
                """,
                "enlace_externo": "http://normasapa.com/como-citar-referenciar-libros-con-normas-apa/",
                "orden": 1
            },

            # IMPRESIÓN
            {
                "categoria": "Impresión y presentación",
                "titulo": "Impresión del documento",
                "descripcion": """
El documento se imprime en 2 copias: una queda en la universidad y la otra se la lleva el tesista, firmada por los profesores.
Formatos posibles: encuadernado con tapas duras, o anillado metálico con tapas duras tipo alto impacto (el más utilizado),
con tapas impresas con un diseño acorde al proyecto (nombre del trabajo, UCH y año).
El contenido se imprime en papel de buen gramaje semi ilustración; puede ser doble faz siempre que la cantidad de hojas no sea menor a 120.
                """,
                "orden": 1
            },

            # DEFENSA
            {
                "categoria": "Defensa de la tesina",
                "titulo": "Presentación para la defensa",
                "descripcion": """
Las diapositivas no deben estar cargadas de texto: en general, conceptuales y gráficas.
La exposición dura 20 minutos, más las preguntas que surjan. Simular la presentación y, si se excede el tiempo,
sacar las pantallas menos significativas o teóricas, o reducir el tiempo de cada una.
Usar no más de 10 a 15 diapositivas.
Si se debe mostrar una aplicación, preparar un video ilustrativo y explicarlo al reproducirlo en vivo.
                """,
                "orden": 1
            },

            {
                "categoria": "Defensa de la tesina",
                "titulo": "Criterios de exposición",
                "descripcion": """
- Señalar en la pantalla con un puntero láser o una regla, no con la mano
- Hablar en forma fluida y segura de lo que se explica
- Mantener una postura correcta, de pie y sin las manos en los bolsillos
- Si se usa un equipo, apoyar el teclado en un soporte alto para seguir de pie frente al público
- Vestimenta estrictamente formal
- Pueden asistir familiares y amigos; también se invita a docentes y alumnos de los últimos años
                """,
                "orden": 2
            },

            # REDACCIÓN
            {
                "categoria": "Recomendaciones de redacción",
                "titulo": "Tiempos verbales",
                "descripcion": """
Tener en cuenta los tiempos verbales en la redacción según la sección del trabajo.
Otro artículo de referencia: https://comohacerpara.com/usar-tiempos-verbales-tesis-grado-3591e.html
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