class Ejemplo:
    def __init__(
        self,
        id,
        titulo,
        nombre_estudiante,
        anio,
        resumen,
        tutor,
        nombre_archivo
    ):
        self.id = id
        self.titulo = titulo
        self.nombre_estudiante = nombre_estudiante
        self.anio = anio
        self.resumen = resumen
        self.tutor = tutor
        self.nombre_archivo = nombre_archivo

    def to_dict(self):
        return {
            "id": self.id,
            "titulo": self.titulo,
            "nombre_estudiante": self.nombre_estudiante,
            "anio": self.anio,
            "resumen": self.resumen,
            "tutor": self.tutor,
            "nombre_archivo": self.nombre_archivo
        }