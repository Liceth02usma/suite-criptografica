import hashlib
import base64

ALGORITMOS: dict[str, object] = {
    "sha256": hashlib.sha256,
    "sha3_256": hashlib.sha3_256,
    "md5": hashlib.md5,
}


def generar_digest(mensaje: str, algoritmo: str) -> dict:
    if algoritmo not in ALGORITMOS:
        raise KeyError(f"Algoritmo no soportado: '{algoritmo}'. Use: {list(ALGORITMOS.keys())}")
    h = ALGORITMOS[algoritmo](mensaje.encode("utf-8")).digest()
    return {
        "hash_hex": h.hex(),
        "hash_b64": base64.b64encode(h).decode("utf-8"),
        "bits": len(h) * 8,
    }
