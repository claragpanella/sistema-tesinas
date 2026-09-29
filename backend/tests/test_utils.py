"""Funciones auxiliares: búsqueda sin tildes y armado seguro de filtros SQL."""
import pytest

from utils.db_utils import _normalize
from utils.filter_utils import build_where_clause


def test_normalize_quita_tildes_y_mayusculas():
    assert _normalize("Fernández") == "fernandez"
    assert _normalize("MÜLLER") == "muller"
    assert _normalize(None) is None


def test_busqueda_sin_tildes_encuentra_nombres_con_tildes(client, auth):
    r = client.get("/admin/tutores?search=tutor", headers=auth["admin"])
    assert r.get_json()["pagination"]["total_items"] == 2
    r = client.get("/admin/usuarios?search=pedro", headers=auth["admin"])
    assert [u["nombre"] for u in r.get_json()["items"]] == ["Pedro Alumno"]


def test_filtros_usan_parametros_y_no_concatenan_valores():
    where, params = build_where_clause({"search": "x' OR 1=1 --"}, {"search": ["u.nombre"]})
    assert "OR 1=1" not in where
    assert params == ["%x' OR 1=1 --%"]


def test_filtros_rechazan_columnas_no_permitidas():
    with pytest.raises(ValueError):
        build_where_clause({"search": "x"}, {"search": ["password; DROP TABLE usuarios"]})
