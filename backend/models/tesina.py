class Tesina:
    def __init__(self, id, titulo, resumen, tutor_id, nombre_archivo, estado, observaciones):
        self.id = id
        self.titulo = titulo
        self.resumen = resumen
        self.tutor_id = tutor_id
        self.nombre_archivo = nombre_archivo
        self.estado = estado
        self.observaciones = observaciones

    def to_dict(self):
        return {
            "id": self.id,
            "titulo": self.titulo,
            "resumen": self.resumen,
            "tutor_id": self.tutor_id,
            "nombre_archivo": self.nombre_archivo,
            "estado": self.estado,
            "observaciones": self.observaciones
        }