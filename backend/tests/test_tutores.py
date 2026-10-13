"""
Listado de tutores disponibles para los alumnos: datos de contacto, carga
actual y tesinas de ejemplo que dirigió cada uno.
"""
from routes.tutores import mismo_nombre
from utils.db_utils import get_db


def cargar_ejemplo(titulo, anio, tutor):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO ejemplos (titulo, nombre_estudiante, anio, tutor, nombre_archivo) VALUES (?, ?, ?, ?, ?)",
            (titulo, "Autor", anio, tutor, "x.pdf"),
        )


def test_nombres_que_coinciden_aunque_esten_escritos_distinto():
    assert mismo_nombre("Dra. María García", "maria garcia")
    assert mismo_nombre("María García", "Ing. María Laura GARCÍA")
    assert mismo_nombre("Dr. Juan Pérez", "Perez, Juan")


def test_nombres_que_no_deben_coincidir():
    assert not mismo_nombre("María García", "Juan García")  # solo comparten el apellido
    assert not mismo_nombre("María García", "García")        # un solo nombre no alcanza
    assert not mismo_nombre("María García", None)


def test_el_alumno_ve_los_tutores_activos_con_su_email(client, auth):
    with get_db() as conn:
        conn.execute("UPDATE usuarios SET activo = 0 WHERE email = 'tutor2@test.com'")
    r = client.get("/tutores", headers=auth["ana"])
    assert r.status_code == 200
    tutores = r.get_json()
    assert [t["email"] for t in tutores] == ["tutor@test.com"]  # el inactivo no aparece
    assert tutores[0]["nombre"] == "Tutor Test"


def test_cada_tutor_muestra_sus_tesinas_en_curso_y_los_ejemplos_que_dirigio(client, auth, tesina_de_ana):
    with get_db() as conn:
        conn.execute("DELETE FROM ejemplos")
    cargar_ejemplo("Sistema de turnos", 2023, "Lic. Tutor Test")
    cargar_ejemplo("App de inventario", 2021, "tutor test")
    cargar_ejemplo("Trabajo de otro tutor", 2022, "Otro Tutor")

    tutores = {t["email"]: t for t in client.get("/tutores", headers=auth["ana"]).get_json()}
    tutor = tutores["tutor@test.com"]
    assert tutor["tesinas_en_curso"] == 1
    assert [e["titulo"] for e in tutor["ejemplos_dirigidos"]] == ["Sistema de turnos", "App de inventario"]
    assert [e["titulo"] for e in tutores["tutor2@test.com"]["ejemplos_dirigidos"]] == ["Trabajo de otro tutor"]


def test_el_listado_requiere_iniciar_sesion(client):
    assert client.get("/tutores").status_code == 401
