import base64

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.exceptions import InvalidSignature

from backend.utils.encoders import private_key_to_pem, public_key_to_pem, str_to_pem


def generar_claves() -> dict:
    priv = ec.generate_private_key(ec.SECP256R1())
    return {
        "clave_privada_pem": private_key_to_pem(priv),
        "clave_publica_pem": public_key_to_pem(priv.public_key()),
    }


def firmar(mensaje: str, clave_privada_pem: str) -> str:
    priv = serialization.load_pem_private_key(str_to_pem(clave_privada_pem), password=None)
    firma = priv.sign(mensaje.encode("utf-8"), ec.ECDSA(hashes.SHA256()))
    return base64.b64encode(firma).decode("utf-8")


def verificar(mensaje: str, firma_b64: str, clave_publica_pem: str) -> bool:
    pub = serialization.load_pem_public_key(str_to_pem(clave_publica_pem))
    try:
        pub.verify(
            base64.b64decode(firma_b64),
            mensaje.encode("utf-8"),
            ec.ECDSA(hashes.SHA256()),
        )
        return True
    except InvalidSignature:
        return False
