from flask import Blueprint, request, jsonify
from cryptography.exceptions import InvalidTag
from backend.services import simetrico_service

bp_simetrico = Blueprint("simetrico", __name__)


def _ok(data: dict):
    return jsonify({"success": True, "data": data, "error": None})


def _err(msg: str, status: int = 400):
    return jsonify({"success": False, "data": None, "error": msg}), status


@bp_simetrico.post("/simetrico/generar-clave")
def generar_clave():
    try:
        return _ok({"clave_hex": simetrico_service.generar_clave()})
    except Exception as e:
        return _err(f"Error al generar clave: {e}", 500)


@bp_simetrico.post("/simetrico/cifrar")
def cifrar():
    body = request.get_json(silent=True) or {}
    mensaje = body.get("mensaje")
    clave_hex = body.get("clave_hex")
    if not mensaje or not clave_hex:
        return _err("Se requieren 'mensaje' y 'clave_hex'.")
    try:
        return _ok(simetrico_service.cifrar(mensaje, clave_hex))
    except ValueError as e:
        return _err(str(e))
    except Exception as e:
        return _err(f"Error al cifrar: {e}", 500)


@bp_simetrico.post("/simetrico/descifrar")
def descifrar():
    body = request.get_json(silent=True) or {}
    cifrado_b64 = body.get("cifrado_b64")
    iv_hex = body.get("iv_hex")
    tag_b64 = body.get("tag_b64")
    clave_hex = body.get("clave_hex")
    if not all([cifrado_b64, iv_hex, tag_b64, clave_hex]):
        return _err("Se requieren 'cifrado_b64', 'iv_hex', 'tag_b64' y 'clave_hex'.")
    try:
        mensaje = simetrico_service.descifrar(cifrado_b64, iv_hex, tag_b64, clave_hex)
        return _ok({"mensaje": mensaje})
    except InvalidTag:
        return _err(
            "Autenticación fallida. El mensaje fue alterado o la clave es incorrecta."
        )
    except ValueError as e:
        return _err(str(e))
    except Exception as e:
        return _err(f"Error al descifrar: {e}", 500)
