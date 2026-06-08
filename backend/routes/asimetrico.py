from flask import Blueprint, request, jsonify
from backend.services import asimetrico_service

bp_asimetrico = Blueprint("asimetrico", __name__)


def _ok(data: dict):
    return jsonify({"success": True, "data": data, "error": None})


def _err(msg: str, status: int = 400):
    return jsonify({"success": False, "data": None, "error": msg}), status


@bp_asimetrico.post("/asimetrico/generar-claves")
def generar_claves():
    try:
        return _ok(asimetrico_service.generar_claves())
    except Exception as e:
        return _err(f"Error al generar claves: {e}", 500)


@bp_asimetrico.post("/asimetrico/cifrar")
def cifrar():
    body = request.get_json(silent=True) or {}
    mensaje = body.get("mensaje")
    clave_publica_pem = body.get("clave_publica_pem")
    if not mensaje or not clave_publica_pem:
        return _err("Se requieren 'mensaje' y 'clave_publica_pem'.")
    try:
        cifrado_b64 = asimetrico_service.cifrar(mensaje, clave_publica_pem)
        return _ok({"cifrado_b64": cifrado_b64})
    except ValueError as e:
        return _err(str(e))
    except Exception as e:
        return _err(f"Error al cifrar: {e}", 500)


@bp_asimetrico.post("/asimetrico/descifrar")
def descifrar():
    body = request.get_json(silent=True) or {}
    cifrado_b64 = body.get("cifrado_b64")
    clave_privada_pem = body.get("clave_privada_pem")
    if not cifrado_b64 or not clave_privada_pem:
        return _err("Se requieren 'cifrado_b64' y 'clave_privada_pem'.")
    try:
        mensaje = asimetrico_service.descifrar(cifrado_b64, clave_privada_pem)
        return _ok({"mensaje": mensaje})
    except Exception as e:
        return _err(f"Error al descifrar: {e}", 500)
