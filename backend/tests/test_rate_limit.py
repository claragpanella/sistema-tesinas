"""
Límite de solicitudes: bloquea los excesos y cuenta por IP. Los contadores se
reinician antes de cada test (fixture reiniciar_limites en conftest).
"""


def intentar_login(client, ip="203.0.113.10"):
    return client.post("/login", json={"email": "ana@test.com", "password": "incorrecta"},
                       headers={"CF-Connecting-IP": ip})


def test_el_login_se_bloquea_despues_de_10_intentos_por_minuto(client, usuarios):
    respuestas = [intentar_login(client).status_code for _ in range(11)]
    assert respuestas[:10] == [401] * 10
    assert respuestas[10] == 429
    assert "Esperá un minuto" in intentar_login(client).get_json()["error"]


def test_el_limite_es_por_ip(client, usuarios):
    for _ in range(10):
        intentar_login(client, ip="203.0.113.10")
    assert intentar_login(client, ip="203.0.113.10").status_code == 429
    assert intentar_login(client, ip="198.51.100.7").status_code == 401  # otro usuario no se ve afectado


def test_una_ip_invalida_en_la_cabecera_se_ignora(client, usuarios):
    r = client.post("/login", json={"email": "ana@test.com", "password": "x"},
                    headers={"CF-Connecting-IP": "no-es-una-ip"})
    assert r.status_code == 401


def test_el_chat_tiene_su_propio_limite(client, auth):
    ip = {"CF-Connecting-IP": "203.0.113.20"}
    codigos = [client.post("/chat/asistente", json={"message": "hola"}, headers={**auth["ana"], **ip}).status_code
               for _ in range(21)]
    assert codigos[:20] == [200] * 20
    assert codigos[20] == 429
