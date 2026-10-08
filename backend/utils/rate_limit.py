"""
Límite de solicitudes por cliente (rate limiting).

Evita que alguien pruebe contraseñas en masa en el login o consuma la cuota
de la API de IA haciendo muchas consultas seguidas. Los contadores se guardan
en memoria: se reinician si el servidor se reinicia, lo cual es suficiente
para un único proceso como el del despliegue actual.
"""
import ipaddress

from flask import jsonify, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


def ip_del_cliente() -> str:
    """
    Devuelve la IP real del usuario. En Render las solicitudes pasan por un
    proxy, así que la dirección de la conexión es la del proxy y no la del
    usuario; el borde de Render informa la IP original en CF-Connecting-IP.
    Solo se acepta si es una IP válida; si no está, se usa la de la conexión.
    """
    cabecera = (request.headers.get("CF-Connecting-IP") or "").strip()
    if cabecera:
        try:
            return str(ipaddress.ip_address(cabecera))
        except ValueError:
            pass
    return get_remote_address()


limiter = Limiter(key_func=ip_del_cliente, storage_uri="memory://")

# Límites por endpoint
LIMITE_LOGIN = "10 per minute"
LIMITE_REGISTRO = "5 per minute"
LIMITE_CHAT = "20 per minute"
LIMITE_REFERENCIA_APA = "10 per minute"


def respuesta_limite_excedido(_error):
    return jsonify({
        "error": "Demasiados intentos en poco tiempo. Esperá un minuto y volvé a intentar."
    }), 429
