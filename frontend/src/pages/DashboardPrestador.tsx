import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { Users, DollarSign, Star, Brain, Check, X, Eye } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const DashboardPrestador: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  useEffect(() => {
    api.getAppointments(1).then(data => setAgendamentos(data));
  }, []);

  const alterarStatus = (id: number, novoStatus: 'Confirmado' | 'Cancelado' | 'Concluído') => {
    setAgendamentos(prev =>
      prev.map(a => (a.id_agendamento === id ? { ...a, status: novoStatus } : a))
    );
  };

  const listaFiltrada = agendamentos.filter(a => {
    if (filtroStatus === 'todos') return true;
    return a.status === filtroStatus;
  });

  // Estilos semafóricos de acessibilidade (RNF06)
  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'Confirmado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Pendente':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Concluído':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Painel do Prestador (RF11)</h1>
          <p className="text-xs text-slate-500 mt-1">Gestão centralizada de atendimentos, métricas e catálogo de serviços.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('agendamento')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Cards de Métricas e IA (RF11) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Agendados</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{agendamentos.length} Atendimentos</h3>
            <p className="text-[11px] text-emerald-600 font-semibold">Hoje: 04/09/2026</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento Previsto</p>
            <h3 className="text-2xl font-extrabold text-slate-900">
              R$ {agendamentos.reduce((acc, a) => acc + a.servico_preco, 0).toFixed(2).replace('.', ',')}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold">Receita total da data</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avaliação Média</p>
            <h3 className="text-2xl font-extrabold text-slate-900">4.9 / 5.0</h3>
            <p className="text-[11px] text-slate-500 font-semibold">128 avaliações</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-xl">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Satisfação IA (NLP)</p>
            <h3 className="text-2xl font-extrabold text-violet-600">96.4%</h3>
            <p className="text-[11px] text-slate-500 font-semibold">Mineração de Dados</p>
          </div>
        </div>

      </div>

      {/* Tabela de Agendamentos */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        
        {/* Filtros e Legenda Semafórica (RNF06) */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Grade de Compromissos</h2>
            <p className="text-xs text-slate-500">Padrão visual semafórico para rápida identificação de status.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFiltroStatus('todos')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                filtroStatus === 'todos' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroStatus('Confirmado')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                filtroStatus === 'Confirmado' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              Confirmados
            </button>
            <button
              onClick={() => setFiltroStatus('Pendente')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                filtroStatus === 'Pendente' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setFiltroStatus('Concluído')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                filtroStatus === 'Concluído' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
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
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Horário</th>
                <th className="py-3 px-6">Cliente</th>
                <th className="py-3 px-6">Serviço</th>
                <th className="py-3 px-6">Valor</th>
                <th className="py-3 px-6">Status (RNF06)</th>
                <th className="py-3 px-6 text-right">Ações (RF08)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {listaFiltrada.map(item => (
                <tr key={item.id_agendamento} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {new Date(item.data_hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(item.data_hora_fim).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800">{item.cliente_nome}</p>
                    <p className="text-[11px] text-slate-400">{item.cliente_telefone}</p>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{item.servico_titulo}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">
                    R$ {item.servico_preco.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    {item.status !== 'Concluído' && (
                      <button
                        onClick={() => alterarStatus(item.id_agendamento, 'Concluído')}
                        className="text-emerald-600 hover:text-emerald-800 font-bold inline-flex items-center"
                        title="Concluir Atendimento"
                      >
                        <Check className="w-4 h-4 mr-1" /> Concluir
                      </button>
                    )}
                    {item.status !== 'Cancelado' && item.status !== 'Concluído' && (
                      <button
                        onClick={() => alterarStatus(item.id_agendamento, 'Cancelado')}
                        className="text-red-500 hover:text-red-700 font-bold inline-flex items-center"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4 mr-1" /> Cancelar
                      </button>
                    )}
                    {item.status === 'Concluído' && (
                      <button
                        onClick={() => onNavigate('avaliacao')}
                        className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" /> Avaliação
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
