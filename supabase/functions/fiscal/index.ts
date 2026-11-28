// Nota fiscal (servidor). Por enquanto: cofre do certificado digital A1.
//   { acao: 'certificado-info' }                          -> resumo do certificado guardado (qualquer usuário ativo)
//   { acao: 'certificado-enviar', pfx: base64, senha }    -> valida e guarda o certificado (só administrador)
// O .pfx fica na pasta privada "certificados" e a senha criptografada (AES-GCM com o segredo FISCAL_CHAVE)
// na tabela fiscal_segredos; nenhum dos dois volta para o navegador.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import forge from 'npm:node-forge@1.3.1';

const URL_SB = Deno.env.get('SUPABASE_URL')!;
const SERVICO = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(URL_SB, SERVICO, { auth: { persistSession: false } });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const resposta = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// Quem está chamando (pelo login do sistema) e se é administrador ativo.
async function usuarioDe(req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  if (!data?.user) return null;
  const { data: perfil } = await admin.from('perfis').select('admin, ativo').eq('id', data.user.id).single();
  return perfil && perfil.ativo ? { id: data.user.id, admin: perfil.admin } : null;
}

async function chaveAes() {
  const bruto = Uint8Array.from(atob(Deno.env.get('FISCAL_CHAVE')!), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', bruto, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function cifrar(texto: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const dados = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await chaveAes(), new TextEncoder().encode(texto)));
  return btoa(String.fromCharCode(...iv)) + '.' + btoa(String.fromCharCode(...dados));
}

// Lê o .pfx: chave privada, certificado do titular, nome, CNPJ (e-CNPJ ICP-Brasil) e validade.
function lerPfx(bytes: Uint8Array, senha: string) {
  const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(forge.util.binary.raw.encode(bytes)), senha);
  const bags = (tipo: string) => p12.getBags({ bagType: tipo })[tipo] || [];
  const chave = bags(forge.pki.oids.pkcs8ShroudedKeyBag)[0] || bags(forge.pki.oids.keyBag)[0];
  if (!chave) throw new Error('O arquivo não tem a chave privada do certificado.');
  const certs = bags(forge.pki.oids.certBag).map((b: { cert: forge.pki.Certificate }) => b.cert);
  // O certificado do titular é o que combina com a chave privada.
  const pub = forge.pki.setRsaPublicKey(chave.key.n, chave.key.e);
  const titular = certs.find((c: forge.pki.Certificate) => forge.pki.publicKeyToPem(c.publicKey) === forge.pki.publicKeyToPem(pub)) || certs[0];
  const cn = String(titular.subject.getField('CN')?.value || '');
  // e-CNPJ: o CNPJ vem no CN ("RAZAO SOCIAL:00000000000000") ou no campo OID 2.16.76.1.3.3.
  let cnpj = (cn.match(/:(\d{14})$/) || [])[1] || '';
  if (!cnpj) {
    const der = forge.asn1.toDer(forge.pki.certificateToAsn1(titular)).getBytes();
    const oid = forge.asn1.oidToDer('2.16.76.1.3.3').getBytes();
    const i = der.indexOf(oid);
    if (i >= 0) cnpj = (der.slice(i, i + 60).match(/\d{14}/) || [])[0] || '';
  }
  return {
    nome: cn.replace(/:\d{11,14}$/, ''), cnpj,
    validoDe: titular.validity.notBefore.toISOString(), validoAte: titular.validity.notAfter.toISOString(),
    emissor: String(titular.issuer.getField('CN')?.value || ''),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const quem = await usuarioDe(req);
    if (!quem) return resposta({ erro: 'Faça login no sistema.' }, 401);
    const corpo = await req.json().catch(() => ({}));

    if (corpo.acao === 'certificado-info') {
      const { data } = await admin.from('config').select('valor').eq('chave', 'certificado_info').maybeSingle();
      return resposta({ certificado: data?.valor || null });
    }

    if (corpo.acao === 'certificado-enviar') {
      if (!quem.admin) return resposta({ erro: 'Só o administrador pode enviar o certificado.' }, 403);
      const senha = String(corpo.senha || '');
      const bytes = Uint8Array.from(atob(String(corpo.pfx || '')), (c) => c.charCodeAt(0));
      if (!bytes.length || bytes.length > 100_000) return resposta({ erro: 'Arquivo de certificado inválido.' }, 400);
      let info;
      try { info = lerPfx(bytes, senha); } catch (e) {
        const m = String(e);
        return resposta({ erro: /password|MAC|Invalid/i.test(m) ? 'Senha do certificado incorreta.' : 'Não foi possível ler o certificado: ' + m.slice(0, 160) }, 400);
      }
      if (new Date(info.validoAte) < new Date()) return resposta({ erro: `Este certificado venceu em ${info.validoAte.slice(0, 10).split('-').reverse().join('/')}.` }, 400);
      const up = await admin.storage.from('certificados').upload('a1.pfx', bytes, { upsert: true, contentType: 'application/x-pkcs12' });
      if (up.error) throw up.error;
      const seg = await admin.from('fiscal_segredos').upsert({ chave: 'senha_a1', valor: await cifrar(senha), atualizado_em: new Date().toISOString() });
      if (seg.error) throw seg.error;
      const resumo = { ...info, enviadoEm: new Date().toISOString() };
      const cfg = await admin.from('config').upsert({ chave: 'certificado_info', valor: resumo });
      if (cfg.error) throw cfg.error;
      return resposta({ certificado: resumo });
    }

    return resposta({ erro: 'Ação desconhecida.' }, 400);
  } catch (e) {
    return resposta({ erro: 'Erro no servidor: ' + String(e?.message || e).slice(0, 200) }, 500);
  }
});
