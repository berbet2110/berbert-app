-- Nota fiscal: cofre do certificado digital A1.
-- O arquivo .pfx fica numa pasta privada SEM regras de acesso (só as funções do servidor leem e gravam).
-- A senha fica criptografada numa tabela também sem regras de acesso. O sistema só lê o resumo
-- (titular, CNPJ, validade), guardado em config 'certificado_info'.
-- Execute este arquivo inteiro no SQL Editor do Supabase (pode rodar mais de uma vez).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certificados', 'certificados', false, 102400, null)
on conflict (id) do nothing;

create table if not exists public.fiscal_segredos (
  chave text primary key, valor text not null, atualizado_em timestamptz not null default now()
);
alter table public.fiscal_segredos enable row level security;
-- (sem policies: nenhum usuário lê ou grava; só o servidor com a chave de serviço)

-- ============================================================
-- FIM DO ARQUIVO. Se esta linha aparece no editor, o texto foi copiado inteiro.
-- ============================================================
