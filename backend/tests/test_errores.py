"""Manejo de errores: entradas inválidas y respuestas sin detalles internos."""
import sqlite3

from config import DB_PATH


def test_per_page_cero_no_rompe_el_servidor(client, auth):
    r = client.get("/tesinas?per_page=0", headers=auth["ana"])
    assert r.status_code == 200
    assert r.get_json()["pagination"]["per_page"] == 10


def test_pagina_no_numerica_no_rompe_el_servidor(client, auth):
    r = client.get("/tesinas?page=abc", headers=auth["ana"])
    assert r.status_code == 200
    assert r.get_json()["pagination"]["page"] == 1


def test_per_page_tiene_un_maximo(client, auth):
    r = client.get("/tesinas?per_page=100000", headers=auth["ana"])
    assert r.get_json()["pagination"]["per_page"] == 100


def test_ruta_inexistente_devuelve_json(client):
    r = client.get("/no-existe")
    assert r.status_code == 404
    assert r.get_json() == {"error": "Recurso no encontrado"}


def test_error_interno_no_expone_detalles(client, auth):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("ALTER TABLE pautas RENAME TO pautas_tmp")
    conn.commit()
    try:
        r = client.get("/pautas/", headers=auth["ana"])
    finally:
        conn.execute("ALTER TABLE pautas_tmp RENAME TO pautas")
        conn.commit()
        conn.close()
    assert r.status_code == 500
    mensaje = r.get_json()["error"]
    assert "no such table" not in mensaje
    assert "pautas_tmp" not in mensaje
