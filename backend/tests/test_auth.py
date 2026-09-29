"""Autenticación: login, registro y validación de tokens."""
from conftest import PASSWORD


def test_login_correcto_devuelve_tokens(client, usuarios):
    r = client.post("/login", json={"email": "ana@test.com", "password": PASSWORD})
    assert r.status_code == 200
    datos = r.get_json()
    assert datos["access_token"] and datos["refresh_token"]
    assert datos["user"]["rol"] == "alumno"


def test_login_con_contrasena_incorrecta(client, usuarios):
    r = client.post("/login", json={"email": "ana@test.com", "password": "incorrecta"})
    assert r.status_code == 401
    assert r.get_json()["error"] == "Credenciales inválidas"


def test_login_ignora_mayusculas_y_espacios_en_el_email(client, usuarios):
    r = client.post("/login", json={"email": "  ANA@Test.com ", "password": PASSWORD})
    assert r.status_code == 200


def test_login_sin_json_devuelve_400(client, usuarios):
    r = client.post("/login", data="texto", content_type="text/plain")
    assert r.status_code == 400


def test_usuario_inactivo_no_puede_ingresar(client, usuarios):
    from utils.db_utils import get_db
    with get_db() as conn:
        conn.execute("UPDATE usuarios SET activo = 0 WHERE id = ?", (usuarios["ana"],))
    r = client.post("/login", json={"email": "ana@test.com", "password": PASSWORD})
    assert r.status_code == 403


def test_registro_crea_usuario_inactivo(client, usuarios):
    r = client.post("/register", json={
        "nombre": "Nueva", "email": "Nueva@Test.com", "password": "12345678",
    })
    assert r.status_code == 201
    r = client.post("/login", json={"email": "nueva@test.com", "password": "12345678"})
    assert r.status_code == 403  # debe activarla un administrador


def test_registro_exige_contrasena_de_8_caracteres(client, usuarios):
    r = client.post("/register", json={"nombre": "X", "email": "x@test.com", "password": "123"})
    assert r.status_code == 400


def test_registro_no_permite_crear_administradores(client, usuarios):
    r = client.post("/register", json={
        "nombre": "X", "email": "x@test.com", "password": "12345678", "rol": "admin",
    })
    assert r.status_code == 400


def test_ruta_protegida_sin_token(client, usuarios):
    assert client.get("/tesinas").status_code == 401


def test_ruta_protegida_con_token_falso(client, usuarios):
    r = client.get("/tesinas", headers={"Authorization": "Bearer token.falso.123"})
    assert r.status_code == 401


def test_refresh_token_no_sirve_como_access_token(client, usuarios):
    r = client.post("/login", json={"email": "ana@test.com", "password": PASSWORD})
    refresh = r.get_json()["refresh_token"]
    r = client.get("/tesinas", headers={"Authorization": f"Bearer {refresh}"})
    assert r.status_code == 401
