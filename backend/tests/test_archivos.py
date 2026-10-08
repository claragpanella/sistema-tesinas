"""
Validación del contenido de los archivos subidos: no alcanza con que la
extensión sea .pdf o .docx, el contenido tiene que corresponder al formato.
"""
import io
import os
import zipfile

import docx
from werkzeug.datastructures import FileStorage

import config
from conftest import archivo_pdf
from utils.file_utils import contenido_coincide_con_extension


def docx_valido():
    buffer = io.BytesIO()
    documento = docx.Document()
    documento.add_paragraph("Contenido de prueba")
    documento.save(buffer)
    buffer.seek(0)
    return buffer


def archivo(contenido, nombre):
    return FileStorage(stream=io.BytesIO(contenido), filename=nombre)


# ─── Función de validación ────────────────────────────────────────────────────

def test_acepta_un_pdf_real():
    assert contenido_coincide_con_extension(archivo(b"%PDF-1.7\n...", "tesina.pdf"))


def test_acepta_un_docx_real():
    assert contenido_coincide_con_extension(FileStorage(stream=docx_valido(), filename="tesina.docx"))


def test_rechaza_un_ejecutable_renombrado_a_pdf():
    assert not contenido_coincide_con_extension(archivo(b"MZ\x90\x00\x03\x00\x00\x00", "virus.pdf"))


def test_rechaza_un_zip_cualquiera_renombrado_a_docx():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as z:
        z.writestr("otra_cosa.txt", "hola")
    assert not contenido_coincide_con_extension(archivo(buffer.getvalue(), "falso.docx"))


def test_rechaza_un_pdf_renombrado_a_docx():
    assert not contenido_coincide_con_extension(archivo(b"%PDF-1.4 ...", "tesina.docx"))


def test_rechaza_un_archivo_vacio():
    assert not contenido_coincide_con_extension(archivo(b"", "tesina.pdf"))


def test_deja_el_archivo_listo_para_guardarse():
    f = archivo(b"%PDF-1.4 contenido", "tesina.pdf")
    contenido_coincide_con_extension(f)
    assert f.stream.read() == b"%PDF-1.4 contenido"


# ─── Endpoints ────────────────────────────────────────────────────────────────

def test_subir_un_ejecutable_renombrado_devuelve_400(client, auth, usuarios):
    r = client.post("/upload", headers=auth["ana"], data={
        "titulo": "T", "tutor_id": str(usuarios["tutor"]),
        "file": (io.BytesIO(b"MZ\x90\x00 programa"), "tesina.pdf"),
    })
    assert r.status_code == 400
    assert r.get_json()["error"] == "El archivo no es un PDF o DOCX válido"


def test_el_archivo_valido_se_guarda_completo(client, auth, usuarios):
    contenido = b"%PDF-1.4 contenido de prueba"
    r = client.post("/upload", headers=auth["ana"], data={
        "titulo": "T", "tutor_id": str(usuarios["tutor"]), "file": archivo_pdf(),
    })
    assert r.status_code == 201
    guardados = [f for f in os.listdir(config.UPLOAD_FOLDER) if f.endswith("tesina.pdf")]
    assert any(open(os.path.join(config.UPLOAD_FOLDER, f), "rb").read() == contenido for f in guardados)


def test_reentregar_con_un_archivo_falso_devuelve_400(client, auth, tesina_de_ana):
    r = client.post(f"/tesinas/{tesina_de_ana}/reentrega", headers=auth["ana"], data={
        "file": (io.BytesIO(b"no soy un word"), "nueva.docx"),
    })
    assert r.status_code == 400
    assert r.get_json()["error"] == "El archivo no es un PDF o DOCX válido"
