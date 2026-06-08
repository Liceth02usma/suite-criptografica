/* ============================================================
   CryptoLab — app.js
   Vanilla JS SPA: navegación, vistas, llamadas a la API Flask
   ============================================================ */

'use strict';

// ──────────────────────────────────────────────────────────────
// API helper
// ──────────────────────────────────────────────────────────────
async function callApi(endpoint, body = null) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== null) options.body = JSON.stringify(body);
  const res = await fetch(endpoint, options);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Error desconocido');
  return json.data;
}

// ──────────────────────────────────────────────────────────────
// Spinner
// ──────────────────────────────────────────────────────────────
const spinnerOverlay = document.getElementById('spinnerOverlay');
function showSpinner() { spinnerOverlay.classList.add('active'); }
function hideSpinner() { spinnerOverlay.classList.remove('active'); }

// ──────────────────────────────────────────────────────────────
// Toast
// ──────────────────────────────────────────────────────────────
const toastContainer = document.getElementById('toastContainer');
function showToast(message, type = 'info') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// ──────────────────────────────────────────────────────────────
// Copy to clipboard
// ──────────────────────────────────────────────────────────────
async function copyText(text, label = 'Texto') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`${label} copiado al portapapeles`, 'success');
  } catch {
    showToast('No se pudo copiar', 'error');
  }
}

// ──────────────────────────────────────────────────────────────
// Navigation / Routing
// ──────────────────────────────────────────────────────────────
const navItems = document.querySelectorAll('.nav-item[data-section]');
const sections = document.querySelectorAll('.view-section');

function navigateTo(sectionId) {
  sections.forEach(s => s.classList.add('hidden'));
  const target = document.getElementById(`view-${sectionId}`);
  if (target) target.classList.remove('hidden');

  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });

  const titles = {
    inicio:       ['Inicio', 'Laboratorio Interactivo de Criptografía'],
    digest:       ['Message Digest', 'Genera resúmenes digitales con SHA-256, SHA-3-256 y MD5'],
    'firma-rsa':  ['Firma Digital RSA', 'Firma y verifica mensajes con RSA-PSS y SHA-256'],
    simetrico:    ['Cifrado Simétrico AES-256-GCM', 'Cifra y descifra mensajes con clave compartida'],
    asimetrico:   ['Cifrado Asimétrico RSA-OAEP', 'Cifra con clave pública, descifra con clave privada'],
    ecc:          ['ECC — Curvas Elípticas', 'Firma y verifica con ECDSA en curva P-256'],
  };
  const [title, sub] = titles[sectionId] || ['CryptoLab', ''];
  document.getElementById('topbarTitle').textContent = title;
  document.getElementById('topbarSubtitle').textContent = sub;
}

navItems.forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.section));
});

// Dashboard card buttons
document.querySelectorAll('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.goto));
});

// ──────────────────────────────────────────────────────────────
// Sidebar mobile
// ──────────────────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const mobileToggle = document.getElementById('mobileToggle');

mobileToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
});
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
});

// ──────────────────────────────────────────────────────────────
// Char counter for textareas
// ──────────────────────────────────────────────────────────────
document.querySelectorAll('textarea[data-counter]').forEach(ta => {
  const counterId = ta.dataset.counter;
  const counter = document.getElementById(counterId);
  if (!counter) return;
  ta.addEventListener('input', () => { counter.textContent = `${ta.value.length} caracteres`; });
});

// ──────────────────────────────────────────────────────────────
// ══ VISTA A — Message Digest ══
// ──────────────────────────────────────────────────────────────
(function digestView() {
  const form = document.getElementById('digestForm');
  const algoSelect = document.getElementById('digestAlgo');
  const msgInput = document.getElementById('digestMsg');
  const resultPanel = document.getElementById('digestResult');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const mensaje = msgInput.value;
    const algoritmo = algoSelect.value;
    showSpinner();
    const t0 = performance.now();
    try {
      const data = await callApi('/api/digest', { mensaje, algoritmo });
      const ms = (performance.now() - t0).toFixed(2);
      renderDigestResult(data, ms, mensaje);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });

  function renderDigestResult(data, ms, originalMsg) {
    document.getElementById('digestHashHex').textContent = data.hash_hex;
    document.getElementById('digestHashB64').textContent = data.hash_b64;
    document.getElementById('digestBits').textContent = `${data.bits} bits`;
    document.getElementById('digestTime').textContent = `${ms} ms`;
    resultPanel.classList.remove('hidden');
    resultPanel.classList.add('fade-in');
    // Avalanche
    computeAvalanche(originalMsg, algoSelect.value);
  }

  document.getElementById('copyHexBtn').addEventListener('click', () => {
    copyText(document.getElementById('digestHashHex').textContent, 'Hash hex');
  });
  document.getElementById('copyB64Btn').addEventListener('click', () => {
    copyText(document.getElementById('digestHashB64').textContent, 'Hash Base64');
  });

  async function computeAvalanche(originalMsg, algoritmo) {
    const modMsg = originalMsg.length > 0
      ? originalMsg.slice(0, -1) + String.fromCharCode(originalMsg.charCodeAt(originalMsg.length - 1) + 1)
      : 'X';
    const avalanchePanel = document.getElementById('avalanchePanel');
    try {
      const [orig, mod] = await Promise.all([
        callApi('/api/digest', { mensaje: originalMsg || '', algoritmo }),
        callApi('/api/digest', { mensaje: modMsg, algoritmo }),
      ]);
      renderAvalanche(orig.hash_hex, mod.hash_hex, originalMsg, modMsg);
      avalanchePanel.classList.remove('hidden');
      avalanchePanel.classList.add('fade-in');
    } catch { /* silencioso */ }
  }

  function renderAvalanche(hexA, hexB, msgA, msgB) {
    document.getElementById('avalancheMsg1').textContent = `"${msgA}"`;
    document.getElementById('avalancheMsg2').textContent = `"${msgB}"`;

    const bitsA = hexToBits(hexA);
    const bitsB = hexToBits(hexB);
    let diffCount = 0;
    let htmlA = '', htmlB = '';
    for (let i = 0; i < bitsA.length; i++) {
      const diff = bitsA[i] !== bitsB[i];
      if (diff) diffCount++;
      const cls = diff ? 'bit-diff' : 'bit-same';
      htmlA += `<span class="${cls}">${bitsA[i]}</span>`;
      htmlB += `<span class="${cls}">${bitsB[i]}</span>`;
    }
    const pct = ((diffCount / bitsA.length) * 100).toFixed(1);
    document.getElementById('avalancheHash1').innerHTML = htmlA;
    document.getElementById('avalancheHash2').innerHTML = htmlB;
    document.getElementById('avalanchePercent').textContent = `${pct}%`;
    document.getElementById('avalancheDiffBits').textContent = `${diffCount} / ${bitsA.length} bits diferentes`;
  }

  function hexToBits(hex) {
    return hex.split('').map(c => parseInt(c, 16).toString(2).padStart(4, '0')).join('');
  }
})();

// ──────────────────────────────────────────────────────────────
// ══ VISTA B — Firma Digital RSA ══
// ──────────────────────────────────────────────────────────────
(function firmaRsaView() {
  // Generar claves
  document.getElementById('rsaGenerarClaves').addEventListener('click', async () => {
    showSpinner();
    try {
      const data = await callApi('/api/firma-rsa/generar-claves');
      document.getElementById('rsaPrivKey').value = data.clave_privada_pem;
      document.getElementById('rsaPubKey').value = data.clave_publica_pem;
      document.getElementById('rsaPubKeyVerify').value = data.clave_publica_pem;
      document.getElementById('rsaKeysPanel').classList.remove('hidden');
      showToast('Par de claves RSA-2048 generado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });

  // Copiar claves
  document.getElementById('copyRsaPriv').addEventListener('click', () =>
    copyText(document.getElementById('rsaPrivKey').value, 'Clave privada PEM'));
  document.getElementById('copyRsaPub').addEventListener('click', () =>
    copyText(document.getElementById('rsaPubKey').value, 'Clave pública PEM'));

  // Firmar
  document.getElementById('rsaFirmarForm').addEventListener('submit', async e => {
    e.preventDefault();
    const mensaje = document.getElementById('rsaMsgFirmar').value;
    const clave_privada_pem = document.getElementById('rsaPrivKey').value;
    if (!clave_privada_pem.trim()) { showToast('Genera o ingresa una clave privada', 'error'); return; }
    showSpinner();
    try {
      const data = await callApi('/api/firma-rsa/firmar', { mensaje, clave_privada_pem });
      document.getElementById('rsaFirmaResult').textContent = data.firma_b64;
      document.getElementById('rsaFirmaPanel').classList.remove('hidden');
      document.getElementById('rsaFirmaPanel').classList.add('fade-in');
      document.getElementById('rsaFirmaMsgVerify').value = mensaje;
      document.getElementById('rsaFirmaB64Verify').value = data.firma_b64;
      showToast('Firma digital creada', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });

  document.getElementById('copyRsaFirma').addEventListener('click', () =>
    copyText(document.getElementById('rsaFirmaResult').textContent, 'Firma'));

  // Verificar
  document.getElementById('rsaVerificarForm').addEventListener('submit', async e => {
    e.preventDefault();
    const mensaje = document.getElementById('rsaFirmaMsgVerify').value;
    const firma_b64 = document.getElementById('rsaFirmaB64Verify').value;
    const clave_publica_pem = document.getElementById('rsaPubKeyVerify').value;
    showSpinner();
    try {
      const data = await callApi('/api/firma-rsa/verificar', { mensaje, firma_b64, clave_publica_pem });
      renderVerifyResult('rsaVerifyResult', data.valido, 'RSA-PSS');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });
})();

// ──────────────────────────────────────────────────────────────
// ══ VISTA C — AES-256-GCM ══
// ──────────────────────────────────────────────────────────────
(function simetricoView() {
  document.getElementById('aesGenerarClave').addEventListener('click', async () => {
    showSpinner();
    try {
      const data = await callApi('/api/simetrico/generar-clave');
      document.getElementById('aesClave').value = data.clave_hex;
      document.getElementById('aesClaveDesc').value = data.clave_hex;
      showToast('Clave AES-256 generada', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });

  document.getElementById('copyClave').addEventListener('click', () =>
    copyText(document.getElementById('aesClave').value, 'Clave AES'));

  // Cifrar
  document.getElementById('aesCifrarForm').addEventListener('submit', async e => {
    e.preventDefault();
    const mensaje = document.getElementById('aesMsgCifrar').value;
    const clave_hex = document.getElementById('aesClave').value;
    showSpinner();
    try {
      const data = await callApi('/api/simetrico/cifrar', { mensaje, clave_hex });
      document.getElementById('aesIvResult').textContent = data.iv_hex;
      document.getElementById('aesCifradoResult').textContent = data.cifrado_b64;
      document.getElementById('aesTagResult').textContent = data.tag_b64;
      document.getElementById('aesCifrarPanel').classList.remove('hidden');
      document.getElementById('aesCifrarPanel').classList.add('fade-in');
      // Auto-rellenar descifrado
      document.getElementById('aesCifradoDesc').value = data.cifrado_b64;
      document.getElementById('aesIvDesc').value = data.iv_hex;
      document.getElementById('aesTagDesc').value = data.tag_b64;
      showToast('Mensaje cifrado correctamente', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });

  document.getElementById('copyIv').addEventListener('click', () =>
    copyText(document.getElementById('aesIvResult').textContent, 'IV'));
  document.getElementById('copyCifrado').addEventListener('click', () =>
    copyText(document.getElementById('aesCifradoResult').textContent, 'Texto cifrado'));
  document.getElementById('copyTag').addEventListener('click', () =>
    copyText(document.getElementById('aesTagResult').textContent, 'Tag GCM'));

  // Descifrar
  document.getElementById('aesDescifrarForm').addEventListener('submit', async e => {
    e.preventDefault();
    const cifrado_b64 = document.getElementById('aesCifradoDesc').value;
    const iv_hex = document.getElementById('aesIvDesc').value;
    const tag_b64 = document.getElementById('aesTagDesc').value;
    const clave_hex = document.getElementById('aesClaveDesc').value;
    showSpinner();
    try {
      const data = await callApi('/api/simetrico/descifrar', { cifrado_b64, iv_hex, tag_b64, clave_hex });
      const panel = document.getElementById('aesDescifrarPanel');
      document.getElementById('aesDescifrarAlert').className = 'alert alert-success fade-in';
      document.getElementById('aesDescifrarAlert').innerHTML =
        `<i class="fa-solid fa-circle-check"></i><div><strong>Descifrado exitoso</strong><br><span style="font-family:monospace">${escapeHtml(data.mensaje)}</span></div>`;
      panel.classList.remove('hidden');
      panel.classList.add('fade-in');
    } catch (err) {
      const panel = document.getElementById('aesDescifrarPanel');
      const isAuthFail = err.message.includes('Autenticación fallida') || err.message.includes('alterado');
      document.getElementById('aesDescifrarAlert').className = 'alert alert-error fade-in';
      document.getElementById('aesDescifrarAlert').innerHTML =
        `<i class="fa-solid fa-triangle-exclamation"></i><div><strong>${isAuthFail ? 'Autenticación fallida' : 'Error al descifrar'}</strong><br>${escapeHtml(err.message)}</div>`;
      panel.classList.remove('hidden');
      panel.classList.add('fade-in');
      showToast(isAuthFail ? 'Autenticación fallida' : err.message, 'error');
    } finally {
      hideSpinner();
    }
  });
})();

// ──────────────────────────────────────────────────────────────
// ══ VISTA D — RSA-OAEP ══
// ──────────────────────────────────────────────────────────────
(function asimetricoView() {
  document.getElementById('oaepGenerarClaves').addEventListener('click', async () => {
    showSpinner();
    try {
      const data = await callApi('/api/asimetrico/generar-claves');
      document.getElementById('oaepPubKey').value = data.clave_publica_pem;
      document.getElementById('oaepPrivKey').value = data.clave_privada_pem;
      document.getElementById('oaepKeysPanel').classList.remove('hidden');
      showToast('Par de claves RSA-2048 generado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });

  document.getElementById('copyOaepPub').addEventListener('click', () =>
    copyText(document.getElementById('oaepPubKey').value, 'Clave pública'));
  document.getElementById('copyOaepPriv').addEventListener('click', () =>
    copyText(document.getElementById('oaepPrivKey').value, 'Clave privada'));

  // Advertencia dinámica de tamaño
  document.getElementById('oaepMsg').addEventListener('input', function () {
    const bytes = new TextEncoder().encode(this.value).length;
    const warn = document.getElementById('oaepSizeWarning');
    if (bytes > 190) {
      warn.classList.remove('hidden');
      document.getElementById('oaepByteCount').textContent = bytes;
    } else {
      warn.classList.add('hidden');
    }
  });

  // Cifrar
  document.getElementById('oaepCifrarForm').addEventListener('submit', async e => {
    e.preventDefault();
    const mensaje = document.getElementById('oaepMsg').value;
    const clave_publica_pem = document.getElementById('oaepPubKey').value;
    showSpinner();
    try {
      const data = await callApi('/api/asimetrico/cifrar', { mensaje, clave_publica_pem });
      document.getElementById('oaepCifradoResult').textContent = data.cifrado_b64;
      document.getElementById('oaepCifrarPanel').classList.remove('hidden');
      document.getElementById('oaepCifrarPanel').classList.add('fade-in');
      document.getElementById('oaepCifradoDesc').value = data.cifrado_b64;
      showToast('Mensaje cifrado con RSA-OAEP', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });

  document.getElementById('copyOaepCifrado').addEventListener('click', () =>
    copyText(document.getElementById('oaepCifradoResult').textContent, 'Texto cifrado'));

  // Descifrar
  document.getElementById('oaepDescifrarForm').addEventListener('submit', async e => {
    e.preventDefault();
    const cifrado_b64 = document.getElementById('oaepCifradoDesc').value;
    const clave_privada_pem = document.getElementById('oaepPrivKey').value;
    showSpinner();
    try {
      const data = await callApi('/api/asimetrico/descifrar', { cifrado_b64, clave_privada_pem });
      document.getElementById('oaepDescResult').textContent = data.mensaje;
      document.getElementById('oaepDescPanel').classList.remove('hidden');
      document.getElementById('oaepDescPanel').classList.add('fade-in');
      showToast('Mensaje descifrado correctamente', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });
})();

// ──────────────────────────────────────────────────────────────
// ══ VISTA E — ECC ECDSA ══
// ──────────────────────────────────────────────────────────────
(function eccView() {
  document.getElementById('eccGenerarClaves').addEventListener('click', async () => {
    showSpinner();
    try {
      const data = await callApi('/api/ecc/generar-claves');
      document.getElementById('eccPrivKey').value = data.clave_privada_pem;
      document.getElementById('eccPubKey').value = data.clave_publica_pem;
      document.getElementById('eccPubKeyVerify').value = data.clave_publica_pem;
      document.getElementById('eccKeysPanel').classList.remove('hidden');

      // Calcular tamaños reales de clave
      const privLines = data.clave_privada_pem.trim().split('\n');
      const privB64Len = privLines.slice(1, -1).join('').length;
      const privBytes = Math.floor(privB64Len * 3 / 4);
      document.getElementById('eccPrivSize').textContent = `~${privBytes * 8} bits`;

      showToast('Par de claves ECC P-256 generado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });

  document.getElementById('copyEccPriv').addEventListener('click', () =>
    copyText(document.getElementById('eccPrivKey').value, 'Clave privada ECC'));
  document.getElementById('copyEccPub').addEventListener('click', () =>
    copyText(document.getElementById('eccPubKey').value, 'Clave pública ECC'));

  // Firmar
  document.getElementById('eccFirmarForm').addEventListener('submit', async e => {
    e.preventDefault();
    const mensaje = document.getElementById('eccMsgFirmar').value;
    const clave_privada_pem = document.getElementById('eccPrivKey').value;
    if (!clave_privada_pem.trim()) { showToast('Genera o ingresa una clave privada ECC', 'error'); return; }
    showSpinner();
    try {
      const data = await callApi('/api/ecc/firmar', { mensaje, clave_privada_pem });
      document.getElementById('eccFirmaResult').textContent = data.firma_b64;
      document.getElementById('eccFirmaPanel').classList.remove('hidden');
      document.getElementById('eccFirmaPanel').classList.add('fade-in');
      document.getElementById('eccMsgVerify').value = mensaje;
      document.getElementById('eccFirmaVerify').value = data.firma_b64;
      showToast('Firma ECC creada', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });

  document.getElementById('copyEccFirma').addEventListener('click', () =>
    copyText(document.getElementById('eccFirmaResult').textContent, 'Firma ECC'));

  // Verificar
  document.getElementById('eccVerificarForm').addEventListener('submit', async e => {
    e.preventDefault();
    const mensaje = document.getElementById('eccMsgVerify').value;
    const firma_b64 = document.getElementById('eccFirmaVerify').value;
    const clave_publica_pem = document.getElementById('eccPubKeyVerify').value;
    showSpinner();
    try {
      const data = await callApi('/api/ecc/verificar', { mensaje, firma_b64, clave_publica_pem });
      renderVerifyResult('eccVerifyResult', data.valido, 'ECDSA P-256');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });
})();

// ──────────────────────────────────────────────────────────────
// Shared: render verification result badge
// ──────────────────────────────────────────────────────────────
function renderVerifyResult(containerId, valido, algorithm) {
  const container = document.getElementById(containerId);
  if (valido) {
    container.innerHTML = `
      <div class="verify-result verify-result-valid fade-in">
        <div class="verify-icon"><i class="fa-solid fa-check"></i></div>
        <div>
          <div class="verify-title">Firma válida</div>
          <div class="verify-subtitle">La firma fue verificada correctamente con ${algorithm}.</div>
        </div>
      </div>`;
    showToast('Firma verificada correctamente', 'success');
  } else {
    container.innerHTML = `
      <div class="verify-result verify-result-invalid fade-in">
        <div class="verify-icon"><i class="fa-solid fa-xmark"></i></div>
        <div>
          <div class="verify-title">Firma inválida</div>
          <div class="verify-subtitle">La firma no corresponde al mensaje o la clave pública.</div>
        </div>
      </div>`;
    showToast('La firma no es válida', 'error');
  }
  container.classList.remove('hidden');
}

// ──────────────────────────────────────────────────────────────
// Escape HTML helper
// ──────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ──────────────────────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────────────────────
navigateTo('inicio');
