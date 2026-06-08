from flask import Blueprint, request, jsonify
from backend.services import ecc_service

bp_ecc = Blueprint("ecc", __name__)


def _ok(data: dict):
    return jsonify({"success": True, "data": data, "error": None})


def _err(msg: str, status: int = 400):
    return jsonify({"success": False, "data": None, "error": msg}), status


@bp_ecc.post("/ecc/generar-claves")
def generar_claves():
    try:
        return _ok(ecc_service.generar_claves())
    except Exception as e:
        return _err(f"Error al generar claves: {e}", 500)


@bp_ecc.post("/ecc/firmar")
def firmar():
    body = request.get_json(silent=True) or {}
    mensaje = body.get("mensaje")
    clave_privada_pem = body.get("clave_privada_pem")
    if not mensaje or not clave_privada_pem:
        return _err("Se requieren 'mensaje' y 'clave_privada_pem'.")
    try:
        firma_b64 = ecc_service.firmar(mensaje, clave_privada_pem)
        return _ok({"firma_b64": firma_b64})
    except Exception as e:
        return _err(f"Error al firmar: {e}", 500)


@bp_ecc.post("/ecc/verificar")
def verificar():
    body = request.get_json(silent=True) or {}
    mensaje = body.get("mensaje")
    firma_b64 = body.get("firma_b64")
    clave_publica_pem = body.get("clave_publica_pem")
    if not mensaje or not firma_b64 or not clave_publica_pem:
        return _err("Se requieren 'mensaje', 'firma_b64' y 'clave_publica_pem'.")
    try:
        valido = ecc_service.verificar(mensaje, firma_b64, clave_publica_pem)
        return _ok({"valido": valido})
    except Exception as e:
        return _err(f"Error al verificar: {e}", 500)
