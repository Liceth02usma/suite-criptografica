import pytest
from backend.services.asimetrico_service import generar_claves, cifrar, descifrar, MAX_BYTES_RSA


@pytest.fixture(scope="module")
def par_claves():
    return generar_claves()


def test_generar_claves_pem(par_claves):
    assert "BEGIN" in par_claves["clave_publica_pem"]
    assert "BEGIN" in par_claves["clave_privada_pem"]


def test_cifrar_descifrar_recupera_mensaje(par_claves):
    mensaje = "Texto confidencial RSA-OAEP"
    cifrado_b64 = cifrar(mensaje, par_claves["clave_publica_pem"])
    recuperado = descifrar(cifrado_b64, par_claves["clave_privada_pem"])
    assert recuperado == mensaje


def test_cifrar_retorna_string(par_claves):
    resultado = cifrar("hola", par_claves["clave_publica_pem"])
    assert isinstance(resultado, str)
    assert len(resultado) > 0


def test_mensaje_excede_limite_lanza_error(par_claves):
    mensaje_largo = "A" * (MAX_BYTES_RSA + 10)
    with pytest.raises(ValueError, match="límite RSA-OAEP"):
        cifrar(mensaje_largo, par_claves["clave_publica_pem"])


def test_mensaje_en_limite_exacto(par_claves):
    mensaje_limite = "B" * MAX_BYTES_RSA
    cifrado_b64 = cifrar(mensaje_limite, par_claves["clave_publica_pem"])
    recuperado = descifrar(cifrado_b64, par_claves["clave_privada_pem"])
    assert recuperado == mensaje_limite


def test_descifrar_clave_privada_incorrecta():
    claves_a = generar_claves()
    claves_b = generar_claves()
    cifrado_b64 = cifrar("secreto", claves_a["clave_publica_pem"])
    with pytest.raises(Exception):
        descifrar(cifrado_b64, claves_b["clave_privada_pem"])


def test_dos_cifrados_del_mismo_mensaje_son_distintos(par_claves):
    # OAEP es probabilístico: mismo mensaje produce diferente ciphertext
    c1 = cifrar("mismo mensaje", par_claves["clave_publica_pem"])
    c2 = cifrar("mismo mensaje", par_claves["clave_publica_pem"])
    assert c1 != c2
