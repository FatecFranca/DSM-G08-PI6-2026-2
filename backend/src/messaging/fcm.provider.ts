// Provedor de mensagens push via Firebase Cloud Messaging (Google).
// A chave do servidor é lida de FCM_SERVER_KEY no ambiente; enquanto a chave
// não estiver configurada, o provedor opera em modo simulado (log local),
// mantendo o restante do sistema funcional para demonstração.
// Para ativar: defina FCM_SERVER_KEY no .env da API — nenhuma alteração de
// código é necessária.

const FCM_ENDPOINT = 'https://fcm.googleapis.com/fcm/send';

export interface MensagemPush {
  titulo: string;
  corpo: string;
  dados?: Record<string, unknown>;
}

export interface ResultadoEnvio {
  entregue: boolean;
  provedor: 'fcm' | 'simulado';
  detalhe?: string;
}

export function chaveConfigurada(): boolean {
  return Boolean(process.env.FCM_SERVER_KEY);
}

export async function enviarPush(tokenDispositivo: string, mensagem: MensagemPush): Promise<ResultadoEnvio> {
  const chave = process.env.FCM_SERVER_KEY;
  if (!chave) {
    console.log(`[PUSH simulado] ${mensagem.titulo} :: ${mensagem.corpo} (token ${tokenDispositivo.slice(0, 12)}...)`);
    return { entregue: false, provedor: 'simulado', detalhe: 'FCM_SERVER_KEY não configurada' };
  }

  try {
    const resposta = await fetch(FCM_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `key=${chave}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: tokenDispositivo,
        priority: 'high',
        notification: { title: mensagem.titulo, body: mensagem.corpo },
        data: stringifyDados(mensagem.dados)
      })
    });
    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => resposta.statusText);
      console.error(`[FCM] Erro HTTP ${resposta.status}: ${detalhe}`);
      return { entregue: false, provedor: 'fcm', detalhe: `HTTP ${resposta.status}` };
    }
    return { entregue: true, provedor: 'fcm' };
  } catch (erro) {
    console.error('[FCM] Falha de rede ao enviar push:', erro);
    return { entregue: false, provedor: 'fcm', detalhe: 'falha de rede' };
  }
}

// O protocolo FCM exige valores string no bloco "data".
function stringifyDados(dados?: Record<string, unknown>): Record<string, string> {
  if (!dados) return {};
  const saida: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(dados)) {
    saida[chave] = typeof valor === 'string' ? valor : JSON.stringify(valor);
  }
  return saida;
}
