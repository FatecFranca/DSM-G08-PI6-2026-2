import React, { useState } from 'react';
import { api } from '../services/api';
import { Service } from '../types';
import { X, Plus, Clock, DollarSign, Sparkles } from 'lucide-react';

interface ModalNovoServicoProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceCreated: (newService: Service) => void;
}

export const ModalNovoServico: React.FC<ModalNovoServicoProps> = ({ isOpen, onClose, onServiceCreated }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [duracaoMinutos, setDuracaoMinutos] = useState('45');
  const [preco, setPreco] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !preco) return;

    setSalvando(true);
    const novo = await api.createService({
      id_prestador: 1,
      titulo,
      descricao,
      duracao_minutos: parseInt(duracaoMinutos) || 45,
      preco: parseFloat(preco.replace(',', '.')) || 0
    });

    setSalvando(false);
    onServiceCreated(novo);
    onClose();
    
    // Reset form
    setTitulo('');
    setDescricao('');
    setPreco('');
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 max-w-lg w-full text-left border-2 border-stone-900 space-y-6">
        
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Catálogo (RF03)</span>
            <h3 className="text-xl font-normal text-stone-900 uppercase tracking-tight mt-0.5">Cadastrar Novo Serviço</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-stone-300 hover:border-stone-900 hover:bg-pastel-cream transition text-stone-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          
          <div>
            <label className="block text-stone-600 font-bold uppercase tracking-wider mb-1.5">
              Título do Serviço:
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Barboterapia Especial com Ozônio"
              className="w-full px-4 py-2.5 bg-pastel-cream border border-stone-300 text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-bold uppercase tracking-wider mb-1.5 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-stone-400" /> Duração (Minutos):
              </label>
              <select
                value={duracaoMinutos}
                onChange={e => setDuracaoMinutos(e.target.value)}
                className="w-full px-4 py-2.5 bg-pastel-cream border border-stone-300 text-stone-900 focus:outline-none focus:border-stone-900"
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">60 minutos (1 hora)</option>
                <option value="90">90 minutos (1h 30)</option>
                <option value="120">120 minutos (2 horas)</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-600 font-bold uppercase tracking-wider mb-1.5 flex items-center">
                <DollarSign className="w-3.5 h-3.5 mr-1 text-stone-400" /> Preço (R$):
              </label>
              <input
                type="text"
                required
                value={preco}
                onChange={e => setPreco(e.target.value)}
                placeholder="Ex: 65.00"
                className="w-full px-4 py-2.5 bg-pastel-cream border border-stone-300 text-stone-900 focus:outline-none focus:border-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-bold uppercase tracking-wider mb-1.5">
              Descrição do Procedimento:
            </label>
            <textarea
              rows={3}
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descreva os detalhes e etapas inclusas neste serviço..."
              className="w-full p-3 bg-pastel-cream border border-stone-300 text-stone-900 focus:outline-none focus:border-stone-900 font-sans text-xs"
            />
          </div>

          <div className="p-3 bg-pastel-sage border border-pastel-sage-dark/30 text-[11px] text-pastel-sage-dark flex items-center space-x-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>O serviço ficará disponível imediatamente na tela de agendamento de clientes.</span>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-stone-300 bg-white hover:bg-pastel-sand text-stone-700 font-bold uppercase tracking-wider transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold uppercase tracking-wider border border-stone-900 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 text-pastel-sage" />
              <span>{salvando ? 'Salvando...' : 'Cadastrar Serviço'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
