import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Appointment, Service } from '../types';
import { Users, DollarSign, Star, Brain, Check, X, Eye, Plus, Scissors, Clock } from 'lucide-react';
import { ModalNovoServico } from '../components/ModalNovoServico';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const DashboardPrestador: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [servicos, setServicos] = useState<Service[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string>('');

  useEffect(() => {
    api.getAppointments(1).then(data => setAgendamentos(data));
    api.getServices(1).then(data => setServicos(data));
  }, []);

  const alterarStatus = (id: number, novoStatus: 'Confirmado' | 'Cancelado' | 'Concluído') => {
    setAgendamentos(prev =>
      prev.map(a => (a.id_agendamento === id ? { ...a, status: novoStatus } : a))
    );
  };

  const handleServiceCreated = (novo: Service) => {
    setServicos(prev => [novo, ...prev]);
    setMensagemSucesso(`Serviço "${novo.titulo}" cadastrado e liberado para agendamentos!`);
    setTimeout(() => setMensagemSucesso(''), 4000);
  };

  const listaFiltrada = agendamentos.filter(a => {
    if (filtroStatus === 'todos') return true;
    return a.status === filtroStatus;
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
      
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-300 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Módulo Administrativo</span>
          <h1 className="text-3xl font-normal text-stone-900 tracking-tight mt-1">Painel do Prestador (RF11)</h1>
          <p className="text-xs text-stone-500 font-light mt-1">Gestão de catálogo, horários, métricas financeiras e índices de IA.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setModalAberto(true)}
            className="bg-stone-900 hover:bg-stone-800 text-white text-xs uppercase tracking-wider font-bold px-6 py-3 border border-stone-900 transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 text-pastel-sage" />
            <span>Cadastrar Serviço</span>
          </button>
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

      {/* Cards de Métricas em Tons Pastéis com Sharp Corners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-pastel-cream p-6 border border-stone-300 space-y-2">
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-stone-500">Agendados Hoje</span>
            <Users className="w-4 h-4 text-stone-600" />
          </div>
          <h3 className="text-3xl font-mono font-light text-stone-900">{agendamentos.length}</h3>
          <p className="text-[11px] font-mono text-pastel-sage-dark font-semibold">Data: 04/09/2026</p>
        </div>

        <div className="bg-pastel-cream p-6 border border-stone-300 space-y-2">
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-stone-500">Faturamento Previsto</span>
            <DollarSign className="w-4 h-4 text-stone-600" />
          </div>
          <h3 className="text-3xl font-mono font-light text-stone-900">
            R$ {agendamentos.reduce((acc, a) => acc + a.servico_preco, 0).toFixed(2).replace('.', ',')}
          </h3>
          <p className="text-[11px] font-mono text-stone-500">Receita total da data</p>
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

      {/* Catálogo de Serviços do Prestador (RF03) */}
      <div className="bg-white border border-stone-300 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-stone-900">Catálogo de Serviços Ofertados (RF03)</h2>
            <p className="text-xs text-stone-500 font-mono">Serviços ativos configurados pelo prestador para agendamento.</p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="text-xs font-mono font-bold uppercase tracking-wider bg-pastel-sand hover:bg-stone-200 text-stone-800 px-4 py-2 border border-stone-300 flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Serviço</span>
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          {servicos.map(s => (
            <div key={s.id_servico} className="p-4 border border-stone-200 bg-pastel-cream space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-bold text-stone-900 line-clamp-1">{s.titulo}</span>
                <span className="bg-pastel-sage text-pastel-sage-dark px-1.5 py-0.5 text-[9px] uppercase font-bold border border-pastel-sage-dark/30">
                  Ativo
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-sans line-clamp-2">{s.descricao || 'Sem descrição cadastrada'}</p>
              <div className="flex justify-between items-center pt-2 border-t border-stone-200 text-[11px]">
                <span className="text-stone-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> {s.duracao_minutos} min</span>
                <span className="font-bold text-stone-900">R$ {s.preco.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de Agendamentos */}
      <div className="bg-white border border-stone-300 space-y-4">
        
        {/* Filtros e Legenda Semafórica (RNF06) */}
        <div className="p-6 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-stone-900">Grade de Agendamentos</h2>
            <p className="text-xs text-stone-500 font-mono mt-0.5">Indicadores semafóricos pasteis para identificação ágil.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setFiltroStatus('todos')}
              className={`px-3 py-1.5 border uppercase tracking-wider text-[11px] ${
                filtroStatus === 'todos' ? 'bg-stone-900 text-white border-stone-900 font-bold' : 'bg-white text-stone-600 border-stone-300'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroStatus('Confirmado')}
              className={`px-3 py-1.5 border uppercase tracking-wider text-[11px] ${
                filtroStatus === 'Confirmado' ? 'bg-pastel-sage text-pastel-sage-dark border-pastel-sage-dark font-bold' : 'bg-white text-stone-600 border-stone-300'
              }`}
            >
              Confirmados
            </button>
            <button
              onClick={() => setFiltroStatus('Pendente')}
              className={`px-3 py-1.5 border uppercase tracking-wider text-[11px] ${
                filtroStatus === 'Pendente' ? 'bg-pastel-amber text-pastel-amber-dark border-pastel-amber-dark font-bold' : 'bg-white text-stone-600 border-stone-300'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setFiltroStatus('Concluído')}
              className={`px-3 py-1.5 border uppercase tracking-wider text-[11px] ${
                filtroStatus === 'Concluído' ? 'bg-pastel-blue text-pastel-blue-dark border-pastel-blue-dark font-bold' : 'bg-white text-stone-600 border-stone-300'
              }`}
            >
              Concluídos
            </button>
          </div>
        </div>

        {/* Listagem */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pastel-cream border-b border-stone-300 text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3.5 px-6">Horário</th>
                <th className="py-3.5 px-6">Cliente</th>
                <th className="py-3.5 px-6">Serviço</th>
                <th className="py-3.5 px-6">Valor</th>
                <th className="py-3.5 px-6">Status (RNF06)</th>
                <th className="py-3.5 px-6 text-right">Ações (RF08)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-xs">
              {listaFiltrada.map(item => (
                <tr key={item.id_agendamento} className="hover:bg-pastel-cream/50 transition">
                  <td className="py-4 px-6 font-mono font-bold text-stone-900">
                    {new Date(item.data_hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(item.data_hora_fim).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      >
                        Cancelar
                      </button>
                    )}
                    {item.status === 'Concluído' && (
                      <button
                        onClick={() => onNavigate('avaliacao')}
                        className="text-stone-900 hover:underline font-bold"
                      >
                        Avaliação
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal de Cadastro de Novo Serviço */}
      <ModalNovoServico
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onServiceCreated={handleServiceCreated}
      />

    </div>
  );
};
