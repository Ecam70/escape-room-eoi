/* Pantalla de clave: bloquea el botón de entrada hasta que la clave sea correcta */
(function () {
  const norm = s => String(s || '').replace(/\s+/g, '').toUpperCase();
  const KEY = norm(window.ER_ACCESS_KEY), box = document.getElementById('access'), inp = document.getElementById('accesskey'), msg = document.getElementById('accessmsg');
  let remembered = false; try { remembered = sessionStorage.getItem('er_access') === KEY; } catch (e) { }
  if (!KEY || remembered) { box.classList.add('hidden'); return; }
  const ok = () => norm(inp.value) === KEY;
  document.querySelector('#intro .introcard').addEventListener('click', e => {
    if (!e.target.closest('#start') || ok()) { if (ok()) { try { sessionStorage.setItem('er_access', KEY); } catch (x) { } } return; }
    e.stopPropagation(); e.preventDefault();
    msg.textContent = inp.value ? 'Clave incorrecta. Pídesela a quien organiza la sesión.' : 'Escribe la clave de acceso para entrar.';
    box.classList.remove('err'); void box.offsetWidth; box.classList.add('err'); inp.focus(); inp.select();
  }, true);
  inp.addEventListener('input', () => { msg.textContent = ''; box.classList.remove('err'); });
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') document.getElementById('start').click(); });
})();
