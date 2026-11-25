/* Importação das observações e anotações de clientes vindas do sistema anterior (Lira).
   A planilha tem uma linha por cliente com as colunas Código, Observação e Anotações; cada anotação vem
   como "[dd/mm/aaaa] texto", separadas por " || ". A observação vai inteira para o campo Observações e as
   anotações para a aba Anotações do cliente com o mesmo código. */

const AUTOR_LIRA = 'Importado do Lira';

// Monta o que será gravado, sem gravar nada. `norm` é a função de normalizar textos do app.
function planoAnotacoes(linhas, clientes, norm) {
  const cab = linhas[0].map(norm);
  const col = (...nomes) => cab.findIndex((h) => nomes.includes(h));
  const iCod = col('codigo', 'cod'), iObs = col('observacao', 'observacoes', 'obs'), iAn = col('anotacoes', 'anotacao');
  // Planilha com uma anotação por linha: a data vem numa coluna própria.
  const iData = col('data da anotacao', 'data', 'cadastro');
  if (iCod < 0 || (iObs < 0 && iAn < 0)) throw new Error('A planilha precisa das colunas Código e Anotações (ou Observação).');

  // Mesma linha repetida no arquivo (código cadastrado duas vezes no Lira): junta as anotações sem repetir.
  const porCodigo = new Map();
  for (const l of linhas.slice(1)) {
    const cod = norm(l[iCod]);
    if (!cod) continue;
    const reg = porCodigo.get(cod) || { cod: String(l[iCod]).trim(), notas: new Map(), obs: new Set() };
    for (const parte of String(iAn >= 0 ? l[iAn] || '' : '').split(' || ')) {
      const m = parte.trim().match(/^\[(\d{2})\/(\d{2})\/(\d{4})\]\s*([\s\S]*)$/);
      const texto = (m ? m[4] : parte).trim();
      const d = !m && iData >= 0 && String(l[iData] || '').match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (texto) reg.notas.set(norm(texto), { texto, data: m ? `${m[3]}-${m[2]}-${m[1]}` : d ? `${d[3]}-${d[2]}-${d[1]}` : '' });
    }
    const obs = String(iObs >= 0 ? l[iObs] || '' : '').trim();
    if (obs) reg.obs.add(obs);
    porCodigo.set(cod, reg);
  }

  const clientesPorCodigo = new Map();
  for (const c of clientes) {
    const cod = norm(c.codigo);
    if (cod) clientesPorCodigo.set(cod, [...(clientesPorCodigo.get(cod) || []), c]);
  }

  const agora = new Date().toISOString();
  let seq = 0;
  const novoId = () => Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 6);
  // Mesmas palavras em outra ordem contam como a mesma anotação.
  const chave = (t) => norm(t).replace(/[*()]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');
  const r = { atualizar: [], novas: 0, jaExistem: 0, observacoes: 0, obsJaExistem: 0, encontrados: 0, semAnotacao: 0, naoEncontrados: [], repetidos: [] };
  for (const reg of porCodigo.values()) {
    if (!reg.notas.size && !reg.obs.size) { r.semAnotacao++; continue; }
    const achados = clientesPorCodigo.get(norm(reg.cod)) || [];
    if (!achados.length) { r.naoEncontrados.push(reg.cod); continue; }
    if (achados.length > 1) { r.repetidos.push(reg.cod); continue; }
    const c = achados[0];
    r.encontrados++;
    const lista = (c.anotacoes || []).slice();
    const existentes = new Set(lista.map((a) => chave(a.texto)));
    const novas = [];
    const incluir = (texto, data) => {
      const k = chave(texto);
      if (!k) return;
      if (existentes.has(k)) { r.jaExistem++; return; }
      existentes.add(k);
      novas.push({ id: novoId(), texto, ativa: true, criadoEm: data ? `${data}T12:00:00.000Z` : agora, autor: AUTOR_LIRA });
    };
    for (const n of reg.notas.values()) incluir(n.texto, n.data);
    // A observação entra inteira no campo Observações; se o cliente já tem outra, fica abaixo dela.
    let obs = c.obs || '';
    for (const o of reg.obs) {
      if (norm(obs).includes(norm(o))) { r.obsJaExistem++; continue; }
      obs = obs.trim() ? `${obs.trim()}\n\n${o}` : o;
      r.observacoes++;
    }
    if (novas.length || obs !== (c.obs || '')) {
      r.novas += novas.length;
      r.atualizar.push({ id: c.id, ...(novas.length ? { anotacoes: lista.concat(novas) } : {}), ...(obs !== (c.obs || '') ? { obs } : {}) });
    }
  }
  return r;
}

// Dados completos do Lira (arquivo .json): cada registro traz o código, os campos da ficha, a observação e as
// anotações. Campos vazios no Lira não apagam o que já está no sistema; código sem cliente aqui vira cliente novo.
function planoLira(registros, clientes, norm) {
  const porCodigo = new Map();
  for (const c of clientes) {
    const cod = norm(c.codigo);
    if (cod) porCodigo.set(cod, [...(porCodigo.get(cod) || []), c]);
  }
  const agora = new Date().toISOString();
  let seq = 0;
  const novoId = () => Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 6);
  const chave = (t) => norm(t).replace(/[*()]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');
  const nota = (n) => ({ id: novoId(), texto: n.texto, ativa: true, criadoEm: n.data ? `${n.data}T12:00:00.000Z` : agora, autor: AUTOR_LIRA });
  const r = { atualizar: [], criar: [], novas: 0, jaExistem: 0, observacoes: 0, campos: 0, repetidos: [] };
  for (const reg of registros) {
    const achados = porCodigo.get(norm(reg.codigo)) || [];
    if (achados.length > 1) { r.repetidos.push(reg.codigo); continue; }
    if (!achados.length) {
      const anotacoes = (reg.anotacoes || []).map(nota);
      r.novas += anotacoes.length;
      if (reg.obs) r.observacoes++;
      r.criar.push({ ...reg.campos, codigo: String(reg.codigo), obs: reg.obs || '', anotacoes });
      continue;
    }
    const c = achados[0];
    const mud = {};
    for (const [k, v] of Object.entries(reg.campos || {})) {
      if (v === '' || v === null || v === undefined) continue;
      if (c[k] !== v) { mud[k] = v; r.campos++; }
    }
    let obs = c.obs || '';
    if (reg.obs && !norm(obs).includes(norm(reg.obs))) { obs = obs.trim() ? `${obs.trim()}\n\n${reg.obs}` : reg.obs; mud.obs = obs; r.observacoes++; }
    const lista = (c.anotacoes || []).slice();
    const existentes = new Set(lista.map((a) => chave(a.texto)));
    const novas = [];
    for (const n of reg.anotacoes || []) {
      const k = chave(n.texto);
      if (!k) continue;
      if (existentes.has(k)) { r.jaExistem++; continue; }
      existentes.add(k);
      novas.push(nota(n));
    }
    if (novas.length) { mud.anotacoes = lista.concat(novas); r.novas += novas.length; }
    if (Object.keys(mud).length) r.atualizar.push({ id: c.id, ...mud });
  }
  return r;
}

function importarAnotacoesPlanilha(aoTerminar) {
  abrirModal('Importar dados do Lira', `
    <div class="importacao">
      <p>Escolha o arquivo <b>lira-clientes.json</b> (dados completos) ou uma planilha <b>.csv</b> com Código, Observação e Anotações.
        Cada cliente é ligado pelo <b>mesmo código</b>.</p>
      <p class="ajuda">A observação vai para o campo <b>Observações</b> da ficha e as anotações para a aba <b>Anotações</b>.
        O que o cliente já tem não é repetido, então dá para importar o mesmo arquivo de novo sem duplicar.</p>
      <div class="acoes"><label class="btn">Escolher arquivo .csv<input type="file" id="arquivo-anot" accept=".json,.csv,text/csv,.txt" hidden></label></div>
      <div id="etapa-anot"></div>
    </div>`, (raiz) => {
    $('#arquivo-anot', raiz).addEventListener('change', async (e) => {
      const arq = e.target.files[0];
      if (!arq) return;
      const caixa = $('#etapa-anot', raiz);
      let r;
      try {
        const texto = await lerArquivoTexto(arq);
        r = /\.json$/i.test(arq.name) ? planoLira(JSON.parse(texto), DB.listar('clientes'), normalizar)
          : { criar: [], campos: 0, ...planoAnotacoes(lerCSV(texto), DB.listar('clientes'), normalizar) };
      } catch (err) { caixa.innerHTML = `<p class="erro">${esc(err.message)}</p>`; return; }
      const lista = (cods) => esc(cods.slice(0, 30).join(', ') + (cods.length > 30 ? ` e mais ${cods.length - 30}` : ''));
      caixa.innerHTML = `
        <div class="resumo-importacao">
          <span class="tag verde">${r.observacoes.toLocaleString('pt-BR')} observações</span>
          <span class="tag verde">${r.novas.toLocaleString('pt-BR')} anotações novas</span>
          <span class="tag cinza">${r.atualizar.length.toLocaleString('pt-BR')} clientes atualizados</span>
          ${r.campos ? `<span class="tag cinza">${r.campos.toLocaleString('pt-BR')} campos da ficha atualizados</span>` : ''}
          ${r.criar.length ? `<span class="tag laranja">${r.criar.length.toLocaleString('pt-BR')} clientes novos</span>` : ''}
          ${r.jaExistem + r.obsJaExistem ? `<span class="tag cinza">${(r.jaExistem + r.obsJaExistem).toLocaleString('pt-BR')} já estavam cadastradas</span>` : ''}
          ${r.naoEncontrados.length ? `<span class="tag amarelo">${r.naoEncontrados.length} códigos sem cliente no sistema</span>` : ''}
          ${r.repetidos.length ? `<span class="tag vermelho">${r.repetidos.length} códigos usados por mais de um cliente</span>` : ''}
        </div>
        <ul class="lista-ajuda">
          ${r.naoEncontrados.length ? `<li class="atencao">Códigos sem cliente no sistema (ficam de fora): ${lista(r.naoEncontrados)}</li>` : ''}
          ${r.repetidos.length ? `<li class="atencao">Códigos que estão em mais de um cliente aqui (ficam de fora; confira e importe à mão): ${lista(r.repetidos)}</li>` : ''}
        </ul>
        <div class="form-acoes"><button type="button" class="btn sec" data-cancelar>Cancelar</button>
          <button type="button" class="btn" id="confirmar-anot" ${r.atualizar.length || r.criar.length ? '' : 'disabled'}>Importar</button></div>`;
      $('[data-cancelar]', caixa).addEventListener('click', fecharModal);
      $('#confirmar-anot', caixa).addEventListener('click', (ev) => enviando(ev.target, async () => {
        await DB.atualizarVarios('clientes', r.atualizar, (feito, total) => { ev.target.textContent = `Gravando ${feito} de ${total}...`; });
        if (r.criar.length) await DB.adicionarVarios('clientes', r.criar, (feito, total) => { ev.target.textContent = `Criando ${feito} de ${total}...`; });
        fecharModal();
        avisar(`Importado: ${r.atualizar.length.toLocaleString('pt-BR')} clientes atualizados${r.criar.length ? `, ${r.criar.length} novos` : ''}, ${r.observacoes.toLocaleString('pt-BR')} observações e ${r.novas.toLocaleString('pt-BR')} anotações.`);
        aoTerminar();
      }));
    });
  });
}
