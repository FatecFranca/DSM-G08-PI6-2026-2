import React, { useState } from 'react';
import { User, Lock, Mail, Phone, Building2, MapPin, CheckCircle } from 'lucide-react';

interface LoginProps {
  onNavigate: (page: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [aba, setAba] = useState<'login' | 'register'>('login');
  const [tipoPerfil, setTipoPerfil] = useState<'Cliente' | 'Prestador'>('Cliente');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('cliente@exemplo.com');
  const [senha, setSenha] = useState('123456');
  const [telefone, setTelefone] = useState('');
  const [nomeNegocio, setNomeNegocio] = useState('');
  const [endereco, setEndereco] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aba === 'login') {
      onNavigate(email.includes('prestador') ? 'dashboard' : 'agendamento');
    } else {
      setMensagemSucesso('Conta criada com sucesso! Redirecionando...');
      setTimeout(() => {
        setAba('login');
        setMensagemSucesso('');
      }, 1500);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/80 space-y-6">
        
        {/* Toggle Abas */}
        <div className="flex border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => setAba('login')}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${
              aba === 'login'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-400 hover:text-slate-600 border-transparent'
            }`}
          >
            Fazer Login
          </button>
          <button
            type="button"
            onClick={() => setAba('register')}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${
              aba === 'register'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-400 hover:text-slate-600 border-transparent'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {mensagemSucesso && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {aba === 'register' && (
            <>
              {/* Seleção de Perfil (RF01) */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Perfil de Acesso:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoPerfil('Cliente')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      tipoPerfil === 'Cliente'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Sou Cliente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoPerfil('Prestador')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      tipoPerfil === 'Prestador'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Sou Prestador</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Campos adicionais para Prestador (RF02) */}
              {tipoPerfil === 'Prestador' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold uppercase text-indigo-700 mb-1.5">
                      Nome do Estabelecimento / Negócio
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-4 top-3 text-indigo-400" />
                      <input
                        type="text"
                        required
                        value={nomeNegocio}
                        onChange={e => setNomeNegocio(e.target.value)}
                        placeholder="Ex: Barbearia Estilo, Studio Bella"
                        className="w-full pl-10 pr-4 py-2.5 bg-indigo-50/40 border border-indigo-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-indigo-700 mb-1.5">
                      Endereço Completo
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-4 top-3 text-indigo-400" />
                      <input
                        type="text"
                        required
                        value={endereco}
                        onChange={e => setEndereco(e.target.value)}
                        placeholder="Rua, Número, Bairro, Cidade"
                        className="w-full pl-10 pr-4 py-2.5 bg-indigo-50/40 border border-indigo-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Sua senha secreta"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Criptografia com hash bcrypt no banco (RNF03)</p>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/25 transition"
          >
            {aba === 'login' ? 'Entrar na Plataforma' : 'Finalizar Cadastro'}
          </button>

          {aba === 'login' && (
            <div className="pt-2 text-center">
              <p className="text-xs text-slate-500">
                Acessos de demonstração:{' '}
                <button
                  type="button"
                  onClick={() => setEmail('prestador@exemplo.com')}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Prestador
                </button>
                {' | '}
                <button
                  type="button"
                  onClick={() => setEmail('cliente@exemplo.com')}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Cliente
                </button>
              </p>
            </div>
          )}

        </form>

      </div>
    </div>
  );
};
