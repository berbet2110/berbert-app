// Laudos: certificado de dedetização e laudo de limpeza de caixa d'água (com fotos do antes e depois).
// Os formulários usam opções para marcar e selecionar; o texto livre fica só para "outros" e observações.

const PRAGAS_LAUDO = ['Baratas', 'Formigas', 'Ratos', 'Cupins', 'Escorpiões', 'Aranhas', 'Moscas', 'Mosquitos', 'Pulgas',
  'Percevejos', 'Carrapatos', 'Traças', 'Pombos', 'Morcegos', 'Abelhas / vespas'];
const AREAS_LAUDO = ['Cozinha', 'Banheiros', 'Salas', 'Quartos', 'Escritórios', 'Depósito / estoque', 'Área externa', 'Garagem',
  'Jardim', 'Telhado / forro', 'Rede de esgoto', 'Caixas de gordura', 'Áreas comuns', 'Área de produção'];
const METODOS_LAUDO = ['Pulverização', 'Gel', 'Iscas em bloco', 'Iscas granuladas', 'Porta-iscas', 'Polvilhamento',
  'Atomização / nebulização', 'Termonebulização', 'Barreira química'];
const RECOMENDACOES_DEDET = [
  'Manter o ambiente fechado por pelo menos 2 horas após a aplicação.',
  'Evitar contato de crianças e animais com as áreas tratadas até a secagem completa.',
  'Não lavar as áreas tratadas por 7 dias.',
  'Não remover nem mexer nos porta-iscas instalados.',
  'Guardar alimentos e utensílios fechados durante a aplicação.',
];
const GARANTIAS = [[30, '30 dias'], [60, '60 dias'], [90, '90 dias'], [120, '120 dias'], [180, '6 meses'], [365, '1 ano']];

// Certificado no modelo Berbert (folha deitada). Estes são os textos iniciais; o administrador pode salvar outros como padrão.
const CERT_PADRAO = {
  licencas: 'Nº LICENÇA SANITÁRIA 238/2024\nNº LICENÇA SANITÁRIA AMBIENTAL 290638',
  abertura: 'Certificamos para os devidos fins que a empresa contratada DEDETIZADORA BERBERT LTDA-ME executou nesta unidade os serviços descritos abaixo.',
  servicos: "Serviço de Limpeza de Caixas D'água\nDedetização e Desratização",
  normas: 'Nosso trabalho segue as normas do sistema de qualidade aparente, GMP, ISO e HACCP com produtos licenciados pela divisão nacional de vigilância e saneantes domissanitários, conforme legislação vigente.',
  produtos: [
    { grupo: 'Piretrinas e piretróides', nome: 'Lamdba Cyhalothryn', antidoto: 'Anti-histamínico e tratamento assintomático', registro: '3.0119.6626', emergencia: '0800.7044304' },
    { grupo: 'Cumarínico', nome: 'For-Rat', antidoto: 'Vitamina K1 e tratamento assintomático', registro: '33308.0002', emergencia: '0800.7226001' },
    { grupo: 'Pirazol', nome: 'Cavaleiro SC', antidoto: 'Tratamento assintomático', registro: '33308.0017', emergencia: '0800.7226001' },
    { grupo: 'Flocomagen', nome: 'Storm Compressed Block', antidoto: 'Vitamina K1 e tratamento assintomático', registro: '3.0404.0036', emergencia: '0800.192-500' },
    { grupo: 'Hipoclorito de Sódio', nome: 'Água sanitária', antidoto: 'Tratamento assintomático', registro: '3.011392-06', emergencia: '0800.7226001' },
  ],
  responsavel: 'RICARDO MANOEL PEDROSO', cargo: 'Engenheiro Agrônomo | Responsável Técnico', registro: 'CREA PR 92.425/D',
  site: 'berbertpestcontrol.com.br',
  rodape: 'CNPJ:04.608.408/0001-29 | IE 90487454-04\nRua Panambi, 3166 Jardim Cidade Alta II\nCampo Mourão - PR CEP 87303-230',
};
const COLS_CERT = [
  { nome: 'grupo', rotulo: 'Grupo químico', largura: '20%' }, { nome: 'nome', rotulo: 'Nome comum', largura: '20%' },
  { nome: 'antidoto', rotulo: 'Antídoto', largura: '28%' }, { nome: 'registro', rotulo: 'Reg. Ministério da Saúde' },
  { nome: 'emergencia', rotulo: 'Emergência' },
];
const certPadrao = () => ({ ...CERT_PADRAO, ...(DB.config().certificado || {}) });

const TIPOS_RESERV = ["Caixa d'água", 'Cisterna', 'Reservatório elevado', 'Reservatório enterrado'];
const MATERIAIS_RESERV = ['Polietileno', 'Fibra de vidro', 'Concreto', 'Fibrocimento (amianto)', 'Inox', 'Metálico'];
const CAPACIDADES = [250, 310, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000];
const LOCAIS_RESERV = ['Telhado / forro', 'Sobre a laje', 'Torre', 'Térreo', 'Subsolo / enterrado', 'Área externa'];
const CONDICOES_CAIXA = ['Sedimentos / sujeira no fundo', 'Lodo ou limo nas paredes', 'Insetos ou larvas', 'Animais mortos',
  'Tampa ausente, quebrada ou mal vedada', 'Rachaduras ou infiltrações', 'Ferrugem / corrosão', 'Boia com defeito',
  'Bom estado de conservação'];
const DESINFETANTES = ['Hipoclorito de sódio 2,5%', 'Hipoclorito de sódio 10 a 12%', 'Hipoclorito de cálcio (cloro granulado)'];
const CONCENTRACOES_SOL = ['50 ppm de cloro livre', '100 ppm de cloro livre', '200 ppm de cloro livre'];
const TEMPOS_CONTATO = ['30 minutos', '1 hora', '2 horas'];
const VALIDADES_CAIXA = [[3, '3 meses'], [6, '6 meses'], [12, '12 meses']];
/* ---------- Ajudantes de formulário ---------- */
// Grupo de opções para marcar. 'marcados' é a lista do que já estava marcado.
function grupoMarcar(nome, opcoesLista, marcados = [], colunas = '') {
  const sel = new Set(marcados.map(normalizar));
  return `<div class="grupo-marcar ${colunas}">${opcoesLista.map((o) => `<label class="opcao-marcar"><input type="checkbox" data-grupo="${nome}" value="${esc(o)}"
    ${sel.has(normalizar(o)) ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`;
}
const lerGrupo = (raiz, nome) => $$(`[data-grupo="${nome}"]:checked`, raiz).map((c) => c.value);
// Separa um texto antigo ("Baratas, ratos, pombos no forro") no que existe nas opções e no resto.
function separarTexto(texto, opcoesLista) {
  const marcados = [], resto = [];
  String(texto || '').split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean).forEach((p) => {
    const o = opcoesLista.find((x) => normalizar(x) === normalizar(p));
    if (o) marcados.push(o); else resto.push(p);
  });
  return { marcados, outros: resto.join(', ') };
}
const juntar = (lista, outros) => [...lista, ...(outros ? [outros] : [])].join(', ');
// Responsáveis técnicos e técnicos para escolher: o do cadastro da empresa e os colaboradores.
function pessoasLaudo(funcao) {
  const cfg = DB.config();
  const lista = [];
  const com = colaboradoresAtivos().filter((c) => (c.funcoes || []).includes(funcao));
  const sem = colaboradoresAtivos().filter((c) => !(c.funcoes || []).includes(funcao));
  [...com, ...sem].forEach((c) => lista.push({ nome: (c.codigo ? c.codigo + ' - ' : '') + c.nome, registro: c.registro || '' }));
  if (funcao === 'responsavel_tecnico' && cfg.responsavelTecnico && !lista.some((p) => p.nome.endsWith(cfg.responsavelTecnico))) {
    lista.unshift({ nome: cfg.responsavelTecnico, registro: cfg.registroResp || '' });
  }
  return lista;
}
function seletorPessoa(nome, funcao, atual) {
  const lista = pessoasLaudo(funcao);
  if (atual && !lista.some((p) => p.nome === atual)) lista.unshift({ nome: atual, registro: '' });
  return `<select name="${nome}"><option value="">— selecione —</option>${lista.map((p) => `<option value="${esc(p.nome)}" data-registro="${esc(p.registro)}"
    ${p.nome === atual ? 'selected' : ''}>${esc(p.nome)}${p.registro ? ' (' + esc(p.registro) + ')' : ''}</option>`).join('')}</select>`;
}
const registroDe = (form, nome) => (form[nome].selectedOptions[0] || {}).dataset?.registro || '';
const opcoesSimples = (lista, atual) => lista.map((o) => { const [v, r] = Array.isArray(o) ? o : [o, o];
  return `<option value="${esc(v)}" ${String(v) === String(atual) ? 'selected' : ''}>${esc(r)}</option>`; }).join('');

/* ---------- Lista ---------- */
let padraoNovoLaudo = {};
function formLaudo(id, padrao = {}) {
  padraoNovoLaudo = padrao;
  irPara('laudo/' + (id || 'novo'));
}
const validadeLaudo = (l) => (l.tipo === 'certificado' ? l.vencimento || ''
  : l.tipo === 'caixa' ? (l.validadeMeses ? somarMeses(l.data, Number(l.validadeMeses)) : '')
  : (l.garantiaDias ? somarDias(l.data, l.garantiaDias) : ''));

function laudos(el) {
  const lista = DB.listar('laudos').sort((a, b) => b.numero - a.numero);
  el.innerHTML = `
    <div class="cabecalho"><h2>Laudos / Certificados</h2><div class="acoes">
      <button class="btn" id="novo-certificado">+ Certificado (modelo Berbert)</button>
      <button class="btn sec" id="novo-caixa">+ Laudo de caixa d'água</button>
      <button class="btn sec" id="novo">+ Certificado de dedetização</button></div></div>
    <div class="cartao" style="padding:0">${lista.length ? `<div class="tabela-wrap"><table><thead><tr><th>Nº</th><th>Data</th><th>Cliente</th><th>Tipo / serviço</th><th>Validade</th><th>Ações</th></tr></thead><tbody>
      ${lista.map((l) => {
        const ate = validadeLaudo(l);
        return `<tr><td>${l.numero}</td><td>${dataBR(l.data)}</td><td>${esc(nomeCliente(l.clienteId))}</td>
        <td>${l.tipo === 'certificado' ? `<span class="tag laranja">Certificado</span> ${esc(String(l.servicos || '').split('\n').filter(Boolean).join(', '))}` : l.tipo === 'caixa' ? `<span class="tag azul">Caixa d'água</span>${(l.fotos || []).length ? ` <span class="ajuda">${l.fotos.length} foto(s)</span>` : ''}` : esc(l.pragas)}</td>
        <td>${ate ? `${dataBR(ate)} ${ate < hojeISO() ? '<span class="tag cinza">vencida</span>' : '<span class="tag verde">vigente</span>'}` : '—'}</td>
        <td><div class="acoes">
          <button class="btn peq" data-acao="imprimir" data-id="${l.id}">Imprimir / PDF</button>
          <button class="btn sec peq whats" data-acao="whats" data-id="${l.id}">WhatsApp</button>
          <button class="btn sec peq" data-acao="editar" data-id="${l.id}">Editar</button>
          <button class="btn sec peq" data-acao="excluir" data-id="${l.id}">Excluir</button>
        </div></td></tr>`;
      }).join('')}
    </tbody></table></div>` : '<div class="vazio">Nenhum laudo emitido.</div>'}</div>`;
  $('#novo', el).addEventListener('click', () => formLaudo(null));
  $('#novo-caixa', el).addEventListener('click', () => irPara('laudo/novo-caixa'));
  $('#novo-certificado', el).addEventListener('click', () => irPara('laudo/novo-certificado'));
  el.querySelector('.cartao').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const l = DB.obter('laudos', b.dataset.id);
    if (b.dataset.acao === 'imprimir') enviando(b, () => imprimirLaudo(l));
    if (b.dataset.acao === 'whats') enviarLaudoWhatsApp(l, b);
    if (b.dataset.acao === 'editar') irPara('laudo/' + l.id);
    if (b.dataset.acao === 'excluir' && confirmar('Excluir este laudo?')) {
      const caminhos = (l.fotos || []).map((f) => f.caminho);
      DB.remover('laudos', l.id);
      if (caminhos.length) DB.removerFotos(caminhos).catch(() => {});
      render();
    }
  });
}

/* ---------- Página do laudo ---------- */
function paginaLaudo(el, id) {
  const novo = id === 'novo' || id === 'novo-caixa' || id === 'novo-certificado';
  const l = novo ? null : DB.obter('laudos', id);
  if (!novo && !l) {
    el.innerHTML = '<div class="cartao"><p>Laudo não encontrado.</p><button class="btn sec" id="voltar">Voltar</button></div>';
    $('#voltar', el).addEventListener('click', () => irPara('laudos'));
    return;
  }
  if (id === 'novo-certificado' || (l && l.tipo === 'certificado')) formCertificado(el, l);
  else if (id === 'novo-caixa' || (l && l.tipo === 'caixa')) formCaixa(el, l);
  else formDedetizacao(el, l, novo ? padraoNovoLaudo : {});
  padraoNovoLaudo = {};
}
function topoLaudo(titulo, l) {
  return `<div class="pagina-topo"><button class="btn sec peq" id="voltar">&lsaquo; Laudos</button><h2>${titulo}</h2>
    ${l ? `<div class="acoes" style="margin-left:auto"><button class="btn peq" id="imp-laudo">Imprimir / PDF</button>
      <button class="btn sec peq whats" id="whats-laudo">Enviar pelo WhatsApp</button></div>` : ''}</div>`;
}
async function salvarLaudo(dados, l, laudoId) {
  const numero = l ? l.numero : await DB.proximoNumero('laudo');
  return DB.salvarItem('laudos', { ...(l ? {} : { criadoEm: new Date().toISOString() }), ...dados, id: laudoId, numero });
}

function formDedetizacao(el, l, padrao) {
  const cfg = DB.config();
  const x = l || { data: hojeISO(), garantiaDias: 90, responsavel: cfg.responsavelTecnico, registroResp: cfg.registroResp,
    recomendacoesLista: RECOMENDACOES_DEDET.slice(0, 3), ...padrao };
  const pr = x.pragasLista ? { marcados: x.pragasLista, outros: x.pragasOutras || '' } : separarTexto(x.pragas, PRAGAS_LAUDO);
  const ar = x.areasLista ? { marcados: x.areasLista, outros: x.areasOutras || '' } : separarTexto(x.areas, AREAS_LAUDO);
  const me = x.metodosLista ? { marcados: x.metodosLista, outros: x.metodoOutros || '' } : separarTexto(x.metodo, METODOS_LAUDO);
  const usados = Object.fromEntries((x.produtos || []).map((p) => [normalizar(p.produto), p]));
  const recs = x.recomendacoesLista || separarTexto(x.recomendacoes, RECOMENDACOES_DEDET).marcados;
  el.innerHTML = `${topoLaudo(l ? `Certificado de dedetização nº ${l.numero}` : 'Novo certificado de dedetização', l)}
    <form class="cartao form" id="form-laudo">
      ${campoCliente(x.clienteId)}
      ${campo('Data da execução', 'data', x.data, 'date', 'required')}
      <label>Garantia<select name="garantiaDias">${opcoesSimples(GARANTIAS, x.garantiaDias)}</select></label>
      <div class="full secao-form"><b>Pragas alvo</b>${grupoMarcar('pragas', PRAGAS_LAUDO, pr.marcados)}
        ${campo('Outras pragas', 'pragasOutras', pr.outros, 'text', 'placeholder="Opcional"')}</div>
      <div class="full secao-form"><b>Áreas tratadas</b>${grupoMarcar('areas', AREAS_LAUDO, ar.marcados)}
        ${campo('Outras áreas', 'areasOutras', ar.outros, 'text', 'placeholder="Opcional"')}</div>
      <div class="full secao-form"><b>Método de aplicação</b>${grupoMarcar('metodos', METODOS_LAUDO, me.marcados)}
        ${campo('Outro método', 'metodoOutros', me.outros, 'text', 'placeholder="Opcional"')}</div>
      <div class="full secao-form"><b>Produtos utilizados</b>
        <div class="produtos-laudo">${FAES.PRODUTOS.map((p) => { const u = usados[normalizar(p.nome)]; return `
          <div class="produto-laudo"><label class="opcao-marcar"><input type="checkbox" data-produto="${p.id}" ${u ? 'checked' : ''}>
            <span><b>${esc(p.nome)}</b> <small>${esc(p.grupo)} · ${esc(p.concentracao)}</small></span></label>
            <input data-qtd="${p.id}" value="${esc(u ? u.quantidade : '')}" placeholder="Quantidade / diluição (opcional)"></div>`; }).join('')}</div></div>
      <label>Responsável técnico${seletorPessoa('responsavel', 'responsavel_tecnico', x.responsavel)}</label>
      <div class="full secao-form"><b>Recomendações ao cliente</b>${grupoMarcar('recomendacoes', RECOMENDACOES_DEDET, recs, 'uma-coluna')}</div>
      ${campo('Observações', 'obs', x.obs, 'textarea', 'full')}
      <div class="form-acoes"><button type="button" class="btn sec" id="cancelar">Cancelar</button><button class="btn" id="salvar">Salvar</button></div>
    </form>`;
  const form = $('#form-laudo', el);
  ligarCampoCliente(el);
  $('#voltar', el).addEventListener('click', () => irPara('laudos'));
  $('#cancelar', el).addEventListener('click', () => irPara('laudos'));
  if (l) {
    $('#imp-laudo', el).addEventListener('click', (e) => enviando(e.target, () => imprimirLaudo(DB.obter('laudos', l.id))));
    $('#whats-laudo', el).addEventListener('click', (e) => enviarLaudoWhatsApp(DB.obter('laudos', l.id), e.target));
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!clienteValido(form)) return;
    const d = lerForm(form);
    const pragasLista = lerGrupo(form, 'pragas'), areasLista = lerGrupo(form, 'areas'), metodosLista = lerGrupo(form, 'metodos');
    const produtosSel = FAES.PRODUTOS.filter((p) => $(`[data-produto="${p.id}"]`, form).checked);
    const recomendacoesLista = lerGrupo(form, 'recomendacoes');
    const dados = {
      tipo: 'dedetizacao', clienteId: d.clienteId, data: d.data, garantiaDias: Number(d.garantiaDias) || 0,
      pragasLista, pragasOutras: d.pragasOutras, pragas: juntar(pragasLista, d.pragasOutras),
      areasLista, areasOutras: d.areasOutras, areas: juntar(areasLista, d.areasOutras),
      metodosLista, metodoOutros: d.metodoOutros, metodo: juntar(metodosLista, d.metodoOutros),
      produtos: produtosSel.map((p) => ({ produto: p.nome, principio: p.concentracao, grupo: p.grupo, registro: p.registro,
        quantidade: $(`[data-qtd="${p.id}"]`, form).value.trim() })),
      antidoto: produtosSel.map((p) => `${p.nome}: ${p.antidoto}`).join('\n'),
      recomendacoesLista, recomendacoes: recomendacoesLista.join('\n'),
      responsavel: d.responsavel, registroResp: registroDe(form, 'responsavel') || (l && l.responsavel === d.responsavel ? l.registroResp : ''),
      obs: d.obs,
    };
    enviando($('#salvar', el), async () => {
      await salvarLaudo(dados, l, l ? l.id : DB.novoId());
      avisar('Laudo salvo.');
      irPara('laudos');
    });
  });
}

/* ---------- Certificado no modelo Berbert ---------- */
function formCertificado(el, l) {
  const p = certPadrao();
  const hoje = hojeISO();
  const x = l || { data: hoje, vencimento: somarMeses(hoje, 12), ...p };
  el.innerHTML = `${topoLaudo(l ? `Certificado nº ${l.numero}` : 'Novo certificado', l)}
    <form class="cartao form" id="form-cert">
      ${campoCliente(x.clienteId)}
      ${campo('Data de execução', 'data', x.data, 'date', 'required')}
      ${campo('Data de vencimento', 'vencimento', x.vencimento, 'date')}
      <h3 class="full secao">Contratante <small class="ajuda">(em branco usa os dados do cadastro do cliente)</small></h3>
      ${campo('Nome / razão social', 'contratanteNome', x.contratanteNome, 'text', 'full')}
      ${campo('CNPJ / CPF', 'contratanteDoc', x.contratanteDoc)}
      ${campo('Endereço', 'contratanteEndereco', x.contratanteEndereco)}
      <h3 class="full secao">Textos do certificado</h3>
      ${campo('Texto de abertura', 'abertura', x.abertura, 'textarea', 'full')}
      ${campo('Serviços executados (um por linha)', 'servicos', x.servicos, 'textarea', 'full')}
      ${campo('Texto das normas', 'normas', x.normas, 'textarea', 'full')}
      <div class="full secao-form"><b>Produtos (grupo químico, nome comum, antídoto, registro e emergência)</b>${editorLinhas(COLS_CERT, x.produtos || [])}</div>
      <h3 class="full secao">Responsável técnico</h3>
      ${campo('Nome', 'responsavel', x.responsavel)}
      ${campo('Formação / cargo', 'cargo', x.cargo)}
      ${campo('Registro (CREA, CRQ...)', 'registro', x.registro)}
      <h3 class="full secao">Dados da empresa no certificado</h3>
      ${campo('Licenças (topo da folha)', 'licencas', x.licencas, 'textarea', 'full')}
      ${campo('Site', 'site', x.site)}
      ${campo('Rodapé (CNPJ, IE e endereço)', 'rodape', x.rodape, 'textarea', 'full')}
      ${DB.perfil().admin ? '<label class="check full"><input type="checkbox" name="salvarPadrao"> Usar estes textos, produtos e dados como padrão nos próximos certificados</label>' : ''}
      <div class="form-acoes"><button type="button" class="btn sec" id="cancelar">Cancelar</button>
        <button type="button" class="btn sec" id="previa">Ver como fica</button><button class="btn" id="salvar">Salvar</button></div>
    </form>`;
  const form = $('#form-cert', el);
  ligarCampoCliente(el);
  ligarLinhas(form, COLS_CERT);
  $('#voltar', el).addEventListener('click', () => irPara('laudos'));
  $('#cancelar', el).addEventListener('click', () => irPara('laudos'));
  if (l) {
    $('#imp-laudo', el).addEventListener('click', (e) => enviando(e.target, () => imprimirLaudo(DB.obter('laudos', l.id))));
    $('#whats-laudo', el).addEventListener('click', (e) => enviarLaudoWhatsApp(DB.obter('laudos', l.id), e.target));
  }
  // Ao mudar a data de execução, o vencimento acompanha (um ano depois), a menos que já tenha sido mudado à mão.
  let vencManual = Boolean(l) && l.vencimento !== somarMeses(l.data, 12);
  form.vencimento.addEventListener('input', () => { vencManual = true; });
  form.data.addEventListener('change', () => { if (!vencManual && form.data.value) form.vencimento.value = somarMeses(form.data.value, 12); });
  const ler = () => {
    const d = lerForm(form);
    return { tipo: 'certificado', clienteId: d.clienteId, data: d.data, vencimento: d.vencimento,
      contratanteNome: d.contratanteNome, contratanteDoc: d.contratanteDoc, contratanteEndereco: d.contratanteEndereco,
      abertura: d.abertura, servicos: d.servicos, normas: d.normas, produtos: lerLinhas(form, COLS_CERT),
      responsavel: d.responsavel, cargo: d.cargo, registro: d.registro, licencas: d.licencas, site: d.site, rodape: d.rodape,
      salvarPadrao: d.salvarPadrao };
  };
  $('#previa', el).addEventListener('click', async () => imprimir(await documentoCertificado({ numero: l ? l.numero : '', ...ler() })));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!clienteValido(form)) return;
    const { salvarPadrao, ...dados } = ler();
    enviando($('#salvar', el), async () => {
      if (salvarPadrao) {
        const { licencas, abertura, servicos, normas, produtos, responsavel, cargo, registro, site, rodape } = dados;
        await DB.salvarConfig({ certificado: { licencas, abertura, servicos, normas, produtos, responsavel, cargo, registro, site, rodape } });
      }
      await salvarLaudo(dados, l, l ? l.id : DB.novoId());
      avisar('Certificado salvo.');
      irPara('laudos');
    });
  });
}
// Data por extenso: "02 de Dezembro de 2023".
const MESES_EXTENSO = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const dataExtenso = (iso) => (iso ? `${iso.slice(8, 10)} de ${MESES_EXTENSO[Number(iso.slice(5, 7)) - 1]} de ${iso.slice(0, 4)}` : '');
async function documentoCertificado(l) {
  const cli = DB.obter('clientes', l.clienteId) || {};
  const nome = l.contratanteNome || cli.nome || '';
  const doc = l.contratanteDoc || (cli.documento ? `${cli.tipo === 'PF' ? 'CPF' : 'CNPJ'} ${cli.documento}` : '');
  const end = l.contratanteEndereco || [cli.endereco, cli.cidade].filter(Boolean).join(' ');
  const linhas = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);
  // Formas da marca: dois losangos de cantos arredondados (laranja em cima, verde embaixo) e o encontro em verde escuro.
  const losango = (cy) => `<rect x="${-25 - 77.8}" y="${cy - 77.8}" width="155.6" height="155.6" rx="26" transform="rotate(45 -25 ${cy})"/>`;
  return `<div class="doc cert-pg"><style>@page { size: A4 landscape; margin: 0; }</style>
    <svg class="cert-formas" viewBox="0 0 297 210" preserveAspectRatio="none" aria-hidden="true">
      <defs><clipPath id="cert-clip">${losango(40)}</clipPath></defs>
      <g fill="#f15a22">${losango(40)}</g><g fill="#7ac943">${losango(162)}</g>
      <g fill="#2a5a26" clip-path="url(#cert-clip)">${losango(162)}</g>
    </svg>
    <div class="cert-titulo">Certificado</div>
    <div class="cert-conteudo">
      <div class="cert-topo"><img src="img/logo-escura.webp" alt="Berbert Pest Control" class="cert-logo">
        <div class="cert-licencas">${linhas(l.licencas).map(esc).join('<br>')}</div></div>
      <div class="cert-texto">
        <p class="cert-abertura">${esc(l.abertura)}</p>
        <ul class="cert-servicos">${linhas(l.servicos).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <p class="cert-normas">${esc(l.normas)}</p>
        <div class="cert-contratante">Contratante:<br>${esc(nome)}${doc ? ` | ${esc(doc)}` : ''}${end ? `<br>${esc(end)}` : ''}</div>
        <div class="cert-datas">Data de Execução ${dataExtenso(l.data)}${l.vencimento ? `<br>Data de Vencimento ${dataExtenso(l.vencimento)}` : ''}</div>
      </div>
      ${(l.produtos || []).length ? `<table class="cert-produtos"><thead><tr><th>GRUPO QUÍMICO</th><th>NOME COMUM</th><th>ANTÍDOTO</th><th>REG.MINISTÉRIO DA SAÚDE</th><th>EMERGÊNCIA</th></tr></thead>
        <tbody>${l.produtos.map((p) => `<tr><td>${esc(p.grupo)}</td><td>${esc(p.nome)}</td><td>${esc(p.antidoto)}</td><td>${esc(p.registro)}</td><td>${esc(p.emergencia)}</td></tr>`).join('')}</tbody></table>` : ''}
      <div class="cert-rodape">
        <div class="cert-resp">${esc(l.responsavel)}${l.cargo ? `<br>${esc(l.cargo)}` : ''}${l.registro ? `<br>${esc(l.registro)}` : ''}</div>
        <div class="cert-empresa">${l.site ? `<div class="cert-site">${esc(l.site)}</div>` : ''}${linhas(l.rodape).map(esc).join('<br>')}</div>
      </div>
    </div>
  </div>`;
}

/* ---------- Laudo de caixa d'água ---------- */
function linhaReservatorio(r = {}) {
  const capOutra = r.capacidade && !CAPACIDADES.includes(Number(r.capacidade));
  return `<div class="reservatorio">
    <label>Qtd.<select data-r="quantidade">${opcoesSimples([1, 2, 3, 4, 5, 6, 8, 10], r.quantidade || 1)}</select></label>
    <label>Tipo<select data-r="tipo">${opcoesSimples(TIPOS_RESERV, r.tipo)}</select></label>
    <label>Material<select data-r="material">${opcoesSimples(MATERIAIS_RESERV, r.material)}</select></label>
    <label>Capacidade<select data-r="capacidade">${opcoesSimples([...CAPACIDADES.map((c) => [c, c.toLocaleString('pt-BR') + ' L']), ['outra', 'Outra...']], capOutra ? 'outra' : (r.capacidade || 1000))}</select>
      <input data-r="capacidadeOutra" type="number" min="1" placeholder="Litros" value="${capOutra ? esc(r.capacidade) : ''}" ${capOutra ? '' : 'hidden'}></label>
    <label>Localização<select data-r="local">${opcoesSimples(LOCAIS_RESERV, r.local)}</select></label>
    <button type="button" class="btn sec peq rm-reserv" title="Remover">&times;</button></div>`;
}
function lerReservatorios(raiz) {
  return $$('.reservatorio', raiz).map((d) => {
    const v = (k) => $(`[data-r="${k}"]`, d).value;
    return { quantidade: Number(v('quantidade')) || 1, tipo: v('tipo'), material: v('material'),
      capacidade: v('capacidade') === 'outra' ? (Number(v('capacidadeOutra')) || 0) : Number(v('capacidade')), local: v('local') };
  });
}

// Reduz a foto (no máximo 1600 px, JPEG) antes de enviar: fica leve e rápida de abrir.
async function comprimirFoto(arquivo) {
  const img = await createImageBitmap(arquivo);
  const escala = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * escala);
  c.height = Math.round(img.height * escala);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.8));
  return blob;
}

function formCaixa(el, l) {
  const cfg = DB.config();
  const laudoId = l ? l.id : DB.novoId();
  const x = l || { data: hojeISO(), validadeMeses: 6, reservatorios: [{}],
    desinfetante: DESINFETANTES[0], concentracaoSol: CONCENTRACOES_SOL[2], tempoContato: TEMPOS_CONTATO[2],
    responsavel: cfg.responsavelTecnico, registroResp: cfg.registroResp, fotos: [] };
  const fotos = (x.fotos || []).map((f) => ({ ...f }));
  const enviadasAgora = []; // fotos enviadas nesta edição (apagadas se cancelar)
  const removidas = []; // fotos tiradas nesta edição (apagadas ao salvar)
  let enviando_ = 0;

  el.innerHTML = `${topoLaudo(l ? `Laudo de caixa d'água nº ${l.numero}` : "Novo laudo de limpeza de caixa d'água", l)}
    <form class="cartao form" id="form-laudo">
      ${campoCliente(x.clienteId)}
      ${campo('Data da limpeza', 'data', x.data, 'date', 'required')}
      <label>Validade (próxima limpeza)<select name="validadeMeses">${opcoesSimples(VALIDADES_CAIXA, x.validadeMeses)}</select></label>
      <div class="full secao-form"><b>Reservatórios limpos</b>
        <div id="reservatorios">${(x.reservatorios && x.reservatorios.length ? x.reservatorios : [{}]).map(linhaReservatorio).join('')}</div>
        <button type="button" class="btn sec peq" id="add-reserv">+ Adicionar reservatório</button></div>
      <div class="full secao-form"><b>Condições encontradas</b>${grupoMarcar('condicoes', CONDICOES_CAIXA, x.condicoes || [])}</div>
      <label>Produto desinfetante (escolha ou digite)<input name="desinfetante" list="lista-desinf" value="${esc(x.desinfetante || '')}" autocomplete="off">
        <datalist id="lista-desinf">${DESINFETANTES.map((o) => `<option value="${esc(o)}">`).join('')}</datalist></label>
      <label>Concentração da solução (escolha ou digite)<input name="concentracaoSol" list="lista-conc" value="${esc(x.concentracaoSol || '')}" autocomplete="off">
        <datalist id="lista-conc">${CONCENTRACOES_SOL.map((o) => `<option value="${esc(o)}">`).join('')}</datalist></label>
      <label>Tempo de contato (escolha ou digite)<input name="tempoContato" list="lista-tempo" value="${esc(x.tempoContato || '')}" autocomplete="off">
        <datalist id="lista-tempo">${TEMPOS_CONTATO.map((o) => `<option value="${esc(o)}">`).join('')}</datalist></label>
      <label>Técnico que executou${seletorPessoa('tecnico', 'controlador', x.tecnico)}</label>
      <label>Responsável técnico${seletorPessoa('responsavel', 'responsavel_tecnico', x.responsavel)}</label>
      <div class="full secao-form"><b>Fotos</b>
        <p class="ajuda">Pode tirar a foto pelo celular ou escolher do computador. As fotos são reduzidas automaticamente.</p>
        <div class="fotos-etapas">
          ${['antes', 'depois'].map((etapa) => `<div class="fotos-etapa"><div class="fotos-cab"><b>${etapa === 'antes' ? 'Antes da limpeza' : 'Depois da limpeza'}</b>
            <label class="btn sec peq">Adicionar fotos<input type="file" accept="image/*" multiple hidden data-etapa="${etapa}"></label></div>
            <div class="fotos-grade" data-grade="${etapa}"></div></div>`).join('')}
        </div></div>
      ${campo('Observações', 'obs', x.obs, 'textarea', 'full')}
      <div class="form-acoes"><button type="button" class="btn sec" id="cancelar">Cancelar</button><button class="btn" id="salvar">Salvar</button></div>
    </form>`;
  const form = $('#form-laudo', el);
  ligarCampoCliente(el);
  const sair = async () => {
    if (enviando_) { avisar('Aguarde terminar de enviar as fotos.', 'erro'); return; }
    if (enviadasAgora.length) DB.removerFotos(enviadasAgora.map((f) => f.caminho)).catch(() => {});
    irPara('laudos');
  };
  $('#voltar', el).addEventListener('click', sair);
  $('#cancelar', el).addEventListener('click', sair);
  if (l) {
    $('#imp-laudo', el).addEventListener('click', (e) => enviando(e.target, () => imprimirLaudo(DB.obter('laudos', l.id))));
    $('#whats-laudo', el).addEventListener('click', (e) => enviarLaudoWhatsApp(DB.obter('laudos', l.id), e.target));
  }

  // Reservatórios
  const caixaReserv = $('#reservatorios', el);
  $('#add-reserv', el).addEventListener('click', () => caixaReserv.insertAdjacentHTML('beforeend', linhaReservatorio()));
  caixaReserv.addEventListener('click', (e) => {
    if (e.target.classList.contains('rm-reserv') && $$('.reservatorio', caixaReserv).length > 1) e.target.closest('.reservatorio').remove();
  });
  caixaReserv.addEventListener('change', (e) => {
    if (e.target.dataset.r === 'capacidade') {
      const outra = $('[data-r="capacidadeOutra"]', e.target.closest('label'));
      outra.hidden = e.target.value !== 'outra';
      if (!outra.hidden) outra.focus();
    }
  });

  // Fotos
  const desenharFotos = () => {
    ['antes', 'depois'].forEach((etapa) => {
      const lista = fotos.filter((f) => f.etapa === etapa);
      $(`[data-grade="${etapa}"]`, el).innerHTML = lista.length ? lista.map((f) => `<figure class="foto-item" data-caminho="${esc(f.caminho)}">
        ${f.url ? `<img src="${esc(f.url)}" alt="">` : '<div class="foto-carregando">Carregando...</div>'}
        <input data-legenda value="${esc(f.legenda || '')}" placeholder="Legenda (opcional)">
        <button type="button" class="btn sec peq" data-tirar title="Remover foto">Remover</button></figure>`).join('')
        : '<p class="ajuda">Nenhuma foto.</p>';
    });
  };
  desenharFotos();
  if (fotos.length) {
    DB.urlsFotos(fotos.map((f) => f.caminho)).then((urls) => { fotos.forEach((f) => (f.url = urls[f.caminho] || '')); desenharFotos(); })
      .catch((err) => avisar('Não foi possível mostrar as fotos: ' + err.message, 'erro'));
  }
  el.addEventListener('input', (e) => {
    if (!e.target.matches('[data-legenda]')) return;
    const f = fotos.find((y) => y.caminho === e.target.closest('[data-caminho]').dataset.caminho);
    if (f) f.legenda = e.target.value;
  });
  el.addEventListener('click', (e) => {
    if (!e.target.matches('[data-tirar]')) return;
    const caminho = e.target.closest('[data-caminho]').dataset.caminho;
    const i = fotos.findIndex((f) => f.caminho === caminho);
    if (i >= 0) removidas.push(...fotos.splice(i, 1));
    desenharFotos();
  });
  $$('[data-etapa]', el).forEach((input) => input.addEventListener('change', async () => {
    const arquivos = [...input.files];
    input.value = '';
    const salvar = $('#salvar', el);
    for (const [i, arq] of arquivos.entries()) {
      enviando_++;
      salvar.disabled = true;
      salvar.textContent = `Enviando foto ${i + 1} de ${arquivos.length}...`;
      try {
        const blob = await comprimirFoto(arq);
        const caminho = `laudos/${laudoId}/${DB.novoId()}.jpg`;
        await DB.enviarFoto(caminho, blob);
        const f = { caminho, etapa: input.dataset.etapa, legenda: '', url: URL.createObjectURL(blob) };
        fotos.push(f);
        enviadasAgora.push(f);
        desenharFotos();
      } catch (err) {
        avisar('A foto não foi enviada: ' + err.message, 'erro');
      } finally {
        enviando_--;
        if (!enviando_) { salvar.disabled = false; salvar.textContent = 'Salvar'; }
      }
    }
  }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (enviando_) { avisar('Aguarde terminar de enviar as fotos.', 'erro'); return; }
    if (!clienteValido(form)) return;
    const d = lerForm(form);
    const reservatorios = lerReservatorios(el);
    if (reservatorios.some((r) => !r.capacidade)) { avisar('Informe a capacidade do reservatório (em litros).', 'erro'); return; }
    const dados = {
      tipo: 'caixa', clienteId: d.clienteId, data: d.data, validadeMeses: Number(d.validadeMeses) || 6,
      reservatorios, condicoes: lerGrupo(form, 'condicoes'),
      desinfetante: d.desinfetante, concentracaoSol: d.concentracaoSol, tempoContato: d.tempoContato,
      tecnico: d.tecnico, responsavel: d.responsavel,
      registroResp: registroDe(form, 'responsavel') || (l && l.responsavel === d.responsavel ? l.registroResp : ''),
      obs: d.obs,
      pragas: "Limpeza e desinfecção de reservatório",
      fotos: fotos.map(({ caminho, etapa, legenda }) => ({ caminho, etapa, legenda: legenda || '' })),
    };
    enviando($('#salvar', el), async () => {
      await salvarLaudo(dados, l, laudoId);
      if (removidas.length) DB.removerFotos(removidas.map((f) => f.caminho)).catch(() => {});
      avisar('Laudo salvo.');
      irPara('laudos');
    });
  });
}

/* ---------- Impressão ---------- */
async function imprimirLaudo(l) {
  imprimir(await documentoLaudo(l));
}
// HTML do laudo (o mesmo para imprimir e para o PDF do WhatsApp).
async function documentoLaudo(l) {
  if (l.tipo === 'certificado') return documentoCertificado(l);
  if (l.tipo === 'caixa') return documentoCaixa(l);
  const cli = DB.obter('clientes', l.clienteId);
  const cfg = DB.config();
  const recs = l.recomendacoesLista || String(l.recomendacoes || '').split('\n').filter(Boolean);
  return `<div class="doc">${cabecalhoDoc()}
    <h2>Certificado de Execução de Serviço nº ${l.numero}</h2>
    <div class="info"><div><b>Data da execução:</b> ${dataBR(l.data)}</div>
      <div><b>Garantia:</b> ${l.garantiaDias ? `${l.garantiaDias} dias (até ${dataBR(somarDias(l.data, l.garantiaDias))})` : '—'}</div></div>
    ${blocoCliente(cli)}
    <h3>Serviço executado</h3>
    <div class="info"><div><b>Pragas alvo:</b> ${esc(l.pragas)}</div><div><b>Método:</b> ${esc(l.metodo)}</div>
      <div style="grid-column:1/-1"><b>Áreas tratadas:</b> ${esc(l.areas)}</div></div>
    <h3>Produtos utilizados</h3>
    ${(l.produtos || []).length ? `<table><thead><tr><th>Produto</th><th>Princípio ativo / concentração</th><th>Grupo químico</th><th>Registro MS</th><th>Qtd / diluição</th></tr></thead><tbody>
      ${l.produtos.map((p) => `<tr><td>${esc(p.produto)}</td><td>${esc(p.principio)}</td><td>${esc(p.grupo)}</td><td>${esc(p.registro)}</td><td>${esc(p.quantidade)}</td></tr>`).join('')}
    </tbody></table>` : '<p>—</p>'}
    ${l.antidoto ? `<h3>Antídoto / tratamento</h3><p style="white-space:pre-line">${esc(l.antidoto)}</p>` : ''}
    <p><b>Em caso de intoxicação:</b> procure atendimento médico levando este certificado. Telefone: ${esc(cfg.telefoneIntoxicacao || '0800-771-3733')}.</p>
    ${recs.length ? `<h3>Recomendações</h3><ul>${recs.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
    ${l.obs ? `<h3>Observações</h3><p style="white-space:pre-line">${esc(l.obs)}</p>` : ''}
    <div class="assinatura">
      <div>${esc(l.responsavel || cfg.responsavelTecnico || 'Responsável técnico')}<br>${esc(l.registroResp || '')}</div>
      <div>${esc(cli ? cli.nome : 'Cliente')}</div>
    </div>
  </div>`;
}

async function documentoCaixa(l) {
  const cli = DB.obter('clientes', l.clienteId) || {};
  const cfg = DB.config();
  const fotos = l.fotos || [];
  let urls = {};
  if (fotos.length) urls = await DB.urlsFotos(fotos.map((f) => f.caminho));
  const total = (l.reservatorios || []).reduce((s, r) => s + (r.quantidade || 1) * (r.capacidade || 0), 0);
  const blocoFotos = (etapa, titulo) => {
    const lista = fotos.filter((f) => f.etapa === etapa && urls[f.caminho]);
    return `<div class="fotos-laudo-col"><div class="fotos-laudo-tit">${titulo}</div><div class="fotos-laudo-grade">${lista.length ? lista.map((f) => `<figure>
      <img src="${esc(urls[f.caminho])}" alt="">${f.legenda ? `<figcaption>${esc(f.legenda)}</figcaption>` : ''}</figure>`).join('') : '<p>—</p>'}</div></div>`;
  };
  const desinfeccao = [l.desinfetante, l.concentracaoSol, l.tempoContato && 'contato de ' + l.tempoContato].filter(Boolean).join(' · ');
  return `<div class="doc laudo-caixa">${cabecalhoDoc()}
    <h2>Laudo de Limpeza e Desinfecção de Reservatório nº ${l.numero}</h2>
    <div class="info">
      <div><b>Cliente:</b> ${esc(cli.codigo ? cli.codigo + ' - ' : '')}${esc(cli.nome || '')}</div>
      <div><b>Cidade:</b> ${esc(cli.cidade || '')}</div>
      <div style="grid-column:1/-1"><b>Endereço:</b> ${esc([cli.endereco, cli.bairro].filter(Boolean).join(', '))}</div>
      <div><b>Data da limpeza:</b> ${dataBR(l.data)}</div>
      <div><b>Próxima limpeza:</b> ${dataBR(somarMeses(l.data, Number(l.validadeMeses) || 6))}</div>
    </div>
    <h3>Reservatórios</h3>
    <p>${(l.reservatorios || []).map((r) => `${r.quantidade || 1}x ${esc(r.tipo)} de ${Number(r.capacidade || 0).toLocaleString('pt-BR')} L`).join(' · ')}
      — <b>volume total: ${total.toLocaleString('pt-BR')} litros</b></p>
    ${desinfeccao ? `<p><b>Desinfecção:</b> ${esc(desinfeccao)}</p>` : ''}
    ${(l.condicoes || []).length ? `<p><b>Condições encontradas:</b> ${l.condicoes.map(esc).join(', ')}</p>` : ''}
    ${l.obs ? `<p><b>Observações:</b> ${esc(l.obs)}</p>` : ''}
    ${fotos.length ? `<h3>Registro fotográfico</h3><div class="fotos-laudo">${blocoFotos('antes', 'ANTES')}${blocoFotos('depois', 'DEPOIS')}</div>` : ''}
    <p class="laudo-conclusao">Certificamos que o(s) reservatório(s) acima foi(ram) limpo(s) e desinfetado(s) por
      ${esc(cfg.empresa || 'Dedetizadora Berbert')} na data indicada.${l.responsavel ? ` Responsável técnico: ${esc(l.responsavel)}${l.registroResp ? ' (' + esc(l.registroResp) + ')' : ''}.` : ''}</p>
  </div>`;
}

/* ---------- Enviar pelo WhatsApp ---------- */
// Gera o PDF do laudo. No celular abre o compartilhamento (escolhe o WhatsApp e o PDF vai anexado);
// no computador baixa o PDF e abre a conversa com o cliente, com a mensagem pronta, para anexar o arquivo.
let carregandoPdf = null;
function carregarGeradorPdf() {
  if (window.html2pdf) return Promise.resolve();
  carregandoPdf = carregandoPdf || new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = 'js/vendor/html2pdf.bundle.min.js';
    s.onload = ok;
    s.onerror = () => { carregandoPdf = null; falha(new Error('não foi possível carregar o gerador de PDF.')); };
    document.head.appendChild(s);
  });
  return carregandoPdf;
}
async function gerarPdfLaudo(l) {
  await carregarGeradorPdf();
  const caixa = document.createElement('div');
  caixa.className = 'pdf-temporario';
  caixa.innerHTML = await documentoLaudo(l);
  document.body.appendChild(caixa);
  try {
    await Promise.all($$('img', caixa).map((img) => (img.complete ? null : new Promise((ok) => { img.onload = img.onerror = ok; }))));
    return await window.html2pdf().set({
      margin: l.tipo === 'certificado' ? 0 : [8, 8, 8, 8], image: { type: 'jpeg', quality: 0.9 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: l.tipo === 'certificado' ? 'landscape' : 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['figure', 'tr', '.info'] },
    }).from($('.doc', caixa)).outputPdf('blob');
  } finally {
    caixa.remove();
  }
}
async function enviarLaudoWhatsApp(l, botao) {
  const cli = DB.obter('clientes', l.clienteId) || {};
  const nomeArq = `${l.tipo === 'certificado' ? 'Certificado' : 'Laudo'} ${l.numero} - ${String(cli.nome || 'cliente').replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 60)}.pdf`;
  const servico = l.tipo === 'certificado' ? String(l.servicos || 'serviço').split('\n').filter(Boolean).join(' e ').toLowerCase()
    : l.tipo === 'caixa' ? "limpeza e desinfecção de caixa d'água" : 'dedetização';
  const proxima = l.tipo === 'caixa' ? ` Próxima limpeza: ${dataBR(somarMeses(l.data, Number(l.validadeMeses) || 6))}.` : '';
  const msg = `Olá, ${cli.contato || cli.fantasia || cli.nome || ''}! Segue o ${l.tipo === 'certificado' ? 'certificado' : 'laudo'} nº ${l.numero} da ${servico} realizada em ${dataBR(l.data)}.${proxima} `
    + `${DB.config().empresa || 'Dedetizadora Berbert'}.`;
  const texto = botao.textContent;
  botao.disabled = true;
  botao.textContent = 'Gerando PDF...';
  try {
    const blob = await gerarPdfLaudo(l);
    const arquivo = new File([blob], nomeArq, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo], text: msg, title: nomeArq });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // a pessoa fechou a tela de compartilhar
      }
    }
    // Computador: baixa o PDF e abre a conversa do cliente com a mensagem.
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nomeArq;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    const fones = extrairTelefones(cli.telefone);
    const celular = fones.find((f) => f.numero.length === 11) || fones[0];
    window.open(celular ? linkWhats(celular.numero, msg) : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    avisar(`O PDF "${nomeArq}" foi baixado. No WhatsApp, clique no clipe (anexar) e escolha o arquivo.`, 'ok', 9000);
  } catch (err) {
    avisar('Não foi possível gerar o PDF: ' + err.message, 'erro');
  } finally {
    botao.disabled = false;
    botao.textContent = texto;
  }
}
