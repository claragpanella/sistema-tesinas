"""
Configuración común de los tests.

Antes de importar la aplicación se apuntan la base de datos y las carpetas de
archivos a un directorio temporal, y se desactiva la API de Groq. Así los
tests nunca tocan los datos reales ni consumen la API de IA.
"""
import io
import os
import sys
import tempfile

import pytest

_TMP = tempfile.mkdtemp(prefix="tesinas_tests_")
os.environ["DB_NAME"] = os.path.join(_TMP, "test.db")
os.environ["UPLOAD_FOLDER"] = os.path.join(_TMP, "uploads")
os.environ["UPLOAD_EJEMPLOS_FOLDER"] = os.path.join(_TMP, "uploads_ejemplos")
os.environ["GROQ_API_KEY"] = ""  # modo sin IA: el chat responde con el fallback local
os.environ["JWT_SECRET_KEY"] = "clave-exclusiva-para-tests"
# Sin contraseñas iniciales: la app no crea admin ni usuarios de prueba al arrancar
for _var in ("ADMIN_PASSWORD", "DEMO_TUTOR_PASSWORD", "DEMO_ALUMNO_PASSWORD"):
    os.environ[_var] = ""

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app as flask_app  # noqa: E402
from utils.auth_utils import hash_password  # noqa: E402
from utils.db_utils import get_db  # noqa: E402
from utils.jwt_utils import generate_access_token  # noqa: E402
from utils.rate_limit import limiter  # noqa: E402

PASSWORD = "clave-de-prueba"
_PASSWORD_HASH = hash_password(PASSWORD)  # bcrypt es lento: se calcula una sola vez

USUARIOS = {
    "admin":  ("Admin Test",   "admin@test.com",  "admin"),
    "tutor":  ("Tutor Test",   "tutor@test.com",  "tutor"),
    "tutor2": ("Otro Tutor",   "tutor2@test.com", "tutor"),
    "ana":    ("Ana Alumna",   "ana@test.com",    "alumno"),
    "pedro":  ("Pedro Alumno", "pedro@test.com",  "alumno"),
}


@pytest.fixture(autouse=True)
def reiniciar_limites():
    """Cada test arranca con los contadores del límite de solicitudes en cero."""
    limiter.reset()
    yield


@pytest.fixture
def client():
    flask_app.config["TESTING"] = True
    return flask_app.test_client()


@pytest.fixture
def usuarios():
    """Deja la base con un conjunto conocido de usuarios y devuelve sus ids."""
    with get_db() as conn:
        for tabla in ("mensajes_chat", "conversaciones", "versiones_tesinas", "tesinas", "usuarios"):
            conn.execute(f"DELETE FROM {tabla}")
        ids = {}
        for clave, (nombre, email, rol) in USUARIOS.items():
            cur = conn.execute(
                "INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, 1)",
                (nombre, email, _PASSWORD_HASH, rol),
            )
            ids[clave] = cur.lastrowid
    return ids


@pytest.fixture
def auth(usuarios):
    """auth['ana'] -> headers con un token válido de Ana."""
    return {
        clave: {"Authorization": f"Bearer {generate_access_token(usuarios[clave], USUARIOS[clave][2])}"}
        for clave in USUARIOS
    }


def archivo_pdf(nombre="tesina.pdf"):
    return (io.BytesIO(b"%PDF-1.4 contenido de prueba"), nombre)


@pytest.fixture
def tesina_de_ana(client, auth, usuarios):
    """Crea una tesina de Ana (en borrador) asignada al tutor y devuelve su id."""
    r = client.post("/upload", headers=auth["ana"], data={
        "titulo": "Tesina de Ana",
        "tutor_id": str(usuarios["tutor"]),
        "file": archivo_pdf(),
    })
    assert r.status_code == 201
    return r.get_json()["tesina_id"]
