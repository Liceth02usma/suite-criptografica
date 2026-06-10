# CryptoLab

**Laboratorio Interactivo de Criptografía**

Plataforma educativa que implementa los cinco pilares de la criptografía moderna mediante una interfaz web intuitiva. Construida con Python, Flask y la librería `cryptography` (PyCA).

---

## Algoritmos Implementados

| # | Módulo | Algoritmo | Estándar |
|---|--------|-----------|----------|
| A | Message Digest | SHA-256, SHA-3-256, MD5 | NIST FIPS 180-4 |
| B | Firma Digital | RSA-PSS + SHA-256 | NIST SP 800-131A |
| C | Cifrado Simétrico | AES-256-GCM | NIST FIPS 197 |
| D | Cifrado Asimétrico | RSA-OAEP + SHA-256 | PKCS#1 v2.2 |
| E | Curvas Elípticas | ECDSA + P-256 | NIST FIPS 186-4 |

---

## Requisitos

- Python 3.11+
- pip

---

## Instalación y Arranque

```bash
# 1. Clonar o descargar el repositorio
cd suite_encriptacion

# 2. (Opcional) Crear entorno virtual
python -m venv venv
# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env

# 5. Arrancar el servidor
python run.py
```

Abrir en el navegador: **http://localhost:5000**

---

## Ejecutar Tests

```bash
python -m pytest tests/ -v
```

Resultado esperado: **42 tests pasando**.

---

## Estructura del Proyecto

```
suite_encriptacion/
├── run.py                      # Punto de entrada
├── requirements.txt
├── .env.example
│
├── backend/
│   ├── app.py                  # Fábrica Flask + blueprints
│   ├── config.py               # Configuración Dev/Prod
│   ├── routes/                 # Blueprints (validación + respuesta JSON)
│   │   ├── digest.py
│   │   ├── firma_rsa.py
│   │   ├── simetrico.py
│   │   ├── asimetrico.py
│   │   └── ecc.py
│   ├── services/               # Lógica criptográfica pura
│   │   ├── digest_service.py
│   │   ├── firma_rsa_service.py
│   │   ├── simetrico_service.py
│   │   ├── asimetrico_service.py
│   │   └── ecc_service.py
│   └── utils/
│       └── encoders.py         # Helpers PEM / Base64
│
├── frontend/
│   ├── templates/index.html    # SPA con sidebar fijo
│   └── static/
│       ├── css/styles.css      # Design system (Inter + FontAwesome)
│       └── js/app.js           # Navegación y llamadas API
│
└── tests/                      # 42 tests unitarios
    ├── test_digest.py
    ├── test_firma_rsa.py
    ├── test_simetrico.py
    ├── test_asimetrico.py
    └── test_ecc.py
```

---

## API Reference

Todos los endpoints siguen la misma estructura de respuesta:

```json
{ "success": true,  "data": { "..." }, "error": null }
{ "success": false, "data": null,      "error": "descripción del error" }
```

### Message Digest

```
POST /api/digest
Body: { "mensaje": "hola", "algoritmo": "sha256" }
      algoritmo: "sha256" | "sha3_256" | "md5"
```

### Firma Digital RSA

```
POST /api/firma-rsa/generar-claves
POST /api/firma-rsa/firmar       { mensaje, clave_privada_pem }
POST /api/firma-rsa/verificar    { mensaje, firma_b64, clave_publica_pem }
```

### AES-256-GCM

```
POST /api/simetrico/generar-clave
POST /api/simetrico/cifrar       { mensaje, clave_hex }
POST /api/simetrico/descifrar    { cifrado_b64, iv_hex, tag_b64, clave_hex }
```

### RSA-OAEP

```
POST /api/asimetrico/generar-claves
POST /api/asimetrico/cifrar      { mensaje, clave_publica_pem }
POST /api/asimetrico/descifrar   { cifrado_b64, clave_privada_pem }
```

### ECC ECDSA

```
POST /api/ecc/generar-claves
POST /api/ecc/firmar             { mensaje, clave_privada_pem }
POST /api/ecc/verificar          { mensaje, firma_b64, clave_publica_pem }
```

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | Python + Flask | 3.11 + 3.0.3 |
| Criptografía | cryptography (PyCA) | 42.0.8 |
| Hashing | hashlib (stdlib) | — |
| Testing | pytest | 8.2.2 |
| Frontend | HTML + CSS + JS Vanilla | — |
| Iconos | FontAwesome | 6.5.1 |
| Tipografía | Inter (Google Fonts) | — |

---

## Documentación

Ver [DOCUMENTACION.md](DOCUMENTACION.md) para la explicación técnica detallada de cada módulo criptográfico.
