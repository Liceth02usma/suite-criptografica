from flask import Blueprint, request, jsonify
from backend.services import digest_service

bp_digest = Blueprint("digest", __name__)


def _ok(data: dict):
    return jsonify({"success": True, "data": data, "error": None})


def _err(msg: str, status: int = 400):
    return jsonify({"success": False, "data": None, "error": msg}), status


@bp_digest.post("/digest")
def generar_digest():
    body = request.get_json(silent=True) or {}
    mensaje = body.get("mensaje")
    algoritmo = body.get("algoritmo")
    if mensaje is None or not algoritmo:
        return _err("Se requieren los campos 'mensaje' y 'algoritmo'.")
    try:
        resultado = digest_service.generar_digest(mensaje, algoritmo)
        return _ok(resultado)
    except KeyError as e:
        return _err(str(e))
    except Exception as e:
        return _err(f"Error interno: {e}", 500)
