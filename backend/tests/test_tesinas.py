"""Flujo de tesinas: subida, envío, revisión y reentrega de versiones."""
import io

from conftest import archivo_pdf
from utils.db_utils import get_db


def test_subir_tesina_queda_en_borrador(client, auth, tesina_de_ana):
    t = client.get(f"/tesinas/{tesina_de_ana}", headers=auth["ana"]).get_json()
    assert t["estado_alumno"] == "borrador"
    assert t["estado_tutor"] == "pendiente"
    assert len(t["versiones"]) == 1


def test_un_alumno_no_puede_subir_una_segunda_tesina(client, auth, usuarios, tesina_de_ana):
    r = client.post("/upload", headers=auth["ana"], data={
        "titulo": "Otra tesina", "tutor_id": str(usuarios["tutor"]), "file": archivo_pdf(),
    })
    assert r.status_code == 409
    assert r.get_json()["tesina_id"] == tesina_de_ana
    # La tesina original no cambió y sigue siendo la única
    assert len(client.get("/tesinas", headers=auth["ana"]).get_json()["items"]) == 1


def test_otro_alumno_si_puede_subir_su_propia_tesina(client, auth, usuarios, tesina_de_ana):
    r = client.post("/upload", headers=auth["pedro"], data={
        "titulo": "Tesina de Pedro", "tutor_id": str(usuarios["tutor"]), "file": archivo_pdf(),
    })
    assert r.status_code == 201


def test_no_se_aceptan_archivos_doc(client, auth, usuarios):
    r = client.post("/upload", headers=auth["ana"], data={
        "titulo": "T", "tutor_id": str(usuarios["tutor"]),
        "file": (io.BytesIO(b"doc viejo"), "tesina.doc"),
    })
    assert r.status_code == 400


def test_no_se_puede_subir_con_tutor_inexistente(client, auth):
    r = client.post("/upload", headers=auth["ana"], data={
        "titulo": "T", "tutor_id": "9999", "file": archivo_pdf(),
    })
    assert r.status_code == 404


def test_flujo_completo_de_revision_y_reentrega(client, auth, tesina_de_ana):
    tid = tesina_de_ana

    # 1. El alumno envía la tesina al tutor
    assert client.post(f"/tesinas/{tid}/enviar-a-tutor", headers=auth["ana"]).status_code == 200

    # 2. El tutor la rechaza con observaciones
    version = client.get(f"/tesinas/{tid}/versions", headers=auth["tutor"]).get_json()[0]
    r = client.post(f"/tutor/versiones/{version['version_id']}/revisar", headers=auth["tutor"],
                    json={"estado": "rechazada", "observaciones": "Falta el marco teórico"})
    assert r.status_code == 200

    # 3. El alumno sube una nueva versión
    r = client.post(f"/tesinas/{tid}/reentrega", headers=auth["ana"],
                    data={"file": archivo_pdf("v2.pdf")})
    assert r.status_code == 200 and r.get_json()["version"] == 2

    # 4. La tesina vuelve a borrador y la versión actual es la 2
    t = client.get(f"/tesinas/{tid}", headers=auth["ana"]).get_json()
    assert t["estado_alumno"] == "borrador" and t["estado_tutor"] == "pendiente"
    actual = [v for v in t["versiones"] if v["is_current"]]
    assert len(actual) == 1 and actual[0]["numero_version"] == 2

    # 5. El archivo de la tesina apunta a la versión actual (el que lee TesiBot)
    assert t["nombre_archivo"] == actual[0]["nombre_archivo"]


def test_reemplazar_archivo_modifica_la_version_actual(client, auth, tesina_de_ana):
    tid = tesina_de_ana
    client.post(f"/tesinas/{tid}/enviar-a-tutor", headers=auth["ana"])
    version = client.get(f"/tesinas/{tid}/versions", headers=auth["tutor"]).get_json()[0]
    client.post(f"/tutor/versiones/{version['version_id']}/revisar", headers=auth["tutor"],
                json={"estado": "rechazada"})
    client.post(f"/tesinas/{tid}/reentrega", headers=auth["ana"], data={"file": archivo_pdf("v2.pdf")})

    archivo_v1 = client.get(f"/tesinas/{tid}", headers=auth["ana"]).get_json()["versiones"][1]["nombre_archivo"]
    r = client.put(f"/tesinas/{tid}/archivo", headers=auth["ana"], data={"file": archivo_pdf("v2b.pdf")})
    assert r.status_code == 200

    versiones = client.get(f"/tesinas/{tid}", headers=auth["ana"]).get_json()["versiones"]
    assert versiones[0]["nombre_archivo"].endswith("v2b.pdf")  # la v2 cambió
    assert versiones[1]["nombre_archivo"] == archivo_v1          # la v1 quedó intacta


def test_no_se_puede_reentregar_una_tesina_aprobada(client, auth, tesina_de_ana):
    tid = tesina_de_ana
    client.post(f"/tesinas/{tid}/enviar-a-tutor", headers=auth["ana"])
    version = client.get(f"/tesinas/{tid}/versions", headers=auth["tutor"]).get_json()[0]
    client.post(f"/tutor/versiones/{version['version_id']}/revisar", headers=auth["tutor"],
                json={"estado": "aprobada"})
    r = client.post(f"/tesinas/{tid}/reentrega", headers=auth["ana"], data={"file": archivo_pdf()})
    assert r.status_code == 400


def test_eliminar_conversacion_borra_sus_mensajes(client, auth, tesina_de_ana):
    """Verifica que las claves foráneas (ON DELETE CASCADE) estén activas."""
    r = client.post("/chat/asistente", headers=auth["ana"], json={"message": "hola"})
    conv = r.get_json()["conversacion_id"]
    assert client.delete(f"/chat/conversaciones/{conv}", headers=auth["ana"]).status_code == 200
    with get_db() as conn:
        restantes = conn.execute(
            "SELECT COUNT(*) FROM mensajes_chat WHERE conversacion_id = ?", (conv,)
        ).fetchone()[0]
    assert restantes == 0
