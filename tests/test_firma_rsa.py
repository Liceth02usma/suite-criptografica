import pytest
from backend.services.firma_rsa_service import generar_claves, firmar, verificar


@pytest.fixture(scope="module")
def par_claves():
    return generar_claves()


def test_generar_claves_retorna_pem(par_claves):
    assert "clave_privada_pem" in par_claves
    assert "clave_publica_pem" in par_claves
    assert "BEGIN" in par_claves["clave_privada_pem"]
    assert "BEGIN" in par_claves["clave_publica_pem"]


def test_firmar_retorna_string(par_claves):
    firma = firmar("mensaje de prueba", par_claves["clave_privada_pem"])
    assert isinstance(firma, str)
    assert len(firma) > 0


def test_verificar_firma_valida(par_claves):
    mensaje = "mensaje autentico"
    firma = firmar(mensaje, par_claves["clave_privada_pem"])
    assert verificar(mensaje, firma, par_claves["clave_publica_pem"]) is True


def test_verificar_mensaje_alterado(par_claves):
    firma = firmar("mensaje original", par_claves["clave_privada_pem"])
    assert verificar("mensaje alterado", firma, par_claves["clave_publica_pem"]) is False


def test_verificar_firma_alterada(par_claves):
    firma = firmar("mensaje", par_claves["clave_privada_pem"])
    firma_rota = firma[:-4] + "XXXX"
    assert verificar("mensaje", firma_rota, par_claves["clave_publica_pem"]) is False


def test_verificar_clave_publica_diferente():
    claves_a = generar_claves()
    claves_b = generar_claves()
    firma = firmar("mensaje", claves_a["clave_privada_pem"])
    assert verificar("mensaje", firma, claves_b["clave_publica_pem"]) is False


def test_firmar_mensaje_vacio(par_claves):
    firma = firmar("", par_claves["clave_privada_pem"])
    assert verificar("", firma, par_claves["clave_publica_pem"]) is True
