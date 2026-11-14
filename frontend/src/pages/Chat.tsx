import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { Conversation, ChatMessage, UserProfile } from '../types';
import { MessageSquare, Send, ArrowLeft, Calendar, Paperclip, MessageCircle } from 'lucide-react';

interface ChatProps {
  onNavigate: (page: string) => void;
}

// Chat Cliente <-> Prestador: conversas vinculadas ao agendamento, com
// atualização por polling leve (recarrega a conversa aberta e a lista).
export const Chat: React.FC<ChatProps> = ({ onNavigate }) => {
  const [usuario, setUsuario] = useState<UserProfile>(api.getCurrentUser());
  const [conversas, setConversas] = useState<Conversation[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<number | null>(null);
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [contexto, setContexto] = useState<Conversation | null>(null);
  const [rascunho, setRascunho] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fimDaLista = useRef<HTMLDivElement | null>(null);

  const autenticado = Boolean(localStorage.getItem('agendou_token') && usuario.id_usuario);

  // Nome da outra parte da conversa, do ponto de vista do usuário logado
  const nomeDaOutraParte = (c: Conversation) =>
    usuario.tipo_perfil === 'Prestador' || c.id_prestador === usuario.id_usuario ? c.cliente_nome : c.prestador_nome;

  const carregarConversas = useCallback(async () => {
    try {
      const lista = await api.getConversations();
      setConversas(lista);
      setErro('');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar as conversas.');
    }
  }, []);

  const carregarMensagens = useCallback(async (idConversa: number) => {
    try {
      const resultado = await api.getMessages(idConversa);
      setMensagens(resultado.messages);
      setContexto(resultado.conversation);
      setErro('');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar as mensagens.');
    }
  }, []);

  // Ao abrir a página: carrega conversas e, se veio de um agendamento
  // (agendou_chat_alvo), abre a conversa correspondente automaticamente.
  useEffect(() => {
    if (!autenticado) return;
    const alvo = localStorage.getItem('agendou_chat_alvo');
    carregarConversas().then(() => {
      if (alvo) {
        localStorage.removeItem('agendou_chat_alvo');
        const dados = JSON.parse(alvo) as { id_agendamento: number };
        api.openConversationForAppointment(dados.id_agendamento)
          .then(idConversa => {
            setConversaAtiva(idConversa);
            carregarMensagens(idConversa);
            carregarConversas();
          })
          .catch(error => setErro(error instanceof Error ? error.message : 'Não foi possível abrir a conversa.'));
      }
    });
    const handleAuthChange = () => setUsuario(api.getCurrentUser());
    window.addEventListener('agendou_auth_changed', handleAuthChange);
    return () => window.removeEventListener('agendou_auth_changed', handleAuthChange);
  }, [autenticado, carregarConversas, carregarMensagens]);

  // Polling: mantém a conversa aberta e a lista de conversas atualizadas
  useEffect(() => {
    if (!autenticado || conversaAtiva === null) return;
    const intervalo = setInterval(() => {
      carregarMensagens(conversaAtiva);
      carregarConversas();
    }, 5000);
    return () => clearInterval(intervalo);
  }, [autenticado, conversaAtiva, carregarMensagens, carregarConversas]);

  // Rola para a última mensagem sempre que a conversa atualiza
  useEffect(() => {
    fimDaLista.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens.length]);

  const selecionarConversa = (idConversa: number) => {
    setConversaAtiva(idConversa);
    setRascunho('');
    carregarMensagens(idConversa);
  };

  const enviar = async (event: React.FormEvent) => {
    event.preventDefault();
    const texto = rascunho.trim();
    if (!texto || conversaAtiva === null || enviando) return;
    setEnviando(true);
    try {
      await api.sendMessage(conversaAtiva, texto);
      setRascunho('');
      await carregarMensagens(conversaAtiva);
      carregarConversas();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.');
    } finally {
      setEnviando(false);
    }
  };

  if (!autenticado) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white border border-stone-300 p-10 text-center space-y-4">
          <MessageSquare className="w-10 h-10 text-stone-400 mx-auto" />
          <h1 className="text-2xl text-stone-900 tracking-tight">Chat Cliente ↔ Prestador</h1>
          <p className="text-xs font-mono text-stone-500">Entre com uma conta para conversar sobre seus agendamentos.</p>
          <button
            onClick={() => onNavigate('login')}
            className="bg-stone-900 hover:bg-stone-800 text-white text-xs uppercase tracking-wider font-bold px-6 py-3 border border-stone-900 transition"
          >
            Entrar / Cadastrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      {/* Topo */}
      <div className="border-b border-stone-300 pb-6">
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Mensageria do Agendamento</span>
        <h1 className="text-3xl font-normal text-stone-900 tracking-tight mt-1">Chat Cliente ↔ Prestador</h1>
        <p className="text-xs text-stone-500 font-light mt-1">
          Conectado como: <strong>{usuario.nome}</strong> ({usuario.tipo_perfil}). Mensagens entregues via barramento de eventos.
        </p>
      </div>

      {erro && <p role="alert" className="border border-red-300 bg-red-50 p-4 text-sm text-red-800">{erro}</p>}

      <div className="grid md:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Lista de conversas */}
        <div className="bg-white border border-stone-300 divide-y divide-stone-200">
          <div className="px-4 py-3 bg-pastel-cream border-b border-stone-300">
            <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">
              Conversas ({conversas.length})
            </h2>
          </div>
          {conversas.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <MessageCircle className="w-6 h-6 text-stone-300 mx-auto" />
              <p className="text-[11px] font-mono text-stone-400 leading-relaxed">
                Nenhuma conversa ainda.<br />Abra o chat a partir de um agendamento no Painel.
              </p>
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-[10px] font-mono font-bold uppercase tracking-wider bg-pastel-sand hover:bg-stone-200 text-stone-800 px-4 py-2 border border-stone-300"
              >
                Ver Agendamentos
              </button>
            </div>
          ) : (
            conversas.map(c => {
              const ativa = c.id_conversa === conversaAtiva;
              return (
                <button
                  key={c.id_conversa}
                  onClick={() => selecionarConversa(c.id_conversa)}
                  className={`w-full text-left px-4 py-4 space-y-1.5 transition ${ativa ? 'bg-pastel-sage/60' : 'hover:bg-pastel-cream/60'}`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 truncate">{nomeDaOutraParte(c)}</span>
                    {(c.total_nao_lidas ?? 0) > 0 && (
                      <span className="flex-shrink-0 bg-pastel-peach text-pastel-peach-dark px-1.5 py-0.5 text-[9px] font-mono font-bold border border-pastel-peach-dark/30">
                        {c.total_nao_lidas} nova{c.total_nao_lidas! > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-stone-500 truncate">{c.servico_titulo}</p>
                  {c.texto && (
                    <p className="text-[11px] text-stone-600 truncate">
                      {c.texto}
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-stone-400">
                    {api.extrairData(c.data_hora_inicio)} · {api.extrairHora(c.data_hora_inicio)}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Thread de mensagens */}
        <div className="bg-white border border-stone-300 flex flex-col min-h-[520px]">
          {conversaAtiva === null ? (
            <div className="flex-grow flex flex-col items-center justify-center p-10 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-stone-300" />
              <p className="text-xs font-mono text-stone-400">Selecione uma conversa para começar.</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho da conversa */}
              <div className="px-6 py-4 border-b border-stone-200 bg-pastel-cream flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 truncate">
                    {contexto ? nomeDaOutraParte(contexto) : 'Carregando...'}
                  </h2>
                  <p className="text-[11px] font-mono text-stone-500 flex items-center mt-0.5">
                    <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                    {contexto
                      ? `${contexto.servico_titulo} · ${api.extrairData(contexto.data_hora_inicio)} às ${api.extrairHora(contexto.data_hora_inicio)} · ${contexto.agendamento_status}`
                      : ''}
                  </p>
                </div>
                <button
                  onClick={() => { setConversaAtiva(null); setContexto(null); }}
                  className="md:hidden flex-shrink-0 text-stone-500 hover:text-stone-800 p-2 border border-stone-300"
                  title="Voltar para a lista"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Mensagens */}
              <div className="flex-grow overflow-y-auto px-6 py-4 space-y-3 bg-[#FAF9F6]">
                {mensagens.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-[11px] font-mono text-stone-400 text-center">
                      Nenhuma mensagem ainda.<br />Envie a primeira para combinar os detalhes do serviço.
                    </p>
                  </div>
                ) : (
                  mensagens.map(m => {
                    const minha = m.id_autor === usuario.id_usuario;
                    return (
                      <div key={m.id_mensagem} className={`flex ${minha ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 border ${minha
                          ? 'bg-pastel-sage text-stone-900 border-pastel-sage-dark/30'
                          : 'bg-white text-stone-800 border-stone-300'}`}>
                          {!minha && (
                            <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1">
                              {m.autor_nome} ({m.autor_perfil})
                            </p>
                          )}
                          <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{m.texto}</p>
                          <p className={`text-[9px] font-mono mt-1 text-right ${minha ? 'text-pastel-sage-dark' : 'text-stone-400'}`}>
                            {api.extrairHora(m.criada_em)}{minha && (m.lida ? ' · lida' : ' · enviada')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={fimDaLista} />
              </div>

              {/* Formulário de envio */}
              <form onSubmit={enviar} className="p-4 border-t border-stone-200 flex items-center space-x-2 bg-white">
                <input
                  type="text"
                  value={rascunho}
                  onChange={e => setRascunho(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  maxLength={2000}
                  className="flex-grow bg-pastel-cream border border-stone-300 px-4 py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-500"
                />
                <button
                  type="submit"
                  disabled={enviando || !rascunho.trim()}
                  className="flex-shrink-0 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 disabled:cursor-not-allowed text-white text-xs uppercase tracking-wider font-bold px-5 py-2.5 border border-stone-900 transition flex items-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5 text-pastel-sage" />
                  <span className="hidden sm:inline">{enviando ? 'Enviando...' : 'Enviar'}</span>
                  <Paperclip className="hidden sm:inline w-3.5 h-3.5 text-pastel-sage opacity-50" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
