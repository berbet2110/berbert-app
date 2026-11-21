# Berbert Pest Control — sistema de gestão

Aplicativo web (PWA instalável) da Dedetizadora Berbert, em JavaScript puro com Supabase (PostgreSQL, autenticação,
armazenamento de fotos e regras de acesso por usuário).

## Módulos

- **Painel**: resumo do dia, serviços que mais saem, contas a pagar e a receber.
- **Clientes**: cadastro, ficha com histórico e anotações, importação de planilha, junção de repetidos.
- **Agenda** de atendimentos.
- **Ordens de Serviço**: situação Em Execução / Finalizado / Cancelado, impressão FAES, link para o técnico
  preencher pelo celular (`os.html`) com assinatura do cliente, importação de planilha.
- **Laudos**: certificado de dedetização e laudo de limpeza de caixa d'água com fotos de antes e depois,
  PDF e envio pelo WhatsApp.
- **Financeiro**: receitas e despesas, avisos de contas a vencer e importação de extrato bancário (OFX/CSV).
- **Ligações**: clientes com serviço a vencer e prospecção de empresas por cidade e ramo.
- **Cadastros**: serviços, produtos e colaboradores, com códigos automáticos e importação de planilha.
- **Funcionários**: acesso de cada pessoa por módulo.
- Tema claro e escuro no cabeçalho.

## Arquivos

- `index.html`, `css/style.css`, `js/*.js`: o aplicativo. `js/config.js` tem a URL e a chave pública do Supabase.
- `os.html` + `js/os.js`: página do técnico (link da ordem de serviço).
- `sw.js`, `manifest.json`, `versao.json`: instalação como app e aviso de nova versão.
- `supabase/*.sql`: tabelas, regras de acesso e funções. Execute no SQL Editor do Supabase
  (`schema.sql` primeiro, depois os demais).

## Publicar

É um site estático: basta servir a pasta (Vercel, GitHub Pages ou qualquer hospedagem). A cada mudança,
atualize `VERSAO_APP` em `js/app.js`, `versao.json` e o nome do cache em `sw.js`.
