import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Appointment, Service, UserProfile } from '../types';
import { Users, DollarSign, Star, Brain, Check, X, Eye, Plus, Scissors, Clock, Calendar, Edit3, Trash2, ShieldAlert } from 'lucide-react';
import { ModalNovoServico } from '../components/ModalNovoServico';
import { ModalEditarServico } from '../components/ModalEditarServico';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const DashboardPrestador: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [usuario, setUsuario] = useState<UserProfile>(api.getCurrentUser());
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [servicos, setServicos] = useState<Service[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroData, setFiltroData] = useState<string>('2026-09-04');
  
  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);
  const [modalEditarAberto, setModalEditarAberto] = useState<boolean>(false);
  const [servicoEmEdicao, setServicoEmEdicao] = useState<Service | null>(null);

  const [mensagemSucesso, setMensagemSucesso] = useState<string>('');

  const carregarDados = () => {
    api.getAppointments(1).then(data => setAgendamentos(data));
    api.getServices().then(data => setServicos(data));
    setUsuario(api.getCurrentUser());
  };

  useEffect(() => {
    carregarDados();
    const handleAuthChange = () => setUsuario(api.getCurrentUser());
    window.addEventListener('agendou_auth_changed', handleAuthChange);
    return () => window.removeEventListener('agendou_auth_changed', handleAuthChange);
  }, []);

  const alterarStatus = async (id: number, novoStatus: 'Confirmado' | 'Cancelado' | 'Concluído') => {
    await api.updateAppointmentStatus(id, novoStatus);
    setAgendamentos(prev =>
      prev.map(a => (a.id_agendamento === id ? { ...a, status: novoStatus } : a))
    );
    setMensagemSucesso(`Status do agendamento alterado para "${novoStatus}".`);
    setTimeout(() => setMensagemSucesso(''), 3000);
  };

  const handleServiceCreated = (novo: Service) => {
    setServicos(prev => [
      novo,
      ...prev.filter(s => s.id_servico !== novo.id_servico && s.titulo.toLowerCase().trim() !== novo.titulo.toLowerCase().trim())
    ]);
    setMensagemSucesso(`Serviço "${novo.titulo}" cadastrado com sucesso!`);
    setTimeout(() => setMensagemSucesso(''), 4000);
  };

  const handleServiceUpdated = (atualizado: Service) => {
    setServicos(prev => prev.map(s => s.id_servico === atualizado.id_servico ? atualizado : s));
    setMensagemSucesso(`Serviço "${atualizado.titulo}" atualizado com sucesso!`);
    setTimeout(() => setMensagemSucesso(''), 4000);
  };

  const handleExcluirServico = async (servico: Service) => {
    const confirmou = window.confirm(`Deseja realmente excluir o serviço "${servico.titulo}" do catálogo?`);
    if (!confirmou) return;

    await api.deleteService(servico.id_servico);
    setServicos(prev => prev.filter(s => 
      s.id_servico !== servico.id_servico && 
      !(s.titulo.toLowerCase().trim() === servico.titulo.toLowerCase().trim() && s.id_prestador === servico.id_prestador)
    ));
    setMensagemSucesso(`Serviço "${servico.titulo}" removido do catálogo.`);
    setTimeout(() => setMensagemSucesso(''), 4000);
  };

  const abrirEdicao = (servico: Service) => {
    setServicoEmEdicao(servico);
    setModalEditarAberto(true);
  };

  // Permissão de gerenciamento: Admin tem controle irrestrito; Prestador gerencia seus serviços
  const podeGerenciarServico = (servico: Service) => {
    if (usuario.tipo_perfil === 'Admin') return true;
    if (usuario.tipo_perfil === 'Prestador') {
      return servico.id_prestador === usuario.id_usuario || servico.id_prestador === 1;
    }
    return false;
  };

  const listaFiltrada = agendamentos.filter(a => {
    const atendeStatus = filtroStatus === 'todos' || a.status === filtroStatus;
    const atendeData = !filtroData || a.data_hora_inicio.startsWith(filtroData);
    return atendeStatus && atendeData;
  });

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'Confirmado':
        return 'bg-pastel-sage text-pastel-sage-dark border-pastel-sage-dark/40 font-bold';
      case 'Pendente':
        return 'bg-pastel-amber text-pastel-amber-dark border-pastel-amber-dark/40 font-bold';
      case 'Cancelado':
        return 'bg-pastel-peach text-pastel-peach-dark border-pastel-peach-dark/40 font-bold';
      case 'Concluído':
        return 'bg-pastel-blue text-pastel-blue-dark border-pastel-blue-dark/40 font-bold';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-300 font-bold';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Banner de Modo Administrador (Se ativo) */}
      {usuario.tipo_perfil === 'Admin' && (
        <div className="p-4 bg-stone-900 text-white border-2 border-stone-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-pastel-sage flex-shrink-0" />
            <div>
              <span className="font-bold text-pastel-sage uppercase tracking-wider">Modo Administrador (Controle Total):</span>
              <p className="text-stone-300 font-light mt-0.5">
                Você tem permissão de superusuário para editar ou excluir qualquer serviço de qualquer prestador do sistema.
              </p>
            </div>
          </div>
          <span className="bg-pastel-peach text-pastel-peach-dark px-3 py-1 text-[10px] uppercase font-bold border border-pastel-peach-dark/30 self-start sm:self-auto">
            ADMIN ROOT
          </span>
        </div>
      )}

      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-300 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Módulo Administrativo</span>
          <h1 className="text-3xl font-normal text-stone-900 tracking-tight mt-1">
            {usuario.tipo_perfil === 'Admin' ? 'Painel de Administração Global' : 'Painel do Prestador (RF11)'}
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            Conectado como: <strong>{usuario.nome}</strong> ({usuario.tipo_perfil}).
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {(usuario.tipo_perfil === 'Admin' || usuario.tipo_perfil === 'Prestador') && (
            <button
              onClick={() => setModalNovoAberto(true)}
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs uppercase tracking-wider font-bold px-6 py-3 border border-stone-900 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 text-pastel-sage" />
              <span>Cadastrar Novo Serviço</span>
            </button>
          )}
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-4 bg-pastel-sage text-pastel-sage-dark text-xs font-mono font-bold border border-pastel-sage-dark/30 flex items-center justify-between">
          <span>{mensagemSucesso}</span>
          <button
            onClick={() => onNavigate('agendamento')}
            className="underline uppercase tracking-wider text-stone-900 font-extrabold ml-4"
          >
            Ver no Agendamento →
          </button>
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-pastel-cream p-6 border border-stone-300 space-y-2">
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-stone-500">Agendamentos Totais</span>
            <Users className="w-4 h-4 text-stone-600" />
          </div>
          <h3 className="text-3xl font-mono font-light text-stone-900">{agendamentos.length}</h3>
          <p className="text-[11px] font-mono text-pastel-sage-dark font-semibold">
            {listaFiltrada.length} na data filtrada
          </p>
        </div>

        <div className="bg-pastel-cream p-6 border border-stone-300 space-y-2">
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-stone-500">Faturamento Previsto</span>
            <DollarSign className="w-4 h-4 text-stone-600" />
          </div>
          <h3 className="text-3xl font-mono font-light text-stone-900">
            R$ {agendamentos.reduce((acc, a) => acc + (a.status !== 'Cancelado' ? a.servico_preco : 0), 0).toFixed(2).replace('.', ',')}
          </h3>
          <p className="text-[11px] font-mono text-stone-500">Receita de atendimentos ativos</p>
        </div>

        <div className="bg-pastel-cream p-6 border border-stone-300 space-y-2">
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-stone-500">Avaliação Média</span>
            <Star className="w-4 h-4 text-stone-600" />
          </div>
          <h3 className="text-3xl font-mono font-light text-stone-900">4.9</h3>
          <p className="text-[11px] font-mono text-stone-500">128 avaliações de clientes</p>
        </div>

        <div className="bg-pastel-lavender p-6 border border-pastel-lavender-dark/30 space-y-2">
          <div className="flex justify-between items-center text-pastel-lavender-dark">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-pastel-lavender-dark">Satisfação (NLP)</span>
            <Brain className="w-4 h-4 text-pastel-lavender-dark" />
          </div>
          <h3 className="text-3xl font-mono font-light text-stone-900">96.4%</h3>
          <p className="text-[11px] font-mono text-pastel-lavender-dark font-semibold">Sentimento Positivo</p>
        </div>
      </div>

      {/* Catálogo de Serviços do Prestador (RF03) com Ações de Edição e Exclusão */}
      <div className="bg-white border border-stone-300 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-4 gap-3">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-stone-900 flex items-center space-x-2">
              <span>Catálogo de Serviços da Plataforma (RF03)</span>
              <span className="text-xs font-mono font-normal text-stone-400">({servicos.length} ativos)</span>
            </h2>
            <p className="text-xs text-stone-500 font-mono">
              {usuario.tipo_perfil === 'Admin'
                ? 'Permissão de Administrador ativa: você pode editar ou excluir qualquer serviço abaixo.'
                : 'Serviços cadastrados. Você pode editar os parâmetros ou excluir do catálogo.'}
            </p>
          </div>
          {(usuario.tipo_perfil === 'Admin' || usuario.tipo_perfil === 'Prestador') && (
            <button
              onClick={() => setModalNovoAberto(true)}
              className="text-xs font-mono font-bold uppercase tracking-wider bg-pastel-sand hover:bg-stone-200 text-stone-800 px-4 py-2 border border-stone-300 flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Serviço</span>
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {servicos.map(s => {
            const podeGerenciar = podeGerenciarServico(s);
            return (
              <div key={s.id_servico} className="p-5 border border-stone-300 bg-pastel-cream space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-stone-900 line-clamp-1">{s.titulo}</span>
                    <span className="bg-pastel-sage text-pastel-sage-dark px-1.5 py-0.5 text-[9px] uppercase font-bold border border-pastel-sage-dark/30">
                      Ativo
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-sans line-clamp-2 leading-relaxed">
                    {s.descricao || 'Sem descrição cadastrada'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-stone-200">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-stone-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> {s.duracao_minutos} min
                    </span>
                    <span className="font-bold text-stone-900 text-sm">
                      R$ {s.preco.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  {/* Ações de Edição e Exclusão */}
                  {podeGerenciar && (
                    <div className="space-y-2 pt-2 border-t border-stone-200">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => abrirEdicao(s)}
                          className="flex-1 py-1.5 px-2 bg-white hover:bg-pastel-sand border border-stone-300 text-stone-800 font-bold uppercase tracking-wider text-[10px] flex items-center justify-center space-x-1 transition"
                          title="Editar nome, descrição, duração e valor"
                        >
                          <Edit3 className="w-3 h-3 text-stone-600" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleExcluirServico(s)}
                          className="py-1.5 px-2.5 bg-pastel-peach hover:bg-red-100 border border-pastel-peach-dark/30 text-pastel-peach-dark font-bold uppercase tracking-wider text-[10px] flex items-center justify-center space-x-1 transition"
                          title="Excluir este serviço do catálogo"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                          <span>Excluir</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          localStorage.setItem('agendou_avaliacao_alvo', JSON.stringify({
                            id_servico: s.id_servico,
                            servico_titulo: s.titulo
                          }));
                          onNavigate('avaliacao');
                        }}
                        className="w-full py-1.5 px-2 bg-pastel-lavender hover:bg-pastel-lavender/80 border border-pastel-lavender-dark/30 text-pastel-lavender-dark font-bold uppercase tracking-wider text-[10px] flex items-center justify-center space-x-1.5 transition"
                        title="Avaliar este serviço com análise de sentimento via IA"
                      >
                        <Brain className="w-3 h-3" />
                        <span>Avaliar com IA (NLP)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela de Agendamentos */}
      <div className="bg-white border border-stone-300 space-y-4">
        
        {/* Filtros de Data e Status */}
        <div className="p-6 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-stone-900">Grade de Agendamentos</h2>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              Horários sincronizados 1:1 com os slots de agendamento de clientes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="flex items-center space-x-2 border border-stone-300 px-3 py-1.5 bg-pastel-cream">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <input
                type="date"
                value={filtroData}
                onChange={e => setFiltroData(e.target.value)}
                className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none"
              />
              {filtroData && (
                <button
                  onClick={() => setFiltroData('')}
                  className="text-stone-400 hover:text-stone-700 text-[10px] uppercase font-bold ml-1"
                >
                  Ver Todos
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setFiltroStatus('todos')}
                className={`px-2.5 py-1.5 border uppercase tracking-wider text-[11px] ${
                  filtroStatus === 'todos' ? 'bg-stone-900 text-white border-stone-900 font-bold' : 'bg-white text-stone-600 border-stone-300'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroStatus('Confirmado')}
                className={`px-2.5 py-1.5 border uppercase tracking-wider text-[11px] ${
                  filtroStatus === 'Confirmado' ? 'bg-pastel-sage text-pastel-sage-dark border-pastel-sage-dark font-bold' : 'bg-white text-stone-600 border-stone-300'
                }`}
              >
                Confirmados
              </button>
              <button
                onClick={() => setFiltroStatus('Concluído')}
                className={`px-2.5 py-1.5 border uppercase tracking-wider text-[11px] ${
                  filtroStatus === 'Concluído' ? 'bg-pastel-blue text-pastel-blue-dark border-pastel-blue-dark font-bold' : 'bg-white text-stone-600 border-stone-300'
                }`}
              >
                Concluídos
              </button>
              <button
                onClick={() => setFiltroStatus('Cancelado')}
                className={`px-2.5 py-1.5 border uppercase tracking-wider text-[11px] ${
                  filtroStatus === 'Cancelado' ? 'bg-pastel-peach text-pastel-peach-dark border-pastel-peach-dark font-bold' : 'bg-white text-stone-600 border-stone-300'
                }`}
              >
                Cancelados
              </button>
            </div>
          </div>
        </div>

        {/* Listagem */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pastel-cream border-b border-stone-300 text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3.5 px-6">Data</th>
                <th className="py-3.5 px-6">Horário</th>
                <th className="py-3.5 px-6">Cliente</th>
                <th className="py-3.5 px-6">Serviço</th>
                <th className="py-3.5 px-6">Valor</th>
                <th className="py-3.5 px-6">Status (RNF06)</th>
                <th className="py-3.5 px-6 text-right">Ações (RF08)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-xs">
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs font-mono text-stone-400">
                    Nenhum agendamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                listaFiltrada.map(item => (
                  <tr key={item.id_agendamento} className="hover:bg-pastel-cream/50 transition">
                    <td className="py-4 px-6 font-mono text-stone-600">
                      {api.extrairData(item.data_hora_inicio)}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-stone-900">
                      {api.extrairHora(item.data_hora_inicio)} - {api.extrairHora(item.data_hora_fim)}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-stone-900">{item.cliente_nome}</p>
                      <p className="text-[11px] font-mono text-stone-400">{item.cliente_telefone}</p>
                    </td>
                    <td className="py-4 px-6 text-stone-700">{item.servico_titulo}</td>
                    <td className="py-4 px-6 font-mono font-bold text-stone-900">
                      R$ {item.servico_preco.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-1 text-[10px] uppercase tracking-wider border font-mono ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-3 font-mono text-xs">
                      {item.status !== 'Concluído' && (
                        <button
                          onClick={() => alterarStatus(item.id_agendamento, 'Concluído')}
                          className="text-stone-900 hover:text-pastel-sage-dark font-bold underline"
                        >
                          Concluir
                        </button>
                      )}
                      {item.status !== 'Cancelado' && item.status !== 'Concluído' && (
                        <button
                          onClick={() => alterarStatus(item.id_agendamento, 'Cancelado')}
                          className="text-stone-500 hover:text-stone-800 underline"
                          title="Cancelar agendamento libera o horário na grade"
                        >
                          Cancelar
                        </button>
                      )}
                      {item.status === 'Concluído' && (
                        <button
                          onClick={() => {
                            localStorage.setItem('agendou_avaliacao_alvo', JSON.stringify({
                              id_agendamento: item.id_agendamento,
                              id_servico: item.id_servico,
                              servico_titulo: item.servico_titulo,
                              cliente_nome: item.cliente_nome,
                              data_hora: item.data_hora_inicio
                            }));
                            onNavigate('avaliacao');
                          }}
                          className="text-stone-900 hover:underline font-bold"
                        >
                          Avaliação (NLP)
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal de Cadastro de Novo Serviço */}
      <ModalNovoServico
        isOpen={modalNovoAberto}
        onClose={() => setModalNovoAberto(false)}
        onServiceCreated={handleServiceCreated}
      />

      {/* Modal de Edição de Serviço */}
      <ModalEditarServico
        isOpen={modalEditarAberto}
        service={servicoEmEdicao}
        onClose={() => setModalEditarAberto(false)}
        onServiceUpdated={handleServiceUpdated}
      />

    </div>
  );
};
