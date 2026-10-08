"""
Asistente TesiBot. La API de Groq se reemplaza por un cliente falso que
registra lo que se le envía, así se puede verificar el prompt sin llamar a la IA.
"""
import io
from types import SimpleNamespace
from datetime import datetime

import docx
import pytest

import routes.chat as chat
from utils.db_utils import get_db
from routes.chat import convertir_tablas_a_lista


class GroqFalso:
    def __init__(self, respuesta=None):
        self.llamadas = []
        self.parametros = []
        self.respuesta = respuesta

    def create(self, **kwargs):
        self.llamadas.append(kwargs["messages"])
        self.parametros.append(kwargs)
        texto = self.respuesta if self.respuesta is not None else f"respuesta {len(self.llamadas)}"
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=texto))])


@pytest.fixture
def groq_falso(monkeypatch):
    falso = GroqFalso()
    monkeypatch.setattr(chat, "USE_GROQ", True)
    monkeypatch.setattr(chat, "client", SimpleNamespace(chat=SimpleNamespace(completions=falso)))
    return falso


def docx_con_paginas(paginas):
    documento = docx.Document()
    for _ in range(paginas * 5):  # 5 párrafos de 50 palabras ≈ 1 página
        documento.add_paragraph(" ".join(["palabra"] * 50))
    buffer = io.BytesIO()
    documento.save(buffer)
    buffer.seek(0)
    return buffer, "tesina.docx"


def subir(client, auth, usuarios, paginas):
    r = client.post("/upload", headers=auth["ana"], data={
        "titulo": "T", "tutor_id": str(usuarios["tutor"]), "file": docx_con_paginas(paginas),
    })
    return r.get_json()["tesina_id"]


def test_historial_envia_los_ultimos_mensajes(client, auth, groq_falso):
    conv = None
    for i in range(1, 16):
        r = client.post("/chat/asistente", headers=auth["ana"],
                        json={"message": f"pregunta {i}", "conversacion_id": conv})
        conv = r.get_json()["conversacion_id"]

    mensajes = groq_falso.llamadas[-1][1:]  # sin el system prompt
    contenidos = [m["content"] for m in mensajes]
    assert len(mensajes) == chat.HISTORIAL_LIMITE + 1
    assert contenidos[-1] == "pregunta 15"
    assert "pregunta 1" not in contenidos       # lo más viejo queda afuera
    assert "pregunta 14" in contenidos          # lo reciente está
    roles = [m["role"] for m in mensajes]
    assert roles == ["user", "assistant"] * (len(roles) // 2) + ["user"]


def test_tesina_larga_se_informa_como_extracto(client, auth, usuarios, groq_falso):
    tid = subir(client, auth, usuarios, paginas=40)
    r = client.post("/chat/asistente", headers=auth["ana"], json={"message": "hola", "tesina_id": tid})
    cobertura = r.get_json()["cobertura"]
    assert cobertura["truncado"] is True
    assert cobertura["paginas_analizadas"] < cobertura["paginas_totales"]
    prompt = groq_falso.llamadas[-1][0]["content"]
    assert "no inventes" in prompt
    assert "CONTENIDO COMPLETO" not in prompt


def test_tesina_corta_se_envia_completa(client, auth, usuarios, groq_falso):
    tid = subir(client, auth, usuarios, paginas=2)
    r = client.post("/chat/asistente", headers=auth["ana"], json={"message": "hola", "tesina_id": tid})
    assert r.get_json()["cobertura"]["truncado"] is False
    assert "Tenés el texto completo" in groq_falso.llamadas[-1][0]["content"]


def test_sin_groq_responde_con_el_asistente_local(client, auth):
    r = client.post("/chat/asistente", headers=auth["ana"], json={"message": "hola"})
    assert r.status_code == 200
    assert r.get_json()["mode"] == "mock"


def test_mensaje_vacio_devuelve_400(client, auth):
    assert client.post("/chat/asistente", headers=auth["ana"], json={"message": "  "}).status_code == 400


def test_las_tablas_markdown_se_convierten_en_lista():
    tabla = "| Sección | Estado |\n|---|---|\n| Introducción | OK |\n| Marco teórico | Falta |"
    resultado = convertir_tablas_a_lista(tabla)
    assert "|" not in resultado
    assert "- **Sección:** Introducción — **Estado:** OK" in resultado


LIBRO = {"tipo": "libro", "campos": {"autores": "Pressman, R.", "anio": "2010",
                                     "titulo": "Ingeniería del software", "editorial": "McGraw-Hill"}}


def test_referencia_apa_devuelve_el_texto_generado(client, auth, usuarios, groq_falso):
    groq_falso.respuesta = "Pressman, R. (2010). *Ingeniería del software*. McGraw-Hill."
    r = client.post("/chat/generar-referencia", headers=auth["ana"], json=LIBRO)
    assert r.status_code == 200
    assert r.get_json()["referencia"].startswith("Pressman, R. (2010)")
    # El razonamiento se limita para que no consuma los tokens de la respuesta
    assert groq_falso.parametros[-1]["extra_body"] == {"reasoning_effort": "low"}


def test_referencia_apa_vacia_devuelve_error(client, auth, usuarios, groq_falso):
    groq_falso.respuesta = ""
    r = client.post("/chat/generar-referencia", headers=auth["ana"], json=LIBRO)
    assert r.status_code == 502
    assert "referencia" in r.get_json()["error"]


# ─── Pautas institucionales como contexto de TesiBot ─────────────────────────

@pytest.fixture
def pautas_conocidas():
    """Deja una sola categoría con una pauta conocida y al final restaura las originales."""
    with get_db() as conn:
        categorias = [tuple(r) for r in conn.execute("SELECT id, nombre, orden FROM categorias_pautas")]
        pautas = [tuple(r) for r in conn.execute(
            "SELECT id, categoria_id, titulo, descripcion, enlace_externo, orden FROM pautas")]
        conn.execute("DELETE FROM pautas")
        conn.execute("DELETE FROM categorias_pautas")
        cat = conn.execute("INSERT INTO categorias_pautas (nombre, orden) VALUES ('Formato del documento', 1)").lastrowid
        pid = conn.execute(
            "INSERT INTO pautas (categoria_id, titulo, descripcion, orden) VALUES (?, ?, ?, 1)",
            (cat, "Extensión del trabajo", "El documento debe tener entre 120 y 200 páginas."),
        ).lastrowid
    yield pid
    with get_db() as conn:
        conn.execute("DELETE FROM pautas")
        conn.execute("DELETE FROM categorias_pautas")
        conn.executemany("INSERT INTO categorias_pautas (id, nombre, orden) VALUES (?, ?, ?)", categorias)
        conn.executemany(
            "INSERT INTO pautas (id, categoria_id, titulo, descripcion, enlace_externo, orden) VALUES (?, ?, ?, ?, ?, ?)",
            pautas)


def prompt_de_sistema(groq_falso):
    return groq_falso.llamadas[-1][0]["content"]


def test_el_prompt_incluye_la_fecha_actual(client, auth, groq_falso):
    client.post("/chat/asistente", headers=auth["ana"], json={"message": "hola"})
    hoy = datetime.now(chat.ZONA_HORARIA_ARGENTINA)
    assert "FECHA ACTUAL: hoy es" in prompt_de_sistema(groq_falso)
    assert f"({hoy:%Y-%m-%d})" in prompt_de_sistema(groq_falso)


def test_la_fecha_se_escribe_en_castellano():
    texto = chat.contexto_fecha_actual(datetime(2026, 10, 8, 0, 50, tzinfo=chat.ZONA_HORARIA_ARGENTINA))
    assert "hoy es 8 de octubre de 2026 (2026-10-08)" in texto


def test_las_pautas_institucionales_se_envian_a_tesibot(client, auth, groq_falso, pautas_conocidas):
    client.post("/chat/asistente", headers=auth["ana"], json={"message": "¿Cuántas páginas tiene que tener?"})
    prompt = prompt_de_sistema(groq_falso)
    assert "PAUTAS INSTITUCIONALES" in prompt
    assert "## Formato del documento" in prompt
    assert "Extensión del trabajo: El documento debe tener entre 120 y 200 páginas." in prompt
    # Las pautas las carga la facultad, no el usuario: el modelo no debe atribuírselas
    assert "el usuario no te las compartió" in prompt
    assert "No le atribuyas a la facultad nada que no figure en estas pautas" in prompt


def test_las_pautas_tambien_llegan_al_tutor(client, auth, groq_falso, pautas_conocidas):
    client.post("/chat/asistente", headers=auth["tutor"], json={"message": "hola"})
    assert "Extensión del trabajo" in prompt_de_sistema(groq_falso)


def test_un_cambio_en_las_pautas_se_refleja_en_la_siguiente_consulta(client, auth, groq_falso, pautas_conocidas):
    client.post("/chat/asistente", headers=auth["ana"], json={"message": "hola"})
    with get_db() as conn:
        conn.execute("UPDATE pautas SET descripcion = ? WHERE id = ?",
                     ("El documento debe tener entre 100 y 150 páginas.", pautas_conocidas))
    client.post("/chat/asistente", headers=auth["ana"], json={"message": "hola"})
    prompt = prompt_de_sistema(groq_falso)
    assert "entre 100 y 150 páginas" in prompt
    assert "entre 120 y 200 páginas" not in prompt


def test_sin_pautas_no_se_agrega_el_bloque(client, auth, groq_falso, pautas_conocidas):
    with get_db() as conn:
        conn.execute("DELETE FROM pautas")
    client.post("/chat/asistente", headers=auth["ana"], json={"message": "hola"})
    assert "PAUTAS INSTITUCIONALES" not in prompt_de_sistema(groq_falso)


def test_las_pautas_se_recortan_si_superan_el_limite(monkeypatch, pautas_conocidas):
    with get_db() as conn:
        cat = conn.execute("SELECT id FROM categorias_pautas").fetchone()[0]
        for i in range(2, 30):
            conn.execute("INSERT INTO pautas (categoria_id, titulo, descripcion, orden) VALUES (?, ?, ?, ?)",
                         (cat, f"Pauta {i}", "texto " * 40, i))
    monkeypatch.setattr(chat, "LIMITE_CARACTERES_PAUTAS", 1000)
    with get_db() as conn:
        texto = chat.obtener_pautas_institucionales(conn.cursor())
    assert 0 < len(texto) <= 1000
    assert texto.startswith("## Formato del documento")  # se conserva el orden


def test_si_fallan_las_pautas_el_chat_sigue_funcionando(client, auth, groq_falso):
    with get_db() as conn:
        conn.execute("ALTER TABLE pautas RENAME TO pautas_tmp")
    try:
        r = client.post("/chat/asistente", headers=auth["ana"], json={"message": "hola"})
    finally:
        with get_db() as conn:
            conn.execute("ALTER TABLE pautas_tmp RENAME TO pautas")
    assert r.status_code == 200
    assert "PAUTAS INSTITUCIONALES" not in prompt_de_sistema(groq_falso)
