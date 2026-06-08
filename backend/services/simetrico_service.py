import os
import base64

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag


def generar_clave() -> str:
    return os.urandom(32).hex()


def cifrar(mensaje: str, clave_hex: str) -> dict:
    clave = bytes.fromhex(clave_hex)
    if len(clave) != 32:
        raise ValueError("La clave debe ser de exactamente 32 bytes (64 caracteres hex).")
    iv = os.urandom(12)
    aesgcm = AESGCM(clave)
    cifrado_con_tag = aesgcm.encrypt(iv, mensaje.encode("utf-8"), None)
    cifrado, tag = cifrado_con_tag[:-16], cifrado_con_tag[-16:]
    return {
        "iv_hex": iv.hex(),
        "cifrado_b64": base64.b64encode(cifrado).decode("utf-8"),
        "tag_b64": base64.b64encode(tag).decode("utf-8"),
    }


def descifrar(cifrado_b64: str, iv_hex: str, tag_b64: str, clave_hex: str) -> str:
    clave = bytes.fromhex(clave_hex)
    iv = bytes.fromhex(iv_hex)
    aesgcm = AESGCM(clave)
    datos = base64.b64decode(cifrado_b64) + base64.b64decode(tag_b64)
    # propaga InvalidTag si el tag no coincide
    return aesgcm.decrypt(iv, datos, None).decode("utf-8")
