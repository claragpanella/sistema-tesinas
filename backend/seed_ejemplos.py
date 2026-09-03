import os
import sqlite3
from config import DB_PATH, UPLOAD_EJEMPLOS_FOLDER

# PDF mínimo válido (una página en blanco con un título de texto simple).
# Sirve como placeholder real en disco para que la descarga funcione.
def _generar_pdf_placeholder(titulo, nombre_estudiante, anio):
    texto = f"{titulo} - {nombre_estudiante} ({anio})"
    # Escapar paréntesis para que no rompan el content stream del PDF
    texto_pdf = texto.replace("(", r"\(").replace(")", r"\)")

    contenido_stream = f"BT /F1 14 Tf 50 700 Td ({texto_pdf}) Tj ET"

    pdf = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length {len(contenido_stream)} >>
stream
{contenido_stream}
endstream
endobj
xref
0 6
0000000000 65535 f 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
0
%%EOF"""
    return pdf.encode("latin-1")


def seed_ejemplos():
    """
    Puebla la tabla ejemplos con tesinas de muestra y genera
    los PDFs placeholder correspondientes en UPLOAD_EJEMPLOS_FOLDER.
    """
    try:
        os.makedirs(UPLOAD_EJEMPLOS_FOLDER, exist_ok=True)

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        print("🌱 Cargando ejemplos de tesinas...")

        ejemplos = [
            {
                "titulo": "Sistema de gestión de inventario con reconocimiento de imágenes",
                "nombre_estudiante": "Facundo Álvarez",
                "anio": 2023,
                "resumen": "Desarrollo de una aplicación web para control de stock que utiliza "
                           "visión por computadora para identificar productos a partir de fotos.",
                "tutor": "Dr. Juan Pérez",
            },
            {
                "titulo": "Plataforma de turnos médicos con notificaciones automatizadas",
                "nombre_estudiante": "Micaela Sosa",
                "anio": 2023,
                "resumen": "Sistema full-stack para la gestión de turnos en centros de salud, "
                           "con recordatorios automáticos vía email y SMS.",
                "tutor": "Dra. María García",
            },
            {
                "titulo": "Optimización de rutas de reparto mediante algoritmos genéticos",
                "nombre_estudiante": "Tomás Ibáñez",
                "anio": 2024,
                "resumen": "Comparativa de heurísticas para el problema del viajante aplicado "
                           "a la logística de última milla en pymes.",
                "tutor": "Dr. Carlos Rodríguez",
            },
            {
                "titulo": "Asistente conversacional para soporte técnico de primer nivel",
                "nombre_estudiante": "Valentina Rojas",
                "anio": 2024,
                "resumen": "Chatbot basado en modelos de lenguaje para resolver consultas "
                           "frecuentes y derivar casos complejos a soporte humano.",
                "tutor": "Dr. Juan Pérez",
            },
            {
                "titulo": "Aplicación móvil de seguimiento de hábitos saludables",
                "nombre_estudiante": "Nicolás Ferreyra",
                "anio": 2025,
                "resumen": "App multiplataforma para registro de actividad física, hidratación "
                           "y sueño, con visualización de progreso semanal.",
                "tutor": "Dra. María García",
            },
        ]

        insertados = 0

        for i, e in enumerate(ejemplos, start=1):
            nombre_archivo = f"ejemplo_{i:02d}_{e['anio']}.pdf"
            ruta_completa = os.path.join(UPLOAD_EJEMPLOS_FOLDER, nombre_archivo)

            # Evitar duplicados si el seed se corre más de una vez
            cursor.execute(
                "SELECT id FROM ejemplos WHERE nombre_archivo = ?",
                (nombre_archivo,)
            )
            if cursor.fetchone():
                continue

            cursor.execute("""
                INSERT INTO ejemplos
                    (titulo, nombre_estudiante, anio, resumen, tutor, nombre_archivo)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                e["titulo"],
                e["nombre_estudiante"],
                e["anio"],
                e["resumen"],
                e["tutor"],
                nombre_archivo
            ))

            # Generar el PDF placeholder en disco
            pdf_bytes = _generar_pdf_placeholder(
                e["titulo"], e["nombre_estudiante"], e["anio"]
            )
            with open(ruta_completa, "wb") as f:
                f.write(pdf_bytes)

            insertados += 1

        conn.commit()
        conn.close()

        print(f"✅ {insertados} ejemplos cargados (de {len(ejemplos)} definidos)")
        print(f"📄 PDFs placeholder generados en: {UPLOAD_EJEMPLOS_FOLDER}")

    except Exception as e:
        print(f"❌ Error al cargar ejemplos: {e}")


if __name__ == "__main__":
    seed_ejemplos()