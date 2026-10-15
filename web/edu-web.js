/* Web-only host. The standalone plugin remains the single editor implementation. */
(() => {
  'use strict';
  const preferences = JSON.parse(localStorage.getItem('settings') || '{}');
  preferences.language = {value: 'es'};
  localStorage.setItem('settings', JSON.stringify(preferences));
  let overlay, started = false, failed = false;
  const host = window.BlockbenchEduWeb = {
    autostart: true,
    showHome() {
      document.body.classList.remove('edu-web-loading');
      document.body.classList.add('edu-web-home');
      overlay.hidden = false;
      overlay.querySelector('h1').textContent = 'Blockbench Edu';
      overlay.querySelector('p').textContent = 'Crea tu propia criatura para Minecraft Education.';
      const button = overlay.querySelector('button');
      button.hidden = false;
      button.textContent = 'Comenzar';
      button.onclick = () => ModelLoader.loaders.blockbench_edu.onStart();
    },
    showWizard() {
      document.title = 'Blockbench Edu';
      document.body.classList.remove('edu-web-loading', 'edu-web-home');
      overlay.hidden = true;
    }
  };
  function failure(error) {
    if (failed || started) return;
    failed = true;
    console.error('[Blockbench Edu Web]', error);
    document.body.classList.add('edu-web-loading');
    overlay.hidden = false;
    overlay.querySelector('h1').textContent = 'No pudimos abrir el editor';
    overlay.querySelector('p').textContent = 'Comprueba tu conexión y vuelve a intentarlo.';
    const button = overlay.querySelector('button');
    button.hidden = false;
    button.textContent = 'Reintentar';
    button.onclick = () => location.reload();
  }
  (() => {
    overlay = document.getElementById('edu-web-start');
    const timeout = setTimeout(() => failure(new Error('Startup exceeded 30 seconds')), 30000);
    const wait = setInterval(() => {
      if (failed || started) { clearInterval(wait); return; }
      if (!window.Blockbench?.setup_successful) return;
      clearInterval(wait);
      try {
        Plugins.registered.blockbench_edu = new Plugin('blockbench_edu');
        const script = document.createElement('script');
        script.src = new URL('blockbench_edu.js', location.href).href;
        script.onerror = () => failure(new Error('Edu script could not load'));
        script.onload = () => {
          if (failed) return;
          try {
            if (!ModelLoader.loaders.blockbench_edu) throw new Error('Edu did not register');
            // Dismiss upstream welcome/update dialogs before opening our own assistant.
            Dialog.open?.hide();
            ModelLoader.loaders.blockbench_edu.onStart();
            started = true;
            clearTimeout(timeout);
          } catch (error) { failure(error); }
        };
        document.head.append(script);
      } catch (error) { failure(error); }
    }, 50);
  })();
})();
