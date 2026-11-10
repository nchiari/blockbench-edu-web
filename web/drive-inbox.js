/* Drive transport for the classroom web host. No student or teacher Google token is stored here. */
(() => {
    'use strict';
    const endpoint = 'https://script.google.com/macros/s/AKfycby2uMjc0AUKINCeNkUJA4443yYim7cVkozhXQkNHgZUQPLlTMdvjFl-cV0a1L07LEIn/exec';
    const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    const googleOrigin = origin => /^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/.test(origin);
    let classCode = new URLSearchParams(location.hash.slice(1)).get('clase') || '';
    if (!/^[a-f0-9]{32}$/.test(classCode)) classCode = '';
    window.addEventListener('hashchange', () => {
        const value = new URLSearchParams(location.hash.slice(1)).get('clase') || '';
        classCode = /^[a-f0-9]{32}$/.test(value) ? value : '';
        window.dispatchEvent(new Event('edu-drive-class-changed'));
    });
    let bridge = null;
    function resetBridge() {
        if (!bridge) return;
        window.removeEventListener('message', bridge.listener);
        bridge.iframe.remove();
        bridge = null;
    }
    function connect() {
        if (bridge) return bridge.ready;
        const channel = randomId();
        const iframe = document.createElement('iframe');
        iframe.hidden = true;
        iframe.title = 'Conexión con el buzón del docente';
        iframe.referrerPolicy = 'no-referrer';
        const state = {iframe, channel, peer: null, origin: '', pending: null};
        bridge = state;
        state.ready = new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                resetBridge();
                reject(new Error('No pudimos conectar con el buzón. Pedí ayuda a tu docente y reintentá.'));
            }, 25000);
            state.listener = event => {
                const data = event.data;
                if (!data || data.channel !== channel || !googleOrigin(event.origin) || !event.source) return;
                if (data.type === 'edu-drive-ready' && !state.peer) {
                    state.peer = event.source; state.origin = event.origin;
                    clearTimeout(timer); resolve(state); return;
                }
                if (event.source !== state.peer || event.origin !== state.origin || data.type !== 'edu-drive-result' ||
                    !state.pending || data.submissionId !== state.pending.id) return;
                const pending = state.pending; state.pending = null; clearTimeout(pending.timer);
                if (data.error) pending.reject(new Error(data.error));
                else if (!data.result?.ok || data.result.receipt !== pending.id) pending.reject(new Error('La confirmación de entrega no es válida. Reintentá.'));
                else pending.resolve(data.result);
            };
            window.addEventListener('message', state.listener);
            const url = new URL(endpoint);
            url.searchParams.set('modo', 'editor'); url.searchParams.set('origen', location.origin); url.searchParams.set('canal', channel);
            iframe.src = url.href;
            document.body.append(iframe);
        });
        return state.ready;
    }
    const api = window.BlockbenchEduDrive = {
        get classCode() { return classCode; },
        setClassCode(value) {
            if (!/^[a-f0-9]{32}$/.test(value)) throw new Error('Copiá el código de entrega que figura en Apps Script.');
            classCode = value;
            window.dispatchEvent(new Event('edu-drive-class-changed'));
        },
        get classLink() {
            if (!classCode) return '';
            const url = new URL(window.BlockbenchEduWeb?.studentUrl || location.href); url.search = ''; url.hash = new URLSearchParams({clase: classCode}).toString();
            return url.href;
        },
        async prepare(content, alias, creature, fileName) {
            if (!classCode) throw new Error('El docente todavía no seleccionó la clase para esta entrega.');
            if (content.size > 10485760) throw new Error('La criatura supera los 10 MB. Guardá una copia y avisale a tu docente.');
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = () => reject(new Error('No pudimos preparar la entrega. Reintentá.')); reader.readAsDataURL(content);
            });
            return {classCode, alias, creature, fileName, submissionId: randomId(), base64};
        },
        async send(payload) {
            const state = await connect();
            if (state.pending) throw new Error('Esperá a que termine la entrega anterior.');
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    state.pending = null; resetBridge();
                    reject(new Error('No pudimos confirmar la entrega. Reintentá desde este cuadro para comprobarla sin duplicarla.'));
                }, 90000);
                state.pending = {id: payload.submissionId, resolve, reject, timer};
                try { state.peer.postMessage({type: 'edu-drive-upload', channel: state.channel, payload}, state.origin); }
                catch (error) { clearTimeout(timer); state.pending = null; resetBridge(); reject(error); }
            });
        }
    };
})();
