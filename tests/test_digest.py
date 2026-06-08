import hashlib
import pytest
from backend.services.digest_service import generar_digest


def test_sha256_valor_conocido():
    esperado = hashlib.sha256(b"abc").hexdigest()
    resultado = generar_digest("abc", "sha256")
    assert resultado["hash_hex"] == esperado


def test_sha256_bits():
    resultado = generar_digest("hola mundo", "sha256")
    assert resultado["bits"] == 256
    assert len(resultado["hash_hex"]) == 64


def test_sha256_mensaje_vacio():
    resultado = generar_digest("", "sha256")
    assert resultado["hash_hex"] == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    assert resultado["bits"] == 256


def test_sha3_256_bits():
    resultado = generar_digest("criptografia", "sha3_256")
    assert resultado["bits"] == 256
    assert len(resultado["hash_hex"]) == 64


def test_md5_bits():
    resultado = generar_digest("test", "md5")
    assert resultado["bits"] == 128
    assert len(resultado["hash_hex"]) == 32


def test_md5_valor_conocido():
    resultado = generar_digest("", "md5")
    assert resultado["hash_hex"] == "d41d8cd98f00b204e9800998ecf8427e"


def test_algoritmo_invalido():
    with pytest.raises(KeyError):
        generar_digest("hola", "algoritmo_inexistente")


def test_hash_b64_presente():
    resultado = generar_digest("prueba", "sha256")
    assert "hash_b64" in resultado
    assert len(resultado["hash_b64"]) > 0


def test_determinismo_sha256():
    r1 = generar_digest("mismo mensaje", "sha256")
    r2 = generar_digest("mismo mensaje", "sha256")
    assert r1["hash_hex"] == r2["hash_hex"]


def test_avalancha_sha256():
    r1 = generar_digest("hola", "sha256")
    r2 = generar_digest("Hola", "sha256")
    assert r1["hash_hex"] != r2["hash_hex"]
