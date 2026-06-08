from cryptography.hazmat.primitives import serialization


def pem_to_str(pem_bytes: bytes) -> str:
    return pem_bytes.decode("utf-8")


def str_to_pem(pem_str: str) -> bytes:
    return pem_str.encode("utf-8")


def private_key_to_pem(private_key) -> str:
    return pem_to_str(
        private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )


def public_key_to_pem(public_key) -> str:
    return pem_to_str(
        public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )
