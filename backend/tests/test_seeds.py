"""Usuarios iniciales: solo se crean si sus contraseñas vienen del entorno."""
import config
from seed_admin import crear_admin
from seed_data import seed_database
from utils.auth_utils import verify_password
from utils.db_utils import get_db


def _usuarios_por_rol(rol):
    with get_db() as conn:
        return conn.execute("SELECT email, password FROM usuarios WHERE rol = ?", (rol,)).fetchall()


def _vaciar_usuarios():
    with get_db() as conn:
        for tabla in ("mensajes_chat", "conversaciones", "versiones_tesinas", "tesinas", "usuarios"):
            conn.execute(f"DELETE FROM {tabla}")


def test_sin_variables_no_se_crea_ninguna_cuenta(monkeypatch):
    _vaciar_usuarios()
    monkeypatch.setattr(config, "ADMIN_PASSWORD", None)
    monkeypatch.setattr(config, "DEMO_TUTOR_PASSWORD", None)
    monkeypatch.setattr(config, "DEMO_ALUMNO_PASSWORD", None)
    crear_admin()
    seed_database()
    with get_db() as conn:
        assert conn.execute("SELECT COUNT(*) FROM usuarios").fetchone()[0] == 0


def test_el_admin_usa_el_email_y_la_contrasena_del_entorno(monkeypatch):
    _vaciar_usuarios()
    monkeypatch.setattr(config, "ADMIN_EMAIL", "direccion@uch.edu.ar")
    monkeypatch.setattr(config, "ADMIN_PASSWORD", "clave-del-entorno")
    crear_admin()
    admins = _usuarios_por_rol("admin")
    assert len(admins) == 1
    assert admins[0]["email"] == "direccion@uch.edu.ar"
    assert verify_password("clave-del-entorno", admins[0]["password"])


def test_volver_a_arrancar_no_pisa_la_contrasena_existente(monkeypatch):
    _vaciar_usuarios()
    monkeypatch.setattr(config, "ADMIN_PASSWORD", "primera")
    crear_admin()
    monkeypatch.setattr(config, "ADMIN_PASSWORD", "segunda")
    crear_admin()
    assert verify_password("primera", _usuarios_por_rol("admin")[0]["password"])


def test_usuarios_de_prueba_con_contrasenas_del_entorno(monkeypatch):
    _vaciar_usuarios()
    monkeypatch.setattr(config, "DEMO_TUTOR_PASSWORD", "clave-tutores")
    monkeypatch.setattr(config, "DEMO_ALUMNO_PASSWORD", "clave-alumnos")
    seed_database()
    tutores, alumnos = _usuarios_por_rol("tutor"), _usuarios_por_rol("alumno")
    assert len(tutores) == 3 and len(alumnos) == 3
    assert verify_password("clave-tutores", tutores[0]["password"])
    assert verify_password("clave-alumnos", alumnos[0]["password"])
