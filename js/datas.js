/* Datas, horas e meses sempre no padrão brasileiro (dd/mm/aaaa, 14:30, mm/aaaa), seja qual for o idioma do navegador.
   Os campos <input type="date|time|month"> viram um campo de texto com máscara; o campo original continua no
   formulário (escondido) com o valor no formato de sempre (aaaa-mm-dd, hh:mm, aaaa-mm), então o resto do sistema
   não muda: lê, grava e ouve 'input'/'change' nele como antes. Datas e meses têm um botão que abre o calendário. */
(() => {
  const FORMATOS = {
    date: {
      mascara: [2, 2, 4], sep: '/', exemplo: 'dd/mm/aaaa',
      mostrar: (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}` : ''),
      ler: (t) => {
        const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!m) return null;
        const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
        return d.getUTCDate() === +m[1] && d.getUTCMonth() === +m[2] - 1 ? `${m[3]}-${m[2]}-${m[1]}` : null;
      },
    },
    month: {
      mascara: [2, 4], sep: '/', exemplo: 'mm/aaaa',
      mostrar: (v) => (/^\d{4}-\d{2}$/.test(v) ? `${v.slice(5, 7)}/${v.slice(0, 4)}` : ''),
      ler: (t) => { const m = t.match(/^(\d{2})\/(\d{4})$/); return m && +m[1] >= 1 && +m[1] <= 12 ? `${m[2]}-${m[1]}` : null; },
    },
    time: {
      mascara: [2, 2], sep: ':', exemplo: 'hh:mm',
      mostrar: (v) => (/^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : ''),
      ler: (t) => { const m = t.match(/^(\d{2}):(\d{2})$/); return m && +m[1] < 24 && +m[2] < 60 ? t : null; },
    },
  };
  const valorNativo = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const ICONE_CAL = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';

  // Coloca as barras (ou os dois-pontos) enquanto a pessoa digita só os números.
  function aplicarMascara(texto, f) {
    const dig = texto.replace(/\D/g, '').slice(0, f.mascara.reduce((a, b) => a + b, 0));
    const partes = [];
    let i = 0;
    for (const n of f.mascara) { if (i >= dig.length) break; partes.push(dig.slice(i, i + n)); i += n; }
    return partes.join(f.sep);
  }

  function adaptar(orig) {
    const tipo = orig.type;
    const f = FORMATOS[tipo];
    if (!f || orig.dataset.brAdaptado) return;
    orig.dataset.brAdaptado = '1';
    const vis = document.createElement('input');
    vis.type = 'text';
    vis.inputMode = 'numeric';
    vis.autocomplete = 'off';
    vis.placeholder = f.exemplo;
    vis.className = orig.className;
    if (orig.getAttribute('style')) vis.setAttribute('style', orig.getAttribute('style'));
    if (orig.required) { vis.required = true; orig.required = false; }
    if (orig.disabled) vis.disabled = true;
    if (orig.readOnly) vis.readOnly = true;
    if (orig.hidden) vis.hidden = true;
    if (orig.title) vis.title = orig.title;
    if (orig.getAttribute('aria-label')) vis.setAttribute('aria-label', orig.getAttribute('aria-label'));
    vis.value = f.mostrar(valorNativo.get.call(orig));

    // O sistema continua mudando o valor do campo original (ex.: vencimento calculado); o texto acompanha.
    Object.defineProperty(orig, 'value', {
      configurable: true,
      get() { return valorNativo.get.call(this); },
      set(v) { valorNativo.set.call(this, v); vis.value = f.mostrar(v || ''); vis.setCustomValidity(''); },
    });
    orig.type = 'hidden';

    let caixa = vis;
    if (tipo !== 'time') {
      // Botão do calendário: um campo de data de verdade, invisível, só para abrir o seletor do navegador.
      caixa = document.createElement('span');
      caixa.className = 'campo-data';
      if (vis.hidden) caixa.hidden = true;
      const seletor = document.createElement('input');
      seletor.type = tipo;
      seletor.dataset.brAdaptado = '1'; // é o seletor nativo do calendário: não deve virar campo de texto
      seletor.tabIndex = -1;
      seletor.className = 'campo-data-seletor';
      seletor.setAttribute('aria-hidden', 'true');
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'campo-data-btn';
      botao.title = tipo === 'month' ? 'Escolher o mês' : 'Abrir calendário';
      botao.innerHTML = ICONE_CAL;
      botao.disabled = vis.disabled || vis.readOnly;
      botao.addEventListener('click', () => {
        valorNativo.set.call(seletor, valorNativo.get.call(orig));
        try { seletor.showPicker(); } catch { seletor.focus(); seletor.click(); }
      });
      seletor.addEventListener('change', () => {
        orig.value = seletor.value;
        orig.dispatchEvent(new Event('input', { bubbles: true }));
        orig.dispatchEvent(new Event('change', { bubbles: true }));
      });
      caixa.append(vis, botao, seletor);
    }
    orig.after(caixa);

    const avisar = () => {
      orig.dispatchEvent(new Event('input', { bubbles: true }));
      orig.dispatchEvent(new Event('change', { bubbles: true }));
    };
    let apagadoSemAviso = false;
    vis.addEventListener('input', () => {
      vis.value = aplicarMascara(vis.value, f);
      const iso = f.ler(vis.value);
      vis.setCustomValidity(vis.value && !iso && vis.value.length >= f.exemplo.length ? 'Data inválida' : '');
      if (iso && iso !== valorNativo.get.call(orig)) {
        valorNativo.set.call(orig, iso);
        apagadoSemAviso = false;
        avisar();
      } else if (!vis.value && valorNativo.get.call(orig)) {
        // Campo apagado: o valor some na hora, mas a tela só é avisada ao sair do campo (a pessoa ainda vai digitar).
        valorNativo.set.call(orig, '');
        apagadoSemAviso = true;
      }
    });
    vis.addEventListener('blur', () => {
      if (vis.value && !f.ler(vis.value)) vis.setCustomValidity(tipo === 'time' ? 'Hora inválida' : tipo === 'month' ? 'Mês inválido' : 'Data inválida');
      if (apagadoSemAviso && !vis.value) { apagadoSemAviso = false; avisar(); }
    });
  }

  const adaptarTudo = (raiz) => {
    if (raiz.matches && raiz.matches('input[type=date],input[type=time],input[type=month]')) adaptar(raiz);
    if (raiz.querySelectorAll) raiz.querySelectorAll('input[type=date],input[type=time],input[type=month]').forEach(adaptar);
  };
  new MutationObserver((mudancas) => mudancas.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) adaptarTudo(n); })))
    .observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => adaptarTudo(document));
  else adaptarTudo(document);
})();
