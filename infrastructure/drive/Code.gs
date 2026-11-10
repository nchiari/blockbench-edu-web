/* Blockbench Edu: private Drive inbox. Paste the configured copy into Apps Script. */
const EDU_ROOT_FOLDER = 'REPLACE_WITH_DRIVE_FOLDER_ID';
const EDU_CLASS_NAME = 'Primera clase';
const EDU_MAX_BYTES = 10 * 1024 * 1024;
const EDU_MAX_FILES = 200;
const EDU_MAX_CLASS_BYTES = 500 * 1024 * 1024;
const EDU_CLASS_DAYS = 7;
const EDU_TIME_ZONE = 'Europe/Madrid';
const EDU_EDITOR_ORIGINS = [
  'https://blockbench-edu.pages.dev',
  'https://nchiari.github.io',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
];

// Visible editor commands check the caller before reaching private teacher operations.
function prepararBuzon() {
  exigirDocente_();
  prepararBuzon_();
}

function mostrarBuzon() {
  exigirDocente_();
  mostrarBuzon_();
}

function cerrarBuzon() {
  exigirDocente_();
  cerrarBuzon_();
}

function exigirDocente_() {
  const active = Session.getActiveUser().getEmail();
  const effective = Session.getEffectiveUser().getEmail();
  if (!active || !effective || active !== effective) {
    throw new Error('Esta acción es solo para el docente desde el editor de Apps Script.');
  }
}

// Helpers remain private to google.script.run; editor commands above are owner-checked.
function prepararBuzon_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getScriptProperties();
    if (!props.getProperty('EDU_CLASS')) {
      const root = DriveApp.getFolderById(EDU_ROOT_FOLDER);
      const folder = root.createFolder(EDU_CLASS_NAME + ' — ' + new Date().toISOString().slice(0, 10));
      props.setProperty('EDU_CLASS', JSON.stringify({
        name: EDU_CLASS_NAME, folderId: folder.getId(),
        code: Utilities.getUuid().replace(/-/g, ''), open: true,
        expiresAt: Date.now() + EDU_CLASS_DAYS * 86400000
      }));
    }
    mostrarBuzon_();
  } finally { lock.releaseLock(); }
}

function mostrarBuzon_() {
  const config = leerClase_();
  const url = ScriptApp.getService().getUrl();
  console.log('Clase: ' + config.name);
  console.log('Estado: ' + (config.open && Date.now() < config.expiresAt ? 'Abierta' : 'Cerrada'));
  console.log('Código de entrega: ' + config.code);
  console.log('Vence: ' + new Date(config.expiresAt).toISOString());
  console.log('Carpeta privada: https://drive.google.com/drive/folders/' + config.folderId);
  console.log(url ? 'Enlace de entrega: ' + url + '?clase=' + config.code : 'Publicá la aplicación web y ejecutá mostrarBuzon para obtener el enlace.');
}

function cerrarBuzon_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const config = leerClase_();
    config.open = false;
    PropertiesService.getScriptProperties().setProperty('EDU_CLASS', JSON.stringify(config));
    console.log('Buzón cerrado. Los archivos siguen guardados en Drive.');
  } finally { lock.releaseLock(); }
}

function leerClase_() {
  const stored = PropertiesService.getScriptProperties().getProperty('EDU_CLASS');
  if (!stored) throw new Error('El docente todavía no preparó el buzón.');
  return JSON.parse(stored);
}

function comprobarClase_(code) {
  const config = leerClase_();
  if (typeof code !== 'string' || code !== config.code) throw new Error('El código de clase no es válido. Pedile el enlace a tu profe.');
  if (!config.open || Date.now() >= config.expiresAt) throw new Error('Esta entrega está cerrada. Avisale a tu profe.');
  return config;
}

function texto_(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.length > 80) throw new Error('Revisá ' + label + '.');
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!clean) throw new Error('Revisá ' + label + '.');
  return clean;
}

function nombreArchivo_(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 48) || 'criatura';
}

function nombreEntrega_(student, receivedAt, usedNames) {
  const date = Utilities.formatDate(new Date(receivedAt), EDU_TIME_ZONE, 'dd-MM-yy');
  const stem = nombreArchivo_(student) + '_' + date;
  let name = stem + '.mcaddon', number = 2;
  while (usedNames.has(name) || usedNames.has(name.replace(/\.mcaddon$/, '.bbmodel'))) name = stem + '_' + number++ + '.mcaddon';
  return name;
}

function validarEntrega_(data, model) {
  if (!data || typeof data !== 'object') throw new Error('No llegó el archivo. Volvé a intentar.');
  const config = comprobarClase_(data.classCode);
  const alias = texto_(data.alias, 'tu nombre o número de alumno');
  const creature = texto_(data.creature, 'el nombre de la criatura');
  if (typeof data.submissionId !== 'string' || !/^[a-f0-9]{32}$/.test(data.submissionId)) throw new Error('La entrega no tiene un identificador válido.');
  if (typeof data.fileName !== 'string' || !/\.mcaddon$/i.test(data.fileName)) throw new Error('Elegí un archivo .mcaddon.');
  const base64 = model ? data.modelBase64 : data.base64;
  if (typeof base64 !== 'string' || !base64.length || base64.length > 4 * Math.ceil(EDU_MAX_BYTES / 3) ||
      base64.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) throw new Error('El archivo no es válido o supera los 10 MB.');
  const bytes = Utilities.base64Decode(base64);
  if (bytes.length > EDU_MAX_BYTES) throw new Error('El archivo supera los 10 MB.');
  if (model) {
    let project;
    try { project = JSON.parse(Utilities.newBlob(bytes).getDataAsString('UTF-8')); }
    catch (_) { throw new Error('El proyecto .bbmodel no es válido.'); }
    if (!project || project.meta?.model_format !== 'bedrock' || !Array.isArray(project.elements) || !Array.isArray(project.textures) ||
        !project.textures.length || project.textures.some(texture => typeof texture.source !== 'string' || !texture.source.startsWith('data:image/png;base64,'))) {
      throw new Error('El .bbmodel debe incluir el modelo Bedrock y sus texturas.');
    }
  } else if (bytes.length < 22 || bytes.length > EDU_MAX_BYTES ||
      bytes[0] !== 80 || bytes[1] !== 75 || bytes[2] !== 3 || bytes[3] !== 4) throw new Error('El archivo no parece un .mcaddon válido o supera los 10 MB.');
  return {config: config, alias: alias, creature: creature, bytes: bytes, digest: huella_(bytes),
    submissionId: data.submissionId};
}

function huella_(bytes) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)
    .map(function (b) { return (b & 255).toString(16).padStart(2, '0'); }).join('');
}

// Student operation writes an upload; it never lists or returns Drive files to the caller.
function entregarAddon(data) {
  const item = validarEntrega_(data);
  // Validate both files before writing either one. Old clients may still send only an addon.
  const model = data.modelBase64 === undefined ? null : validarEntrega_(data, true);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error('Hay otras entregas llegando. Esperá unos segundos y reintentá.');
  try {
    const addon = guardarArchivo_(item, data, 'mcaddon');
    if (!model) return addon;
    const editable = guardarArchivo_(model, data, 'bbmodel', addon.fileName.replace(/\.mcaddon$/, '.bbmodel'));
    return Object.assign({}, addon, {modelFileName: editable.fileName, modelDuplicate: editable.duplicate});
  } finally { lock.releaseLock(); }
}

function guardarArchivo_(item, data, extension, targetName) {
    // Recheck closure/expiry after acquiring the lock.
    const config = comprobarClase_(data.classCode);
    const folder = DriveApp.getFolderById(config.folderId);
    const legacySuffix = '__' + item.submissionId + '.' + extension;
    const legacyName = nombreArchivo_(item.alias) + '__' + nombreArchivo_(item.creature) + legacySuffix;
    const pendingName = '__edu_pending_' + item.submissionId + '.' + extension;
    const usedNames = new Set();
    const files = folder.getFiles();
    let count = 0, total = 0, previous = null;
    while (files.hasNext()) {
      const file = files.next();
      count++; total += file.getSize();
      let receipt;
      try { receipt = JSON.parse(file.getDescription()) || {}; } catch (_) { receipt = {}; }
      usedNames.add(file.getName());
      // Reserve final names even if a previous rename was interrupted.
      if (receipt.fileName) usedNames.add(receipt.fileName);
      if ((receipt.receipt === item.submissionId && (receipt.kind || 'mcaddon') === extension) || file.getName() === pendingName || file.getName().endsWith(legacySuffix)) {
        previous = {file: file, receipt: receipt};
      }
    }
    if (previous) {
      const file = previous.file;
      let receipt = previous.receipt;
      // The temporary name identifies a save interrupted before its description was written.
      if (!receipt.digest && [pendingName, legacyName].includes(file.getName()) && huella_(file.getBlob().getBytes()) === item.digest) {
        receipt = {alias: item.alias, creature: item.creature, digest: item.digest,
          receivedAt: file.getDateCreated().toISOString(), receipt: item.submissionId, kind: extension};
      }
      if (receipt.digest !== item.digest || receipt.alias !== item.alias || receipt.creature !== item.creature) {
        throw new Error('El trabajo cambió. Iniciá una entrega nueva.');
      }
      // Preserve pre-update filenames; new uploads always get the short display name.
      if (!receipt.fileName) receipt.fileName = targetName || (file.getName().endsWith(legacySuffix) ? file.getName()
        : nombreEntrega_(item.alias, receipt.receivedAt, usedNames));
      file.setDescription(JSON.stringify(receipt));
      if (file.getName() === pendingName) file.setName(receipt.fileName);
      return {ok: true, receipt: item.submissionId, receivedAt: receipt.receivedAt, fileName: file.getName(), duplicate: true};
    }
    if (count >= EDU_MAX_FILES || total + item.bytes.length > EDU_MAX_CLASS_BYTES) throw new Error('El buzón está lleno. Avisale a tu profe.');
    const receivedAt = new Date().toISOString();
    const name = targetName || nombreEntrega_(item.alias, receivedAt, usedNames);
    if (targetName && usedNames.has(targetName)) throw new Error('Ya existe otro proyecto con ese nombre. Avisale a tu docente.');
    const blob = Utilities.newBlob(item.bytes, 'application/octet-stream', pendingName);
    const file = folder.createFile(blob);
    // No sharing permissions are granted: uploads inherit the private class folder.
    file.setDescription(JSON.stringify({alias: item.alias, creature: item.creature,
      digest: item.digest, receivedAt: receivedAt, receipt: item.submissionId, fileName: name, kind: extension}));
    file.setName(name);
    return {ok: true, receipt: item.submissionId, receivedAt: receivedAt, fileName: name, duplicate: false};
}

function doGet(e) {
  if (e && e.parameter && e.parameter.modo === 'editor') {
    const origin = e.parameter.origen || '';
    const channel = e.parameter.canal || '';
    if (!EDU_EDITOR_ORIGINS.includes(origin) ||
        !/^[a-f0-9]{32}$/.test(channel)) throw new Error('Conexión de editor no válida.');
    return HtmlService.createHtmlOutput(puenteEditor_(origin, channel))
      .setTitle('Conexión de entrega de Blockbench Edu')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  const code = e && e.parameter && e.parameter.clase || '';
  const initialCode = JSON.stringify(code).replace(/</g, '\\u003c');
  return HtmlService.createHtmlOutput(paginaEntrega_().replace('INITIAL_CLASS_CODE', initialCode))
    .setTitle('Entregar mi criatura — Blockbench Edu')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// This invisible transport accepts uploads only from the configured top-level editor.
// It cannot execute teacher commands. Both directions use exact origins and a random channel.
function puenteEditor_(origin, channel) {
  return '<!doctype html><html><head><meta charset="utf-8"></head><body><script>' +
    '(' + clientePuente_.toString() + ')(' + JSON.stringify(origin) + ',' + JSON.stringify(channel) + ');' +
    '</script></body></html>';
}

function clientePuente_(origin, channel) {
  let busy = false;
  const reply = function (type, body) {
    window.top.postMessage(Object.assign({type: type, channel: channel}, body), origin);
  };
  window.addEventListener('message', function (event) {
    const data = event.data;
    if (event.source !== window.top || event.origin !== origin || !data || data.channel !== channel ||
        data.type !== 'edu-drive-upload' || busy) return;
    busy = true;
    const payload = data.payload;
    if (!payload || typeof payload.submissionId !== 'string') { busy = false; return; }
    google.script.run.withSuccessHandler(function (result) {
      busy = false; reply('edu-drive-result', {submissionId: payload.submissionId, result: result});
    }).withFailureHandler(function (error) {
      busy = false; reply('edu-drive-result', {submissionId: payload.submissionId,
        error: error.message || 'No pudimos guardar la entrega. Volvé a intentar.'});
    }).entregarAddon(payload);
  });
  reply('edu-drive-ready', {});
}

function paginaEntrega_() {
  return `<!doctype html><html lang="es"><head><base target="_top"><style>
  *{box-sizing:border-box}body{margin:0;background:#eef3ec;color:#19351e;font:18px system-ui,sans-serif;padding:32px 16px}
  main{max-width:560px;margin:auto;background:white;border-radius:20px;padding:32px;box-shadow:0 8px 36px #19351e14}
  h1{font-size:30px;margin-top:0}label{display:block;margin-top:20px;font-weight:600}input{display:block;width:100%;padding:12px;margin-top:8px;font:inherit;border:2px solid #a5b7a5;border-radius:8px}
  button{margin-top:28px;width:100%;padding:16px;background:#23743b;color:white;border:0;border-radius:10px;font:700 20px system-ui;cursor:pointer}
  button:disabled{opacity:.6;cursor:wait}p{line-height:1.5}#status{white-space:pre-line}small{display:block;line-height:1.5;color:#4d6251;margin-top:18px}
  </style></head><body><main><h1>Entregar mi criatura</h1><p>Tu trabajo llegará al buzón de tu profe.</p>
  <form id="delivery"><label id="codeLabel">Código de clase<input id="code" required autocomplete="off" maxlength="32"></label>
  <label>Tu alias o número de alumno<input id="alias" required maxlength="80" autocomplete="off" placeholder="Por ejemplo: Alumno 07"></label>
  <label>Nombre de tu criatura<input id="creature" required maxlength="80" placeholder="Por ejemplo: Dragón azul"></label>
  <label>Tu archivo .mcaddon<input id="file" type="file" required accept=".mcaddon"></label>
  <button id="send">Entregar al profe</button></form><p id="status" role="status" aria-live="polite"></p>
  <small>No hace falta iniciar sesión. Usá un alias o número: no pongas tu correo ni tu nombre completo. Máximo: 10 MB.</small></main>
  <script>
  const classCode = INITIAL_CLASS_CODE;
  const form = document.getElementById('delivery'), status = document.getElementById('status'), send = document.getElementById('send');
  document.getElementById('code').value = classCode;
  if (classCode) document.getElementById('codeLabel').hidden = true;
  let pending = null, sending = false;
  form.addEventListener('input', function () { if (!sending) pending = null; });
  form.addEventListener('change', function () { if (!sending) pending = null; });
  form.addEventListener('submit', async function (event) {
    event.preventDefault(); if (sending) return;
    const file = document.getElementById('file').files[0];
    if (!file || !/\\.mcaddon$/i.test(file.name) || file.size > 10485760) { status.textContent = 'Elegí un .mcaddon de hasta 10 MB.'; return; }
    sending = true; Array.from(form.elements).forEach(function (el) { el.disabled = true; }); status.textContent = 'Enviando tu criatura… Esperá la confirmación.';
    try {
      if (!pending) {
        const buffer = new Uint8Array(16); crypto.getRandomValues(buffer);
        const id = Array.from(buffer, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        const base64 = await new Promise(function (resolve, reject) {
          const reader = new FileReader(); reader.onload = function () { resolve(reader.result.split(',')[1]); };
          reader.onerror = function () { reject(new Error('No pudimos leer el archivo. Volvé a elegirlo.')); }; reader.readAsDataURL(file);
        });
        pending = {classCode: document.getElementById('code').value.trim(), alias: document.getElementById('alias').value.trim(),
          creature: document.getElementById('creature').value.trim(), fileName: file.name, base64: base64, submissionId: id};
      }
      await new Promise(function (resolve, reject) { google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).entregarAddon(pending); });
      status.textContent = '¡Tu criatura fue entregada! Ya podés avisarle a tu profe.';
      send.textContent = 'Entregada';
    } catch (error) {
      sending = false; Array.from(form.elements).forEach(function (el) { el.disabled = false; });
      status.textContent = (error.message || 'No pudimos confirmar la entrega.') + '\\nTu archivo sigue en tu equipo. Podés reintentar.';
      send.textContent = 'Reintentar entrega';
    }
  });
  </script></body></html>`;
}
