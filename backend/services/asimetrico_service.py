import base64

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

from backend.utils.encoders import private_key_to_pem, public_key_to_pem, str_to_pem

# RSA-2048 con SHA-256: límite máximo de mensaje = 190 bytes aprox.
# Formula: key_size_bytes - 2*hash_size - 2 = 256 - 64 - 2 = 190
MAX_BYTES_RSA = 190


def generar_claves() -> dict:
    priv = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return {
        "clave_privada_pem": private_key_to_pem(priv),
        "clave_publica_pem": public_key_to_pem(priv.public_key()),
    }


def cifrar(mensaje: str, clave_publica_pem: str) -> str:
    mensaje_bytes = mensaje.encode("utf-8")
    if len(mensaje_bytes) > MAX_BYTES_RSA:
        raise ValueError(
            f"El mensaje excede el límite RSA-OAEP ({len(mensaje_bytes)} bytes). "
            f"Máximo permitido: {MAX_BYTES_RSA} bytes. "
            "En producción se usa un esquema híbrido RSA+AES."
        )
    pub = serialization.load_pem_public_key(str_to_pem(clave_publica_pem))
    cifrado = pub.encrypt(
        mensaje_bytes,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return base64.b64encode(cifrado).decode("utf-8")


def descifrar(cifrado_b64: str, clave_privada_pem: str) -> str:
    priv = serialization.load_pem_private_key(str_to_pem(clave_privada_pem), password=None)
    mensaje = priv.decrypt(
        base64.b64decode(cifrado_b64),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return mensaje.decode("utf-8")
