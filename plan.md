# Plan de Desarrollo — Suite Criptográfica en Python

## 1. Resumen Ejecutivo

Se construirá una aplicación web **monolítica** con separación lógica `backend/` y `frontend/`. El usuario interactúa desde el navegador con una interfaz por pestañas — una por operación criptográfica — y el backend (Flask) ejecuta la lógica usando únicamente librerías estándar o ampliamente auditadas de Python.

Las cinco operaciones requeridas:

| # | Operación | Algoritmo principal |
|---|-----------|-------------------|
| a | Message Digest (Resumen Digital) | SHA-256, SHA-3-256, MD5 |
| b | Firma Digital (firmar / verificar) | RSA-PSS con SHA-256 |
| c | Cifrado simétrico (clave privada) | AES-256-GCM |
| d | Cifrado asimétrico (clave pública) | RSA-OAEP con SHA-256 |
| e | ECC — firma y verificación | ECDSA con curva P-256 |

---

## 2. Librerías a Usar

```
Flask==3.0.3            # Framework web (routing, JSON, templates)
cryptography==42.0.8    # Backend criptográfico principal (AES, RSA, ECC, hashing)
```

> **¿Por qué solo `cryptography`?**  
> Es la librería de referencia para Python mantenida por la Python Cryptographic Authority (PyCA). Provee primitivas de alto y bajo nivel, sigue estándares NIST y es auditada regularmente. Evita usar `pycryptodome` o `hashlib` directo para operaciones críticas asimétricasporque `cryptography` tiene APIs de más alto nivel y menos propensas a errores de implementación.

`hashlib` (stdlib) sí se usará para el Message Digest (operación a), ya que es suficiente y viene incluido con Python.

---

## 3. Estructura de Carpetas

```
crypto_suite/
│
├── backend/
│   ├── __init__.py
│   ├── app.py                  # Entry point Flask, registro de blueprints
│   ├── config.py               # Configuración por entorno (dev / prod)
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── digest.py           # Endpoints para operación a
│   │   ├── firma_rsa.py        # Endpoints para operación b
│   │   ├── simetrico.py        # Endpoints para operación c
│   │   ├── asimetrico.py       # Endpoints para operación d
│   │   └── ecc.py              # Endpoints para operación e
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── digest_service.py
│   │   ├── firma_rsa_service.py
│   │   ├── simetrico_service.py
│   │   ├── asimetrico_service.py
│   │   └── ecc_service.py
│   │
│   └── utils/
│       ├── __init__.py
│       └── encoders.py         # Helpers para Base64, hex, serialización de claves
│
├── frontend/
│   ├── templates/
│   │   └── index.html          # SPA con pestañas (Jinja2 base)
│   └── static/
│       ├── css/
│       │   └── styles.css
│       └── js/
│           └── app.js          # Lógica de UI, fetch API calls
│
├── tests/
│   ├── test_digest.py
│   ├── test_firma_rsa.py
│   ├── test_simetrico.py
│   ├── test_asimetrico.py
│   └── test_ecc.py
│
├── requirements.txt
├── .env.example
└── README.md
```

---

## 4. Arquitectura

### 4.1 Patrón General

```
Browser (HTML + JS)
       │  HTTP JSON
       ▼
Flask App (app.py)
       │  Blueprint por operación
       ▼
routes/[operacion].py   ← solo valida entrada y llama al service
       │
       ▼
services/[operacion]_service.py  ← toda la lógica criptográfica aquí
       │
       ▼
cryptography / hashlib (librería)
```

**Patrón aplicado:** Service Layer + Blueprint (Flask).  
- Los `routes` son delgados: validan JSON de entrada, llaman al service, retornan JSON.  
- Los `services` son puros Python: sin dependencia de Flask. Facilita pruebas unitarias sin levantar el servidor.

### 4.2 Convención de Respuesta JSON

Todos los endpoints retornan siempre la misma estructura:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

En caso de error:

```json
{
  "success": false,
  "data": null,
  "error": "Descripción legible del error"
}
```

---

## 5. Descripción de Cada Vista

La interfaz es una sola página (`index.html`) con **cinco pestañas**. Cada pestaña es independiente y corresponde a una de las siguientes vistas.

---

### Vista A — Message Digest (Resumen Digital)

**Propósito:** Mostrar que una pequeña variación en el mensaje produce un hash completamente diferente (efecto avalancha).

**Diseño:**
```
┌─────────────────────────────────────┐
│  Algoritmo: [SHA-256 ▼]             │
│  Mensaje:                           │
│  ┌─────────────────────────────┐    │
│  │ Escribe aquí tu mensaje...  │    │
│  └─────────────────────────────┘    │
│  [ Generar Hash ]                   │
│                                     │
│  Resultado (hex):                   │
│  ┌─────────────────────────────┐    │
│  │ e3b0c44298fc1c149afb...     │    │
│  └─────────────────────────────┘    │
│  Longitud: 256 bits                 │
└─────────────────────────────────────┘
```

**Funcionalidades:**
- Selector de algoritmo: SHA-256, SHA-3-256, MD5.
- Textarea para el mensaje (texto plano o hex).
- Botón "Generar Hash" → llamada POST `/api/digest`.
- Muestra resultado en hex y en Base64.
- Muestra la longitud en bits del digest resultante.
- Botón "Copiar" para copiar el hash al portapapeles.

**Endpoint:** `POST /api/digest`  
Body: `{ "mensaje": "...", "algoritmo": "sha256" }`  
Response: `{ "hash_hex": "...", "hash_b64": "...", "bits": 256 }`

---

### Vista B — Firma Digital RSA (Firmar y Verificar)

**Propósito:** Demostrar integridad y autenticidad mediante firma RSA-PSS.

**Diseño (dos sub-paneles):**

```
┌──────────────────┬──────────────────┐
│   FIRMAR         │   VERIFICAR      │
│                  │                  │
│ [ Generar par ]  │ Mensaje:         │
│                  │ [______________] │
│ Clave Pública:   │                  │
│ [______________] │ Firma (B64):     │
│                  │ [______________] │
│ Clave Privada:   │                  │
│ [______________] │ Clave Pública:   │
│                  │ [______________] │
│ Mensaje:         │                  │
│ [______________] │ [ Verificar ]    │
│                  │                  │
│ [ Firmar ]       │ ✅ Firma válida  │
│                  │                  │
│ Firma (B64):     │                  │
│ [______________] │                  │
└──────────────────┴──────────────────┘
```

**Funcionalidades:**
- Botón "Generar par de claves RSA-2048" → retorna clave pública y privada en formato PEM.
- Panel izquierdo (firmar): recibe mensaje + clave privada PEM, retorna firma en Base64.
- Panel derecho (verificar): recibe mensaje + firma B64 + clave pública PEM, retorna verdadero/falso con badge visual.
- Las claves PEM son editables (el usuario puede pegar sus propias).

**Endpoints:**  
`POST /api/firma-rsa/generar-claves` → `{ "clave_publica_pem": "...", "clave_privada_pem": "..." }`  
`POST /api/firma-rsa/firmar` → `{ "firma_b64": "..." }`  
`POST /api/firma-rsa/verificar` → `{ "valido": true }`

---

### Vista C — Cifrado Simétrico AES-256-GCM (Clave Privada)

**Propósito:** Cifrar y descifrar un mensaje usando una clave compartida (simétrica). Se elige AES-256-GCM porque provee cifrado autenticado (confidencialidad + integridad en un solo paso).

**Diseño:**

```
┌─────────────────────────────────────┐
│  CIFRADO SIMÉTRICO — AES-256-GCM    │
│                                     │
│  Clave (hex, 32 bytes):             │
│  [__________________] [Generar]     │
│                                     │
│  ── CIFRAR ──────────────────────   │
│  Mensaje: [____________________]    │
│  [ Cifrar ]                         │
│  IV (hex): [___________________]    │
│  Texto cifrado (B64): [_________]   │
│  Tag GCM (B64): [_______________]   │
│                                     │
│  ── DESCIFRAR ───────────────────   │
│  Texto cifrado (B64): [_________]   │
│  IV (hex): [___________________]    │
│  Tag GCM (B64): [_______________]   │
│  [ Descifrar ]                      │
│  Mensaje recuperado: [__________]   │
└─────────────────────────────────────┘
```

**Funcionalidades:**
- Botón "Generar clave" → genera 32 bytes aleatorios seguros y los muestra en hex.
- Sección Cifrar: recibe mensaje + clave, devuelve IV + ciphertext + tag GCM.
- Sección Descifrar: recibe ciphertext + IV + tag + clave, devuelve mensaje original. Si el tag no coincide (mensaje alterado), muestra error de autenticación.
- El IV se genera aleatoriamente en cada cifrado (nunca reutilizar).

**Endpoints:**  
`POST /api/simetrico/cifrar` → `{ "iv_hex": "...", "cifrado_b64": "...", "tag_b64": "..." }`  
`POST /api/simetrico/descifrar` → `{ "mensaje": "..." }` o error de autenticación

---

### Vista D — Cifrado Asimétrico RSA-OAEP (Clave Pública)

**Propósito:** Demostrar cifrado con llave pública donde solo el poseedor de la llave privada puede descifrar.

**Diseño:**

```
┌─────────────────────────────────────┐
│  CIFRADO ASIMÉTRICO — RSA-OAEP      │
│                                     │
│  [ Generar par RSA-2048 ]           │
│                                     │
│  ── CIFRAR (con clave pública) ──   │
│  Clave pública (PEM):               │
│  [____________________________]     │
│  Mensaje (máx ~190 bytes):          │
│  [____________________________]     │
│  [ Cifrar ]                         │
│  Resultado (B64): [_____________]   │
│                                     │
│  ── DESCIFRAR (con clave priv.) ─   │
│  Clave privada (PEM):               │
│  [____________________________]     │
│  Texto cifrado (B64):               │
│  [____________________________]     │
│  [ Descifrar ]                      │
│  Mensaje recuperado: [__________]   │
└─────────────────────────────────────┘
```

**Funcionalidades:**
- Botón "Generar par RSA-2048": genera y muestra ambas claves en PEM.
- Cifrar: usa la clave pública (RSA-OAEP + SHA-256) para cifrar el mensaje.
- Descifrar: usa la clave privada para recuperar el mensaje.
- Muestra advertencia visual si el mensaje supera el límite de bytes que RSA puede cifrar directamente (para que el estudiante entienda la limitación y el patrón RSA+AES híbrido en producción).

**Endpoints:**  
`POST /api/asimetrico/generar-claves`  
`POST /api/asimetrico/cifrar`  
`POST /api/asimetrico/descifrar`

---

### Vista E — ECC: Firmar y Verificar (Curvas Elípticas)

**Propósito:** Demostrar ECDSA con curva P-256, mostrando claves mucho más cortas que RSA con seguridad equivalente.

**Diseño:**

```
┌─────────────────────────────────────┐
│  ECC — ECDSA con curva P-256        │
│                                     │
│  [ Generar par ECC ]                │
│                                     │
│  Clave privada (PEM):               │
│  [____________________________]     │
│  Clave pública (PEM):               │
│  [____________________________]     │
│                                     │
│  ── FIRMAR ──────────────────────   │
│  Mensaje: [____________________]    │
│  [ Firmar ]                         │
│  Firma (B64): [_________________]   │
│                                     │
│  ── VERIFICAR ───────────────────   │
│  Mensaje: [____________________]    │
│  Firma (B64): [_________________]   │
│  Clave pública (PEM):               │
│  [____________________________]     │
│  [ Verificar ]   ✅ / ❌            │
└─────────────────────────────────────┘
```

**Funcionalidades:**
- Genera par de claves ECC (curva SECP256R1 / P-256) en formato PEM.
- Firma un mensaje con ECDSA + SHA-256.
- Verifica la firma (mensaje + firma + clave pública).
- Muestra comparación de tamaños de clave vs RSA equivalente (informativo pedagógico).

**Endpoints:**  
`POST /api/ecc/generar-claves`  
`POST /api/ecc/firmar`  
`POST /api/ecc/verificar`

---

## 6. Implementación de los Services (Referencia Técnica)

### `digest_service.py`

```python
import hashlib, base64

ALGORITMOS = {
    "sha256": hashlib.sha256,
    "sha3_256": hashlib.sha3_256,
    "md5": hashlib.md5,
}

def generar_digest(mensaje: str, algoritmo: str) -> dict:
    h = ALGORITMOS[algoritmo](mensaje.encode()).digest()
    return {
        "hash_hex": h.hex(),
        "hash_b64": base64.b64encode(h).decode(),
        "bits": len(h) * 8,
    }
```

### `firma_rsa_service.py`

```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
import base64

def generar_claves():
    priv = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return {
        "clave_privada_pem": priv.private_bytes(...PEM...),
        "clave_publica_pem": priv.public_key().public_bytes(...PEM...),
    }

def firmar(mensaje: str, clave_privada_pem: str) -> str:
    priv = serialization.load_pem_private_key(clave_privada_pem.encode(), password=None)
    firma = priv.sign(mensaje.encode(), padding.PSS(...), hashes.SHA256())
    return base64.b64encode(firma).decode()

def verificar(mensaje: str, firma_b64: str, clave_publica_pem: str) -> bool:
    pub = serialization.load_pem_public_key(clave_publica_pem.encode())
    try:
        pub.verify(base64.b64decode(firma_b64), mensaje.encode(), padding.PSS(...), hashes.SHA256())
        return True
    except Exception:
        return False
```

### `simetrico_service.py`

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os, base64

def cifrar(mensaje: str, clave_hex: str) -> dict:
    clave = bytes.fromhex(clave_hex)          # 32 bytes = 256 bits
    iv = os.urandom(12)                        # 96 bits, recomendado para GCM
    aesgcm = AESGCM(clave)
    cifrado_con_tag = aesgcm.encrypt(iv, mensaje.encode(), None)
    cifrado, tag = cifrado_con_tag[:-16], cifrado_con_tag[-16:]
    return {
        "iv_hex": iv.hex(),
        "cifrado_b64": base64.b64encode(cifrado).decode(),
        "tag_b64": base64.b64encode(tag).decode(),
    }

def descifrar(cifrado_b64: str, iv_hex: str, tag_b64: str, clave_hex: str) -> str:
    clave = bytes.fromhex(clave_hex)
    iv = bytes.fromhex(iv_hex)
    aesgcm = AESGCM(clave)
    datos = base64.b64decode(cifrado_b64) + base64.b64decode(tag_b64)
    return aesgcm.decrypt(iv, datos, None).decode()
```

### `asimetrico_service.py`

```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
import base64

def cifrar(mensaje: str, clave_publica_pem: str) -> str:
    pub = serialization.load_pem_public_key(clave_publica_pem.encode())
    cifrado = pub.encrypt(mensaje.encode(), padding.OAEP(
        mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
    return base64.b64encode(cifrado).decode()

def descifrar(cifrado_b64: str, clave_privada_pem: str) -> str:
    priv = serialization.load_pem_private_key(clave_privada_pem.encode(), password=None)
    return priv.decrypt(base64.b64decode(cifrado_b64), padding.OAEP(
        mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None)).decode()
```

### `ecc_service.py`

```python
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
import base64

def generar_claves():
    priv = ec.generate_private_key(ec.SECP256R1())
    return {
        "clave_privada_pem": priv.private_bytes(...PEM...),
        "clave_publica_pem": priv.public_key().public_bytes(...PEM...),
    }

def firmar(mensaje: str, clave_privada_pem: str) -> str:
    priv = serialization.load_pem_private_key(clave_privada_pem.encode(), password=None)
    firma = priv.sign(mensaje.encode(), ec.ECDSA(hashes.SHA256()))
    return base64.b64encode(firma).decode()

def verificar(mensaje: str, firma_b64: str, clave_publica_pem: str) -> bool:
    pub = serialization.load_pem_public_key(clave_publica_pem.encode())
    try:
        pub.verify(base64.b64decode(firma_b64), mensaje.encode(), ec.ECDSA(hashes.SHA256()))
        return True
    except Exception:
        return False
```

---

## 7. Entry Point Flask (`app.py`)

```python
from flask import Flask
from backend.routes.digest import bp_digest
from backend.routes.firma_rsa import bp_firma_rsa
from backend.routes.simetrico import bp_simetrico
from backend.routes.asimetrico import bp_asimetrico
from backend.routes.ecc import bp_ecc

def create_app():
    app = Flask(__name__,
                template_folder="../frontend/templates",
                static_folder="../frontend/static")
    app.config.from_object("backend.config.DevConfig")

    for bp in [bp_digest, bp_firma_rsa, bp_simetrico, bp_asimetrico, bp_ecc]:
        app.register_blueprint(bp, url_prefix="/api")

    @app.route("/")
    def index():
        from flask import render_template
        return render_template("index.html")

    return app

if __name__ == "__main__":
    create_app().run(debug=True)
```

---

## 8. Frontend (`index.html` + `app.js`)

### Estructura HTML

```html
<nav class="tabs">
  <button data-tab="digest">a. Message Digest</button>
  <button data-tab="firma-rsa">b. Firma RSA</button>
  <button data-tab="simetrico">c. AES Simétrico</button>
  <button data-tab="asimetrico">d. RSA Asimétrico</button>
  <button data-tab="ecc">e. ECC</button>
</nav>

<div id="digest" class="tab-content"> ... </div>
<div id="firma-rsa" class="tab-content hidden"> ... </div>
<!-- etc. -->
```

### Patrón de llamada en `app.js`

```javascript
async function callApi(endpoint, body) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}
```

No se usan frameworks JS externos. HTML + CSS + JS vanilla es suficiente y reduce la complejidad de configuración.

---

## 9. Buenas Prácticas y Reglas de Implementación

### Criptografía

| Regla | Razón |
|-------|-------|
| Nunca implementar algoritmos desde cero | Los errores de implementación son la fuente #1 de vulnerabilidades criptográficas |
| Usar solo primitivas de `cryptography` (PyCA) | Librería auditada, mantiene correctamente el padding y los modos |
| AES siempre en modo GCM (no ECB, no CBC sin HMAC) | GCM provee autenticación integrada; ECB es inseguro por diseño |
| El IV/nonce de AES-GCM siempre debe ser aleatorio y único | `os.urandom(12)` en cada operación de cifrado |
| RSA key size mínimo 2048 bits | 1024 es rompible; 2048 es el mínimo aceptado actualmente |
| Usar `padding.PSS` para firma RSA (no PKCS1v15) | PSS es el esquema de firma RSA moderno y probabilístico |
| Usar `padding.OAEP` para cifrado RSA (no PKCS1v15) | OAEP resiste ataques de padding oracle |
| Curva P-256 (SECP256R1) para ECC | Curva estándar NIST, ampliamente soportada y auditada |

### Código

- **No hardcodear claves**: las claves siempre se generan en tiempo de ejecución o se leen del request.
- **Manejo de excepciones explícito**: capturar `cryptography.exceptions.InvalidSignature`, `cryptography.exceptions.InvalidTag` y retornar el error apropiado en la respuesta JSON.
- **Separación de capas**: los routes NO importan nada de `cryptography`. Solo importan services.
- **Type hints en Python**: todos los services deben tener anotaciones de tipo (`def firmar(mensaje: str, ...) -> str`).
- **Sin estado en el servidor**: el servidor no almacena claves ni mensajes entre requests. Todo lo necesario viene en el body del request.

### Seguridad de la App Web

- Flask en modo `debug=False` en cualquier despliegue que no sea local.
- Agregar header `Content-Security-Policy` básico.
- No reflejar en la respuesta datos de entrada sin sanitizar.

---

## 10. Tests (`tests/`)

Cada service debe tener al menos:

```
test_digest.py
  ✓ SHA-256 de string conocido produce hash conocido
  ✓ Mensaje vacío produce hash válido
  ✓ Algoritmo inválido lanza excepción apropiada

test_firma_rsa.py
  ✓ Firmar y verificar con el mismo par → True
  ✓ Verificar con clave pública diferente → False
  ✓ Mensaje alterado → False

test_simetrico.py
  ✓ Cifrar y descifrar recupera mensaje original
  ✓ Tag alterado lanza InvalidTag
  ✓ IV reutilizado con misma clave → advertencia conceptual en comentario

test_asimetrico.py
  ✓ Cifrar con pública y descifrar con privada → texto original
  ✓ Mensaje que excede límite → excepción con mensaje claro

test_ecc.py
  ✓ Firmar y verificar → True
  ✓ Firma alterada → False
  ✓ Clave pública de par diferente → False
```

Ejecutar con: `python -m pytest tests/ -v`

---

## 11. `requirements.txt`

```
Flask==3.0.3
cryptography==42.0.8
pytest==8.2.2
```

---

## 12. `.env.example`

```
FLASK_ENV=development
FLASK_SECRET_KEY=cambia_esto_en_produccion
```

---

## 13. Instrucciones de Arranque

```bash
# 1. Clonar / crear carpeta
git clone <repo> && cd crypto_suite

# 2. Entorno virtual
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 3. Dependencias
pip install -r requirements.txt

# 4. Variables de entorno
cp .env.example .env

# 5. Correr
python backend/app.py

# 6. Abrir navegador
# http://localhost:5000
```

---

## 14. Decisiones de Diseño Explicadas

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| Flask (no FastAPI) | FastAPI | Flask es más sencillo de configurar para un monolito pequeño sin necesidad de async |
| JS Vanilla (no React/Vue) | React | Evita complejidad de build tools; el frontend es simple y didáctico |
| AES-GCM (no AES-CBC) | AES-CBC + HMAC | GCM provee AEAD en una sola primitiva; menos código = menos errores |
| RSA-PSS (no RSA-PKCS1v15) | PKCS1v15 | PSS es el estándar moderno para firmas RSA según NIST SP 800-131A |
| SECP256R1/P-256 (no secp256k1) | secp256k1 | P-256 es la curva estándar NIST; secp256k1 es usada principalmente en Bitcoin |
| Sin base de datos | SQLite/PostgreSQL | Las claves no deben persistirse; contexto didáctico sin necesidad de estado |



## Especificaciones de Diseño

- La aplicacion en su diseño UX no debe contener emojis deberas usar bibliotecas de iconos como FontAwesome o Material Icons para los botones de copiar, generar claves, etc. o la que prefieras
- Si necesitas mostrar un mensaje de error o éxito, utiliza un sistema de alertas o badges visuales en lugar de emojis para mantener una apariencia profesional y clara.
- No diseñes una aplicación compleja para expertos en criptografía, sino una plataforma didáctica, elegante e intuitiva, donde cualquier estudiante pueda comprender visualmente cómo funcionan los algoritmos criptográficos.

Estilo visual

La aplicación debe parecer una mezcla entre:

GitHub
Stripe Dashboard
Cloudflare
Vercel
IBM Security

Con diseño:

limpio
minimalista
moderno
elegante
espacioso

Mucho espacio en blanco.

No utilizar interfaces saturadas.

Paleta de colores
Color principal

Azul profundo

#2563EB

Utilizado para:

botones principales
enlaces
elementos activos
Color secundario

Cian tecnológico

#06B6D4

Para:

iconos
indicadores
gráficos
highlights
Fondo
#F8FAFC

Cards:

#FFFFFF
Texto

Principal

#0F172A

Secundario

#64748B
Estados

Éxito

#22C55E

Advertencia

#F59E0B

Error

#EF4444

Información

#3B82F6
Tipografía

Utilizar:

Inter
o
SF Pro Display

Jerarquía:

Título principal:

40px

Subtítulo:

24px

Cards:

20px

Labels:

16px

Texto:

15px

Botones:

16px semibold



## Estilo por Vista

Layout general

Toda la aplicación estará organizada así:

--------------------------------------------------

LOGO

CryptoLab

Laboratorio Interactivo de Criptografía

--------------------------------------------------

Sidebar

🏠 Inicio

🔐 Message Digest

✍ Firma RSA

🛡 AES-256

🔑 RSA-OAEP

⚡ ECC

ℹ Información

--------------------------------------------------

Área principal

Header

Contenido

Footer



La navegación lateral debe permanecer fija.

La zona de trabajo cambia según la opción elegida.

Dashboard inicial

Debe contener cinco tarjetas grandes.

Cada tarjeta tendrá:

ícono

nombre

descripción

botón

Ejemplo

----------------------------

🔐

Message Digest

Genera resúmenes digitales

[Entrar]

----------------------------



Las tarjetas tendrán:

sombra suave
bordes redondeados
efecto hover
animación de elevación
Componentes globales

Todos los formularios deben utilizar:

Cards

╭────────────────────╮
                     │
                     │
╰────────────────────╯

con:

border-radius:

16px

padding:

24px

shadow:

leve

Botones primarios

Azules

Hover:

más oscuro

Animación:

200ms

Botones secundarios

blancos

borde azul

Botones peligrosos

rojos

Inputs

Altura:

48px

bordes:

12px

focus:

borde azul

shadow azul suave

TextArea

mínimo:

160px

redimensionable

contador de caracteres

Experiencia de usuario

Cada vista debe dividirse en:

Explicación

↓

Formulario

↓

Resultado

↓

Información educativa



No mostrar todo junto.

Cada algoritmo debe comenzar con una caja:

¿Qué hace este algoritmo?

Ejemplo:

SHA-256 genera una huella digital única del mensaje.

Modificar un solo carácter cambia completamente el resultado.

Luego

¿Cómo funciona?

breve explicación

Luego

Zona interactiva

Luego

Resultado

Luego

Dato curioso

Vista A
Message Digest

Organización

---------------------------------

Explicación

---------------------------------

Seleccionar algoritmo

---------------------------------

Mensaje

---------------------------------

Botón

---------------------------------

Resultado

---------------------------------

Información



Mostrar:

Hash Hex

Hash Base64

Bits

Tiempo de procesamiento

Botón copiar

Botón descargar

Agregar una comparación automática:

Mensaje original

↓

Modificar una letra

↓

Nuevo hash

↓

Comparación visual

con porcentaje diferente.

Mostrar el efecto avalancha.

Vista B
Firma Digital RSA

Separar visualmente en dos columnas

Firmar

|

Verificar

Cada columna debe ser una card independiente.

Generar claves arriba.

Las claves deben aparecer dentro de un editor tipo código con fuente monoespaciada.

Resultado:

badge grande

✅ Firma válida

o

❌ Firma inválida

Animación suave.

Vista C
AES-256-GCM

Mostrar flujo:

Mensaje

↓

Clave

↓

IV

↓

Ciphertext

↓

Tag

Cada elemento conectado mediante flechas.

La parte de descifrado:

Ciphertext

↓

IV

↓

Tag

↓

Clave

↓

Mensaje

Si el Tag es incorrecto:

mostrar alerta roja:

Autenticación fallida

El mensaje fue alterado o la clave es incorrecta.

Nunca simplemente:

"Error"

Vista D
RSA OAEP

Explicar mediante diagrama:

Mensaje

↓

Clave pública

↓

Texto cifrado

↓

Clave privada

↓

Mensaje original

Si el mensaje supera el límite:

mostrar advertencia amarilla:

RSA no está diseñado para cifrar grandes cantidades de información.

En sistemas reales se utiliza un esquema híbrido RSA + AES.
Vista E
ECC

Mostrar comparación visual:

RSA

██████████████████

2048 bits

------------------

ECC

████

256 bits



Explicar:

"Una clave ECC mucho más pequeña ofrece un nivel de seguridad comparable a una clave RSA considerablemente mayor."

Componentes adicionales

Agregar:

Tooltips

Ejemplo:

Al pasar sobre IV

mostrar

Initialization Vector

Valor aleatorio necesario para evitar reutilización del cifrado.

Agregar iconos:

copiar

descargar

información

advertencia

éxito

Agregar Toasts

Ejemplos:

✅ Hash copiado

✅ Clave generada

✅ Firma creada

❌ Error de autenticación

Loader

Al ejecutar cualquier algoritmo

mostrar spinner

Procesando...

durante unos cientos de milisegundos.

Nunca congelar la interfaz.

Accesibilidad

Cumplir WCAG:

Contraste AA

Navegación con teclado

Focus visible

Etiquetas claras

Iconos acompañados por texto

No depender únicamente del color para comunicar estados

Mensajes compatibles con lectores de pantalla

Responsive

Desktop:

Sidebar + contenido

Tablet:

Sidebar colapsable

Mobile:

Bottom Navigation

Cards en una sola columna

Botones grandes

Microinteracciones

Hover suave

Fade-in al cargar resultados

Elevación de cards

Transiciones de 200–300 ms

Copiado con animación

Resultado exitoso con pequeño efecto visual

Footer
CryptoLab

Suite educativa de criptografía

Implementación de:

✔ Message Digest

✔ RSA Digital Signature

✔ AES-256-GCM

✔ RSA-OAEP

✔ ECC ECDSA
Resultado esperado

Generar una interfaz de nivel profesional que parezca una aplicación SaaS moderna, priorizando la claridad pedagógica, la experiencia del usuario y una estética tecnológica elegante, utilizando componentes consistentes, jerarquía visual clara y buenas prácticas internacionales de UI/UX.