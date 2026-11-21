/* Importação de anotações de clientes vindas do sistema anterior (Lira).
   A planilha tem uma linha por cliente com as colunas Código, Observação e Anotações; cada anotação vem
   como "[dd/mm/aaaa] texto", separadas por " || ". As anotações entram na ficha do cliente com o mesmo código. */

const AUTOR_LIRA = 'Importado do Lira';

// Monta o que será gravado, sem gravar nada. `norm` é a função de normalizar textos do app.
function planoAnotacoes(linhas, clientes, norm) {
  const cab = linhas[0].map(norm);
  const col = (...nomes) => cab.findIndex((h) => nomes.includes(h));
  const iCod = col('codigo', 'cod'), iObs = col('observacao', 'observacoes', 'obs'), iAn = col('anotacoes', 'anotacao');
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
      if (texto) reg.notas.set(norm(texto), { texto, data: m ? `${m[3]}-${m[2]}-${m[1]}` : '' });
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
  const r = { atualizar: [], novas: 0, jaExistem: 0, encontrados: 0, semAnotacao: 0, naoEncontrados: [], repetidos: [] };
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
    // A observação do cadastro costuma ser um histórico com uma data por linha: cada linha datada vira uma
    // anotação com aquela data; o resto (sem data) entra junto numa anotação só.
    for (const obs of reg.obs) {
      const semData = [];
      for (const linha of obs.split(/\n+/).map((x) => x.trim()).filter(Boolean)) {
        const m = linha.match(/^(\d{2})\/(\d{2})\/(\d{4})\b/);
        if (m) incluir(linha, `${m[3]}-${m[2]}-${m[1]}`);
        else if (!existentes.has(chave(linha))) semData.push(linha);
      }
      if (semData.length) incluir('Observação do cadastro no Lira: ' + semData.join('\n'), '');
    }
    if (novas.length) {
      r.novas += novas.length;
      r.atualizar.push({ id: c.id, anotacoes: lista.concat(novas) });
    }
  }
  return r;
}

function importarAnotacoesPlanilha(aoTerminar) {
  abrirModal('Importar anotações do Lira', `
    <div class="importacao">
      <p>Escolha a planilha <b>.csv</b> com as descrições dos clientes do Lira (colunas Código, Observação e Anotações).
        Cada linha é ligada ao cliente com o <b>mesmo código</b>.</p>
      <p class="ajuda">Anotações que o cliente já tem não são repetidas, então dá para importar o mesmo arquivo de novo sem duplicar.</p>
      <div class="acoes"><label class="btn">Escolher arquivo .csv<input type="file" id="arquivo-anot" accept=".csv,text/csv,.txt" hidden></label></div>
      <div id="etapa-anot"></div>
    </div>`, (raiz) => {
    $('#arquivo-anot', raiz).addEventListener('change', async (e) => {
      const arq = e.target.files[0];
      if (!arq) return;
      const caixa = $('#etapa-anot', raiz);
      let r;
      try {
        r = planoAnotacoes(lerCSV(await lerArquivoTexto(arq)), DB.listar('clientes'), normalizar);
      } catch (err) { caixa.innerHTML = `<p class="erro">${esc(err.message)}</p>`; return; }
      const lista = (cods) => esc(cods.slice(0, 30).join(', ') + (cods.length > 30 ? ` e mais ${cods.length - 30}` : ''));
      caixa.innerHTML = `
        <div class="resumo-importacao">
          <span class="tag verde">${r.novas.toLocaleString('pt-BR')} anotações novas em ${r.atualizar.length.toLocaleString('pt-BR')} clientes</span>
          ${r.jaExistem ? `<span class="tag cinza">${r.jaExistem.toLocaleString('pt-BR')} já estavam cadastradas</span>` : ''}
          ${r.naoEncontrados.length ? `<span class="tag amarelo">${r.naoEncontrados.length} códigos sem cliente no sistema</span>` : ''}
          ${r.repetidos.length ? `<span class="tag vermelho">${r.repetidos.length} códigos usados por mais de um cliente</span>` : ''}
        </div>
        <ul class="lista-ajuda">
          ${r.naoEncontrados.length ? `<li class="atencao">Códigos sem cliente no sistema (ficam de fora): ${lista(r.naoEncontrados)}</li>` : ''}
          ${r.repetidos.length ? `<li class="atencao">Códigos que estão em mais de um cliente aqui (ficam de fora; confira e importe à mão): ${lista(r.repetidos)}</li>` : ''}
        </ul>
        <div class="form-acoes"><button type="button" class="btn sec" data-cancelar>Cancelar</button>
          <button type="button" class="btn" id="confirmar-anot" ${r.atualizar.length ? '' : 'disabled'}>Importar anotações</button></div>`;
      $('[data-cancelar]', caixa).addEventListener('click', fecharModal);
      $('#confirmar-anot', caixa).addEventListener('click', (ev) => enviando(ev.target, async () => {
        await DB.atualizarVarios('clientes', r.atualizar, (feito, total) => { ev.target.textContent = `Gravando ${feito} de ${total}...`; });
        fecharModal();
        avisar(`${r.novas.toLocaleString('pt-BR')} anotações importadas em ${r.atualizar.length.toLocaleString('pt-BR')} clientes.`);
        aoTerminar();
      }));
    });
  });
}
