# CryptoLab — Documentación Técnica

> Laboratorio Interactivo de Criptografía  
> Suite educativa que implementa los cinco pilares de la criptografía moderna

---

## 1. Arquitectura, Tecnologías y Librerías

### Tipo de Arquitectura

CryptoLab sigue una arquitectura **monolítica de tres capas** con separación lógica entre presentación, enrutamiento y lógica de negocio:

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                      │
│         HTML + CSS + JavaScript Vanilla (SPA)               │
│         Sidebar fijo · 6 vistas · Sistema de toasts         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP JSON (fetch API)
┌──────────────────────────▼──────────────────────────────────┐
│                    CAPA DE ENRUTAMIENTO                      │
│              Flask Blueprints (routes/)                      │
│    Valida entrada · Delega al service · Retorna JSON         │
└──────────────────────────┬──────────────────────────────────┘
                           │ Llamadas Python puras
┌──────────────────────────▼──────────────────────────────────┐
│                    CAPA DE SERVICIOS                         │
│              Service Layer (services/)                       │
│   Lógica criptográfica pura · Sin dependencia de Flask      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  LIBRERÍAS CRIPTOGRÁFICAS                    │
│            cryptography (PyCA) · hashlib (stdlib)           │
└─────────────────────────────────────────────────────────────┘
```

**Patrón aplicado:** Service Layer + Blueprint (Flask).

- Los `routes/` son **delgados**: validan el JSON de entrada, llaman al service y retornan la respuesta uniforme.
- Los `services/` son **puros Python**: no importan nada de Flask, lo que permite ejecutar los tests sin levantar el servidor.
- El frontend es una **SPA** (Single Page Application) sin frameworks JS: navegación mediante JavaScript vanilla que muestra/oculta secciones.

### Convención de Respuesta JSON

Todos los endpoints retornan siempre la misma estructura:

```json
// Éxito
{ "success": true,  "data": { "..." }, "error": null }

// Error
{ "success": false, "data": null, "error": "Descripción legible del error" }
```

---

### Tecnologías Utilizadas

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| Backend | **Python** | 3.11+ | Lenguaje principal |
| Backend | **Flask** | 3.0.3 | Framework web, routing, templates |
| Backend | **cryptography (PyCA)** | 42.0.8 | Primitivas criptográficas (RSA, AES, ECC) |
| Backend | **hashlib** | stdlib | Funciones de hashing (SHA-256, SHA-3, MD5) |
| Backend | **python-dotenv** | 1.0.1 | Gestión de variables de entorno |
| Testing | **pytest** | 8.2.2 | Framework de pruebas unitarias |
| Frontend | **HTML5 + CSS3** | — | Estructura y estilos |
| Frontend | **JavaScript Vanilla** | ES2020 | Lógica de UI y llamadas a la API |
| Frontend | **Inter** (Google Fonts) | — | Tipografía principal |
| Frontend | **FontAwesome 6** | 6.5.1 CDN | Sistema de iconos |

### ¿Por qué `cryptography` (PyCA)?

Es la librería de referencia mantenida por la Python Cryptographic Authority. Provee primitivas de alto nivel, sigue estándares NIST y es auditada regularmente. Evita errores comunes de implementación al usar APIs seguras por defecto (padding correcto, modos seguros).

---

## 2. Módulos del Proyecto

### Estructura de Carpetas

```
suite_encriptacion/
│
├── run.py                          # Punto de entrada — ejecuta el servidor
├── requirements.txt                # Dependencias del proyecto
├── .env.example                    # Plantilla de variables de entorno
│
├── backend/
│   ├── app.py                      # Fábrica de la app Flask (create_app)
│   ├── config.py                   # Configuración por entorno (Dev/Prod)
│   │
│   ├── routes/                     # Capa de enrutamiento (Blueprints)
│   │   ├── digest.py               # Endpoints → Módulo A
│   │   ├── firma_rsa.py            # Endpoints → Módulo B
│   │   ├── simetrico.py            # Endpoints → Módulo C
│   │   ├── asimetrico.py           # Endpoints → Módulo D
│   │   └── ecc.py                  # Endpoints → Módulo E
│   │
│   ├── services/                   # Capa de lógica criptográfica
│   │   ├── digest_service.py       # Lógica → Módulo A
│   │   ├── firma_rsa_service.py    # Lógica → Módulo B
│   │   ├── simetrico_service.py    # Lógica → Módulo C
│   │   ├── asimetrico_service.py   # Lógica → Módulo D
│   │   └── ecc_service.py          # Lógica → Módulo E
│   │
│   └── utils/
│       └── encoders.py             # Helpers: PEM → str, serialización de claves
│
├── frontend/
│   ├── templates/
│   │   └── index.html              # SPA principal (6 vistas, sidebar fijo)
│   └── static/
│       ├── css/styles.css          # Design system completo
│       └── js/app.js               # Lógica de navegación y llamadas API
│
└── tests/                          # Suite de pruebas unitarias (42 tests)
    ├── test_digest.py
    ├── test_firma_rsa.py
    ├── test_simetrico.py
    ├── test_asimetrico.py
    └── test_ecc.py
```

### Resumen de Módulos Criptográficos

| # | Módulo | Algoritmo | Servicio | Endpoints |
|---|---|---|---|---|
| A | Message Digest | SHA-256, SHA-3-256, MD5 | `digest_service.py` | `POST /api/digest` |
| B | Firma Digital RSA | RSA-PSS + SHA-256 | `firma_rsa_service.py` | 3 endpoints |
| C | Cifrado Simétrico | AES-256-GCM | `simetrico_service.py` | 3 endpoints |
| D | Cifrado Asimétrico | RSA-OAEP + SHA-256 | `asimetrico_service.py` | 3 endpoints |
| E | Curvas Elípticas | ECDSA + P-256 | `ecc_service.py` | 3 endpoints |

---

## 3. Documentación por Módulo

---

### Módulo A — Message Digest (Resumen Digital)

#### ¿Qué es?

Una **función hash criptográfica** transforma un mensaje de longitud arbitraria en una cadena de bits de longitud fija llamada _digest_ o _resumen digital_. Es un proceso de **una sola vía**: no se puede recuperar el mensaje original a partir del hash.

#### Propiedades fundamentales

| Propiedad | Descripción |
|---|---|
| **Determinismo** | El mismo mensaje siempre produce el mismo hash |
| **Efecto Avalancha** | Cambiar un solo bit en el mensaje cambia ~50% de los bits del hash |
| **Irreversibilidad** | Es computacionalmente inviable reconstruir el mensaje desde el hash |
| **Resistencia a colisiones** | Es extremadamente difícil encontrar dos mensajes con el mismo hash |

#### Algoritmos implementados

| Algoritmo | Longitud del digest | Estado | Uso recomendado |
|---|---|---|---|
| **SHA-256** | 256 bits (32 bytes) | Seguro | TLS, certificados, firmas digitales |
| **SHA-3-256** | 256 bits (32 bytes) | Seguro | Alternativa post-SHA-2, estándar NIST 2015 |
| **MD5** | 128 bits (16 bytes) | Obsoleto para seguridad | Solo checksums no críticos |

#### Funcionamiento Interno

```
Mensaje (cualquier longitud)
          │
          ▼
┌─────────────────────────┐
│  hashlib.sha256(msg)    │  ← Función de compresión iterativa
│  hashlib.sha3_256(msg)  │    (Merkle–Damgård para SHA-2,
│  hashlib.md5(msg)       │     Sponge construction para SHA-3)
└─────────────────────────┘
          │
          ▼
 Digest de longitud fija
 (hex + Base64 + bits)
```

**Librería usada:** `hashlib` (stdlib Python).  
No se usa `cryptography` aquí porque `hashlib` es suficiente para hashing básico y viene incluido con Python.

#### Implementación del Service

```python
# backend/services/digest_service.py

ALGORITMOS = {
    "sha256":   hashlib.sha256,
    "sha3_256": hashlib.sha3_256,
    "md5":      hashlib.md5,
}

def generar_digest(mensaje: str, algoritmo: str) -> dict:
    h = ALGORITMOS[algoritmo](mensaje.encode("utf-8")).digest()
    return {
        "hash_hex": h.hex(),
        "hash_b64": base64.b64encode(h).decode("utf-8"),
        "bits":     len(h) * 8,
    }
```

#### Endpoint

| Método | URL | Body | Respuesta |
|---|---|---|---|
| POST | `/api/digest` | `{"mensaje": "...", "algoritmo": "sha256"}` | `{"hash_hex": "...", "hash_b64": "...", "bits": 256}` |

#### Funcionalidad adicional — Efecto Avalancha

El módulo calcula automáticamente el hash de dos versiones del mensaje (original y con un carácter modificado) y muestra visualmente qué bits cambiaron y qué porcentaje representa.

---

#### Prueba para el Screenshot del Módulo A

> **Qué ingresar:**
> - **Algoritmo:** `SHA-256`
> - **Mensaje:** `criptografia`
> - Presionar **"Generar Hash"**
>
> **Qué observar:**
> 1. El hash hex de 64 caracteres aparece en la sección de resultado
> 2. La longitud indica `256 bits`
> 3. La sección **Efecto Avalancha** se activa automáticamente mostrando el hash de `criptografía` (con tilde) vs `criptografia` y resaltando los bits que cambiaron (espera ver ~50% diferencia)

**Screenshot — Módulo A:**

> 📷 _[Insertar aquí la captura de pantalla de la Vista A con el hash generado y el efecto avalancha visible]_

---

---

### Módulo B — Firma Digital RSA (Firmar y Verificar)

#### ¿Qué es?

La **firma digital** es el equivalente criptográfico de una firma manuscrita. Usa un par de claves asimétricas para:
- Garantizar **autenticidad**: el mensaje fue enviado por quien dice haberlo enviado.
- Garantizar **integridad**: el mensaje no fue alterado en tránsito.
- Proveer **no repudio**: el firmante no puede negar haber firmado.

#### Algoritmo: RSA-PSS con SHA-256

El sistema implementa **RSA-PSS** (Probabilistic Signature Scheme), el esquema de firma RSA moderno recomendado por NIST (SP 800-131A). Es superior al esquema antiguo PKCS#1 v1.5 porque:

- Incluye **aleatorización**: cada firma del mismo mensaje es diferente (pero todas válidas).
- Resiste ataques de padding oracle.
- Tiene prueba formal de seguridad.

#### Flujo Criptográfico

```
── FIRMAR ──────────────────────────────────────────────────
Mensaje  ──► SHA-256 ──► Hash ──► RSA-PSS(clave privada) ──► Firma (bytes)
                                                               │
                                                     Base64 encode
                                                               │
                                                          firma_b64
                                                          
── VERIFICAR ────────────────────────────────────────────────
Mensaje + firma_b64 + clave_pública
          │
          ▼
RSA-PSS.verify(clave_pública, firma, mensaje)
          │
     ┌────┴─────┐
  Válido     Inválido
(True)       (False)
```

#### Parámetros del Par de Claves

| Parámetro | Valor | Justificación |
|---|---|---|
| Tamaño de clave | **2048 bits** | Mínimo aceptado actualmente. 1024 bits es rompible |
| Exponente público | **65537** | Valor estándar; balance entre seguridad y eficiencia |
| Esquema de padding | **PSS** | Recomendado por NIST SP 800-131A |
| Hash interno | **SHA-256** | Estándar vigente |
| Formato de claves | **PEM** | Formato de texto interoperable |

#### Implementación del Service

```python
# backend/services/firma_rsa_service.py

def generar_claves() -> dict:
    priv = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return {
        "clave_privada_pem": private_key_to_pem(priv),
        "clave_publica_pem": public_key_to_pem(priv.public_key()),
    }

def firmar(mensaje: str, clave_privada_pem: str) -> str:
    priv = serialization.load_pem_private_key(str_to_pem(clave_privada_pem), password=None)
    firma = priv.sign(
        mensaje.encode("utf-8"),
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
        hashes.SHA256(),
    )
    return base64.b64encode(firma).decode("utf-8")

def verificar(mensaje: str, firma_b64: str, clave_publica_pem: str) -> bool:
    pub = serialization.load_pem_public_key(str_to_pem(clave_publica_pem))
    try:
        pub.verify(base64.b64decode(firma_b64), mensaje.encode("utf-8"),
                   padding.PSS(...), hashes.SHA256())
        return True
    except InvalidSignature:
        return False
```

#### Endpoints

| Método | URL | Body | Respuesta |
|---|---|---|---|
| POST | `/api/firma-rsa/generar-claves` | — | `{clave_publica_pem, clave_privada_pem}` |
| POST | `/api/firma-rsa/firmar` | `{mensaje, clave_privada_pem}` | `{firma_b64}` |
| POST | `/api/firma-rsa/verificar` | `{mensaje, firma_b64, clave_publica_pem}` | `{valido: true/false}` |

---

#### Prueba para el Screenshot del Módulo B

> **Flujo a seguir:**
> 1. Presionar **"Generar par RSA-2048"** — las claves se autorellenan en todos los campos
> 2. En el panel **Firmar**, escribir en el campo Mensaje: `Hola, esta es mi firma digital`
> 3. Presionar **"Firmar mensaje"** — aparece la firma en Base64
> 4. En el panel **Verificar**, el mensaje y la firma se copian automáticamente
> 5. Presionar **"Verificar firma"** — debe aparecer el badge verde **"Firma válida"**
>
> **Prueba adicional de integridad:**
> - Modificar una letra del mensaje en el panel Verificar (ej. cambiar `Hola` por `hola`)
> - Presionar **"Verificar firma"** de nuevo → debe aparecer el badge rojo **"Firma inválida"**

**Screenshot — Módulo B (Firma válida):**

> 📷 _[Insertar aquí la captura con las claves generadas, el mensaje firmado y el badge verde "Firma válida"]_

**Screenshot — Módulo B (Firma inválida):**

> 📷 _[Insertar aquí la captura con el mensaje alterado y el badge rojo "Firma inválida"]_

---

---

### Módulo C — Cifrado Simétrico con Clave Privada (AES-256-GCM)

#### ¿Qué es?

El **cifrado simétrico** usa la misma clave para cifrar y descifrar. Es el método más eficiente para proteger grandes volúmenes de datos. La clave es el "secreto compartido" que ambas partes deben conocer.

**AES-256-GCM** es el estándar de oro para cifrado simétrico moderno porque implementa **AEAD** (Authenticated Encryption with Associated Data): proporciona **confidencialidad** e **integridad** en una sola operación primitiva.

#### ¿Por qué GCM y no otros modos?

| Modo | Confidencialidad | Integridad | Recomendado |
|---|---|---|---|
| ECB | Sí (inseguro) | No | No — patrones visibles |
| CBC | Sí | No (sin HMAC) | No — requiere padding oracle |
| CBC + HMAC | Sí | Sí | Aceptable pero complejo |
| **GCM** | **Sí** | **Sí (integrado)** | **Sí — AEAD en una sola primitiva** |

#### Componentes del Cifrado AES-256-GCM

| Componente | Tamaño | Descripción |
|---|---|---|
| **Clave** | 256 bits (32 bytes) | Secreto compartido. Se genera con `os.urandom(32)` |
| **IV / Nonce** | 96 bits (12 bytes) | Valor aleatorio único por cada cifrado. **Nunca reutilizar** |
| **Ciphertext** | Variable | Mensaje cifrado (mismo tamaño que el plaintext) |
| **Tag GCM** | 128 bits (16 bytes) | Autenticador. Si se altera el mensaje, el tag no coincide |

#### Flujo Criptográfico

```
── CIFRAR ──────────────────────────────────────────────
Mensaje (plaintext)
    +
Clave (256 bits) + IV aleatorio (96 bits)
    │
    ▼
┌──────────────────────────┐
│    AESGCM.encrypt(iv,    │  ← Counter mode (CTR) + GHASH
│    mensaje, aad=None)    │
└──────────────────────────┘
    │
    ├── Ciphertext (Base64)   → guarda/transmite
    ├── IV (hex)              → guarda/transmite (NO es secreto)
    └── Tag GCM (Base64)      → guarda/transmite

── DESCIFRAR ───────────────────────────────────────────
Ciphertext + IV + Tag + Clave
    │
    ▼
┌──────────────────────────────────────────┐
│    AESGCM.decrypt(iv, datos+tag, None)   │
└──────────────────────────────────────────┘
    │
    ├── Si Tag válido → Plaintext original
    └── Si Tag inválido → InvalidTag exception
                         "Autenticación fallida"
```

#### Seguridad del IV

El IV (Initialization Vector) **no es secreto** — puede transmitirse junto con el ciphertext. Su requisito crítico es la **unicidad**: nunca usar el mismo IV con la misma clave. La implementación genera siempre un IV aleatorio con `os.urandom(12)`.

#### Implementación del Service

```python
# backend/services/simetrico_service.py

def cifrar(mensaje: str, clave_hex: str) -> dict:
    clave = bytes.fromhex(clave_hex)          # 32 bytes = 256 bits
    iv = os.urandom(12)                        # Nonce aleatorio por cada cifrado
    aesgcm = AESGCM(clave)
    cifrado_con_tag = aesgcm.encrypt(iv, mensaje.encode("utf-8"), None)
    cifrado, tag = cifrado_con_tag[:-16], cifrado_con_tag[-16:]
    return {
        "iv_hex":      iv.hex(),
        "cifrado_b64": base64.b64encode(cifrado).decode(),
        "tag_b64":     base64.b64encode(tag).decode(),
    }

def descifrar(cifrado_b64, iv_hex, tag_b64, clave_hex) -> str:
    aesgcm = AESGCM(bytes.fromhex(clave_hex))
    datos = base64.b64decode(cifrado_b64) + base64.b64decode(tag_b64)
    return aesgcm.decrypt(bytes.fromhex(iv_hex), datos, None).decode()
    # ↑ Lanza InvalidTag automáticamente si el tag no coincide
```

#### Endpoints

| Método | URL | Body | Respuesta |
|---|---|---|---|
| POST | `/api/simetrico/generar-clave` | — | `{clave_hex}` |
| POST | `/api/simetrico/cifrar` | `{mensaje, clave_hex}` | `{iv_hex, cifrado_b64, tag_b64}` |
| POST | `/api/simetrico/descifrar` | `{cifrado_b64, iv_hex, tag_b64, clave_hex}` | `{mensaje}` |

---

#### Prueba para el Screenshot del Módulo C

> **Flujo a seguir:**
> 1. Presionar **"Generar"** (clave AES-256) — aparece una clave de 64 caracteres hex
> 2. En la sección **Cifrar**, escribir en Mensaje: `Este mensaje es secreto y confidencial`
> 3. Presionar **"Cifrar mensaje"** — aparecen el IV, el texto cifrado (Base64) y el Tag GCM
> 4. Los campos de la sección **Descifrar** se rellenan automáticamente
> 5. Presionar **"Descifrar mensaje"** — aparece el mensaje original recuperado
>
> **Prueba de integridad (tag alterado):**
> - En el campo **Tag GCM**, borrar los últimos 4 caracteres y escribir `XXXX`
> - Presionar **"Descifrar mensaje"** → debe aparecer la alerta roja: **"Autenticación fallida. El mensaje fue alterado o la clave es incorrecta."**

**Screenshot — Módulo C (Cifrado y descifrado exitoso):**

> 📷 _[Insertar aquí la captura mostrando el IV, ciphertext, tag y el mensaje recuperado correctamente]_

**Screenshot — Módulo C (Tag alterado — autenticación fallida):**

> 📷 _[Insertar aquí la captura con la alerta roja de autenticación fallida]_

---

---

### Módulo D — Cifrado Asimétrico con Llave Pública (RSA-OAEP)

#### ¿Qué es?

El **cifrado asimétrico** usa un par de claves matemáticamente relacionadas:
- **Clave pública**: cualquiera puede conocerla y usarla para **cifrar**.
- **Clave privada**: solo el propietario la conoce y la usa para **descifrar**.

Esto resuelve el problema fundamental del cifrado simétrico: **¿cómo compartir la clave de forma segura?**

#### Algoritmo: RSA-OAEP con SHA-256

**RSA-OAEP** (Optimal Asymmetric Encryption Padding) es el esquema de cifrado RSA moderno. El padding OAEP añade aleatorización al mensaje antes de cifrarlo, haciendo que:

- El mismo mensaje cifrado dos veces produce resultados **diferentes** (no determinístico).
- Resiste ataques de **padding oracle** (vulnerabilidad de RSA-PKCS#1 v1.5).

#### Limitación de Tamaño

RSA **no está diseñado** para cifrar datos de gran tamaño directamente. El límite depende del tamaño de la clave:

```
Máximo bytes = (key_size_bits / 8) - 2 × hash_size_bytes - 2
             = (2048 / 8) - 2 × 32 - 2
             = 256 - 64 - 2
             = 190 bytes
```

**En producción** se usa un esquema **híbrido RSA + AES**:
1. Se genera una clave AES aleatoria (32 bytes).
2. AES cifra el mensaje (sin límite de tamaño).
3. RSA cifra la clave AES (solo 32 bytes, dentro del límite).
4. Se transmiten: la clave AES cifrada con RSA + el mensaje cifrado con AES.

#### Flujo Criptográfico

```
── CIFRAR (con clave PÚBLICA) ──────────────────────────────
Mensaje (≤190 bytes)
    +
Clave Pública RSA-2048
    │
    ▼
RSA-OAEP.encrypt(mensaje, padding_OAEP_SHA256)
    │
    ▼
Ciphertext (Base64) → 344 caracteres aprox. siempre

── DESCIFRAR (con clave PRIVADA) ───────────────────────────
Ciphertext (Base64)
    +
Clave Privada RSA-2048
    │
    ▼
RSA-OAEP.decrypt(ciphertext, padding_OAEP_SHA256)
    │
    ▼
Mensaje original (plaintext)
```

#### Diferencia clave vs Módulo B

| Aspecto | Módulo B (Firma RSA) | Módulo D (Cifrado RSA) |
|---|---|---|
| Clave que opera | **Privada firma**, pública verifica | **Pública cifra**, privada descifra |
| Objetivo | Autenticidad + integridad | Confidencialidad |
| Padding | PSS | OAEP |

#### Implementación del Service

```python
# backend/services/asimetrico_service.py

MAX_BYTES_RSA = 190  # Límite para RSA-2048 con OAEP + SHA-256

def cifrar(mensaje: str, clave_publica_pem: str) -> str:
    mensaje_bytes = mensaje.encode("utf-8")
    if len(mensaje_bytes) > MAX_BYTES_RSA:
        raise ValueError(f"El mensaje excede el límite RSA-OAEP ({len(mensaje_bytes)} bytes)...")
    pub = serialization.load_pem_public_key(str_to_pem(clave_publica_pem))
    cifrado = pub.encrypt(
        mensaje_bytes,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()),
                     algorithm=hashes.SHA256(), label=None)
    )
    return base64.b64encode(cifrado).decode("utf-8")

def descifrar(cifrado_b64: str, clave_privada_pem: str) -> str:
    priv = serialization.load_pem_private_key(str_to_pem(clave_privada_pem), password=None)
    return priv.decrypt(base64.b64decode(cifrado_b64),
                        padding.OAEP(...)).decode("utf-8")
```

#### Endpoints

| Método | URL | Body | Respuesta |
|---|---|---|---|
| POST | `/api/asimetrico/generar-claves` | — | `{clave_publica_pem, clave_privada_pem}` |
| POST | `/api/asimetrico/cifrar` | `{mensaje, clave_publica_pem}` | `{cifrado_b64}` |
| POST | `/api/asimetrico/descifrar` | `{cifrado_b64, clave_privada_pem}` | `{mensaje}` |

---

#### Prueba para el Screenshot del Módulo D

> **Flujo a seguir:**
> 1. Presionar **"Generar par RSA-2048"** — aparecen las claves pública y privada
> 2. En la sección **Cifrar**, escribir en Mensaje: `Clave AES: a3f9b2c1d4e5f6a7`
> 3. Presionar **"Cifrar con clave pública"** — aparece el texto cifrado en Base64 (~344 chars)
> 4. El campo de texto cifrado se copia automáticamente al panel Descifrar
> 5. Presionar **"Descifrar con clave privada"** → aparece el mensaje original
>
> **Prueba del límite de tamaño:**
> - En el campo Mensaje, escribir un texto de más de 190 caracteres
> - Observar cómo aparece automáticamente la advertencia amarilla: **"RSA no está diseñado para cifrar grandes cantidades de información..."**
> - Al intentar cifrar → debe aparecer el error con el conteo de bytes

**Screenshot — Módulo D (Cifrado y descifrado exitoso):**

> 📷 _[Insertar aquí la captura mostrando las claves generadas, el mensaje cifrado en B64 y el mensaje descifrado]_

**Screenshot — Módulo D (Advertencia de límite de tamaño):**

> 📷 _[Insertar aquí la captura con la alerta amarilla del límite RSA]_

---

---

### Módulo E — Firmar y Verificar con Criptografía de Curvas Elípticas (ECDSA)

#### ¿Qué es?

La **Criptografía de Curvas Elípticas** (ECC) es una rama de la criptografía asimétrica basada en la matemática de curvas elípticas sobre cuerpos finitos. Ofrece el mismo nivel de seguridad que RSA pero con claves significativamente más pequeñas.

**ECDSA** (Elliptic Curve Digital Signature Algorithm) es el algoritmo de firma digital basado en ECC.

#### ¿Por qué ECC en lugar de RSA para firmas?

| Métrica | RSA | ECC P-256 | Ventaja ECC |
|---|---|---|---|
| Seguridad equivalente | 3072 bits | **256 bits** | Clave 12× más pequeña |
| Velocidad de firma | Referencia | ~10× más rápida | Mayor rendimiento |
| Tamaño de la firma | ~256 bytes | ~72 bytes | Menor overhead |
| Uso de memoria | Alto | Bajo | Ideal para IoT/móvil |
| Adopción | TLS, SSH | TLS 1.3, JWT, passkeys | Futuro del estándar |

#### Curva Utilizada: P-256 (SECP256R1)

La curva **NIST P-256** (también llamada `secp256r1` o `prime256v1`) es la curva elíptica estándar más utilizada en el mundo:
- Definida por NIST (National Institute of Standards and Technology).
- Usada en TLS 1.3, certificados HTTPS, passkeys, Apple/Google Code Signing.
- Su ecuación: `y² = x³ - 3x + b (mod p)` donde `p` es un primo de 256 bits.

#### La Matemática Detrás (simplificada)

La seguridad de ECC se basa en el **Problema del Logaritmo Discreto en Curvas Elípticas** (ECDLP):

```
Punto público Q = k × G

Donde:
  G = punto generador de la curva (conocido públicamente)
  k = clave privada (número entero secreto)
  Q = clave pública (punto en la curva)

Conocer G y Q, encontrar k es computacionalmente inviable.
```

#### Flujo Criptográfico ECDSA

```
── GENERAR CLAVES ──────────────────────────────────────────
k = entero aleatorio en [1, n-1]     ← clave privada
Q = k × G                            ← clave pública (punto en la curva)

── FIRMAR ──────────────────────────────────────────────────
Mensaje
    │
    ▼
hash = SHA-256(mensaje)
    │
    ▼
Seleccionar k aleatorio temporal
    │
    ▼
(r, s) = ECDSA_sign(hash, clave_privada, k_temporal)
    │
firma = DER_encode(r, s)
    │
Base64 → firma_b64

── VERIFICAR ────────────────────────────────────────────────
Mensaje + firma_b64 + clave_pública
    │
    ▼
(r, s) = DER_decode(Base64(firma))
    │
    ▼
ECDSA_verify(hash(mensaje), r, s, clave_pública)
    │
┌───┴────┐
True   False
```

> **Nota:** ECDSA es **no determinístico** por diseño — el mismo mensaje firmado dos veces produce firmas diferentes, porque usa un número aleatorio temporal `k` en cada firma. Sin embargo, ambas firmas verifican correctamente con la misma clave pública.

#### Implementación del Service

```python
# backend/services/ecc_service.py

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
        pub.verify(base64.b64decode(firma_b64), mensaje.encode("utf-8"),
                   ec.ECDSA(hashes.SHA256()))
        return True
    except InvalidSignature:
        return False
```

#### Endpoints

| Método | URL | Body | Respuesta |
|---|---|---|---|
| POST | `/api/ecc/generar-claves` | — | `{clave_publica_pem, clave_privada_pem}` |
| POST | `/api/ecc/firmar` | `{mensaje, clave_privada_pem}` | `{firma_b64}` |
| POST | `/api/ecc/verificar` | `{mensaje, firma_b64, clave_publica_pem}` | `{valido: true/false}` |

---

#### Prueba para el Screenshot del Módulo E

> **Flujo a seguir:**
> 1. Observar la sección **"Comparación de Tamaños de Clave"** en la parte superior:
>    - La barra de RSA-2048 ocupa el 100% del ancho
>    - La barra de ECC P-256 ocupa solo el ~12.5%
> 2. Presionar **"Generar par ECC P-256"** — aparecen las claves en formato PEM
>    - Notar que la clave privada ECC es **mucho más corta** que la RSA del Módulo B
> 3. En la sección **Firmar**, escribir: `Autenticando con curvas elípticas P-256`
> 4. Presionar **"Firmar con ECC"** — aparece la firma en Base64 (~88-96 chars)
> 5. En la sección **Verificar**, presionar **"Verificar firma ECC"** → badge verde **"Firma válida"**
>
> **Prueba de no repudio:**
> - Cambiar el mensaje en Verificar a `Autenticando con curvas elípticas P-257` (cambié el número)
> - Presionar **"Verificar firma ECC"** → badge rojo **"Firma inválida"**
>
> **Para apreciar la diferencia de tamaño:**
> - Ir al Módulo B, generar claves RSA y comparar visualmente la longitud del PEM vs las claves ECC generadas aquí

**Screenshot — Módulo E (Claves generadas + firma válida):**

> 📷 _[Insertar aquí la captura mostrando la comparación de barras RSA vs ECC, las claves PEM generadas y el badge verde de firma válida]_

**Screenshot — Módulo E (Firma inválida):**

> 📷 _[Insertar aquí la captura con el badge rojo de firma inválida]_

---

## 4. Ejecución y Tests

### Arrancar el servidor

```bash
# Desde la carpeta suite_encriptacion/
pip install -r requirements.txt
python run.py

# Abrir en el navegador:
# http://localhost:5000
```

### Ejecutar tests

```bash
python -m pytest tests/ -v
```

**Resultado esperado:** `42 passed`

```
tests/test_digest.py::test_sha256_valor_conocido      PASSED
tests/test_digest.py::test_sha256_mensaje_vacio       PASSED
tests/test_digest.py::test_algoritmo_invalido         PASSED
...
tests/test_ecc.py::test_verificar_clave_publica_diferente  PASSED

42 passed in 1.58s
```

---

## 5. Decisiones de Diseño

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| `cryptography` (PyCA) | `pycryptodome` | Librería auditada, APIs de alto nivel, menos error-prone |
| AES-GCM | AES-CBC + HMAC | GCM provee AEAD en una primitiva; menos código = menos errores |
| RSA-PSS | RSA-PKCS1v15 | PSS es el estándar moderno según NIST SP 800-131A |
| RSA-OAEP | RSA-PKCS1v15 | OAEP resiste ataques de padding oracle |
| P-256 (SECP256R1) | secp256k1 | Curva estándar NIST; secp256k1 es principalmente Bitcoin |
| Flask | FastAPI | Más sencillo para monolito didáctico sin necesidad de async |
| JS Vanilla | React/Vue | Evita build tools; el frontend es simple y pedagógico |
| Sin base de datos | SQLite | Las claves no deben persistirse en una herramienta educativa |
| IV aleatorio siempre | IV fijo | Reutilizar IV+clave en GCM rompe la confidencialidad |

---

*Documentación generada para CryptoLab — Suite educativa de criptografía. Python 3.11 · Flask 3.0.3 · cryptography 42.0.8*
