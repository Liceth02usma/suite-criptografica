import pytest
from cryptography.exceptions import InvalidTag
from backend.services.simetrico_service import generar_clave, cifrar, descifrar


def test_generar_clave_longitud():
    clave = generar_clave()
    assert len(clave) == 64  # 32 bytes = 64 hex chars


def test_generar_clave_es_hex():
    clave = generar_clave()
    int(clave, 16)  # no lanza si es hex válido


def test_cifrar_descifrar_recupera_mensaje():
    clave = generar_clave()
    mensaje = "Mensaje secreto de prueba"
    resultado = cifrar(mensaje, clave)
    recuperado = descifrar(resultado["cifrado_b64"], resultado["iv_hex"], resultado["tag_b64"], clave)
    assert recuperado == mensaje


def test_cifrar_retorna_campos_requeridos():
    clave = generar_clave()
    resultado = cifrar("hola", clave)
    assert "iv_hex" in resultado
    assert "cifrado_b64" in resultado
    assert "tag_b64" in resultado


def test_iv_aleatorio():
    clave = generar_clave()
    r1 = cifrar("mismo mensaje", clave)
    r2 = cifrar("mismo mensaje", clave)
    assert r1["iv_hex"] != r2["iv_hex"]


def test_tag_alterado_lanza_invalid_tag():
    clave = generar_clave()
    resultado = cifrar("mensaje importante", clave)
    tag_roto = "AAAAAAAAAAAAAAAAAAAAAA=="
    with pytest.raises(InvalidTag):
        descifrar(resultado["cifrado_b64"], resultado["iv_hex"], tag_roto, clave)


def test_clave_incorrecta_lanza_excepcion():
    clave_correcta = generar_clave()
    clave_incorrecta = generar_clave()
    resultado = cifrar("mensaje", clave_correcta)
    with pytest.raises(Exception):
        descifrar(resultado["cifrado_b64"], resultado["iv_hex"], resultado["tag_b64"], clave_incorrecta)


def test_clave_invalida_lanza_error():
    with pytest.raises((ValueError, Exception)):
        cifrar("mensaje", "clave_no_hex")


def test_mensaje_vacio():
    clave = generar_clave()
    resultado = cifrar("", clave)
    recuperado = descifrar(resultado["cifrado_b64"], resultado["iv_hex"], resultado["tag_b64"], clave)
    assert recuperado == ""
