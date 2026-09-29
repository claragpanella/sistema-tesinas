"""
Control de acceso: cada usuario solo puede ver y modificar lo que le corresponde.
Estos tests cubren las vulnerabilidades IDOR corregidas en la revisión del código.
"""
from conftest import archivo_pdf


# ── Roles ────────────────────────────────────────────────────────────────────

def test_alumno_no_accede_a_endpoints_de_admin(client, auth):
    assert client.get("/admin/usuarios", headers=auth["ana"]).status_code == 403
    assert client.get("/admin/tutores", headers=auth["ana"]).status_code == 403


def test_tutor_no_accede_a_endpoints_de_admin(client, auth):
    assert client.get("/admin/usuarios", headers=auth["tutor"]).status_code == 403


# ── Tesinas ──────────────────────────────────────────────────────────────────

def test_alumno_no_ve_la_tesina_de_otro(client, auth, tesina_de_ana):
    assert client.get(f"/tesinas/{tesina_de_ana}", headers=auth["pedro"]).status_code == 403


def test_alumno_no_puede_reentregar_la_tesina_de_otro(client, auth, tesina_de_ana):
    r = client.post(f"/tesinas/{tesina_de_ana}/reentrega",
                    headers=auth["pedro"], data={"file": archivo_pdf()})
    assert r.status_code == 404


def test_reentrega_en_tesina_inexistente(client, auth):
    r = client.post("/tesinas/9999/reentrega", headers=auth["pedro"], data={"file": archivo_pdf()})
    assert r.status_code == 404


def test_alumno_no_ve_el_historial_de_versiones_de_otro(client, auth, tesina_de_ana):
    assert client.get(f"/tesinas/{tesina_de_ana}/versions", headers=auth["pedro"]).status_code == 404


def test_tutor_no_ve_borradores_no_enviados(client, auth, tesina_de_ana):
    assert client.get(f"/tesinas/{tesina_de_ana}", headers=auth["tutor"]).status_code == 403
    assert client.get(f"/tesinas/{tesina_de_ana}/versions", headers=auth["tutor"]).status_code == 404


def test_tutor_no_asignado_no_ve_la_tesina(client, auth, tesina_de_ana):
    client.post(f"/tesinas/{tesina_de_ana}/enviar-a-tutor", headers=auth["ana"])
    assert client.get(f"/tesinas/{tesina_de_ana}/versions", headers=auth["tutor2"]).status_code == 404
    assert client.get(f"/tesinas/{tesina_de_ana}/versions", headers=auth["tutor"]).status_code == 200


def test_alumno_no_descarga_el_archivo_de_otro(client, auth, tesina_de_ana):
    archivo = client.get(f"/tesinas/{tesina_de_ana}", headers=auth["ana"]).get_json()["nombre_archivo"]
    assert client.get(f"/uploads/{archivo}", headers=auth["ana"]).status_code == 200
    assert client.get(f"/uploads/{archivo}", headers=auth["pedro"]).status_code == 403


# ── Asistente (TesiBot) ──────────────────────────────────────────────────────

def test_chat_no_accede_a_la_tesina_de_otro_alumno(client, auth, tesina_de_ana):
    r = client.post("/chat/asistente", headers=auth["pedro"],
                    json={"message": "resumime esta tesina", "tesina_id": tesina_de_ana})
    assert r.status_code == 404


def test_chat_no_permite_escribir_en_una_conversacion_ajena(client, auth, tesina_de_ana):
    r = client.post("/chat/asistente", headers=auth["ana"],
                    json={"message": "hola", "tesina_id": tesina_de_ana})
    conversacion = r.get_json()["conversacion_id"]
    r = client.post("/chat/asistente", headers=auth["pedro"],
                    json={"message": "hola", "conversacion_id": conversacion})
    assert r.status_code == 404


def test_chat_no_muestra_mensajes_de_una_conversacion_ajena(client, auth, tesina_de_ana):
    r = client.post("/chat/asistente", headers=auth["ana"],
                    json={"message": "hola", "tesina_id": tesina_de_ana})
    conversacion = r.get_json()["conversacion_id"]
    r = client.get(f"/chat/conversaciones/{conversacion}/mensajes", headers=auth["pedro"])
    assert r.status_code == 404


def test_chat_permite_al_alumno_usar_su_propia_tesina(client, auth, tesina_de_ana):
    r = client.post("/chat/asistente", headers=auth["ana"],
                    json={"message": "hola", "tesina_id": tesina_de_ana})
    assert r.status_code == 200
