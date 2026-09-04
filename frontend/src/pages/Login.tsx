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
      setMensagemSucesso('Conta cadastrada com sucesso! Redirecionando...');
      setTimeout(() => {
        setAba('login');
        setMensagemSucesso('');
      }, 1500);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white p-10 border border-stone-300 space-y-8">
        
        {/* Toggle Abas Minimalistas */}
        <div className="flex border-b border-stone-300 font-mono text-xs uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setAba('login')}
            className={`flex-1 pb-3 font-bold border-b-2 transition ${
              aba === 'login'
                ? 'text-stone-900 border-stone-900'
                : 'text-stone-400 hover:text-stone-600 border-transparent'
            }`}
          >
            Acessar Conta
          </button>
          <button
            type="button"
            onClick={() => setAba('register')}
            className={`flex-1 pb-3 font-bold border-b-2 transition ${
              aba === 'register'
                ? 'text-stone-900 border-stone-900'
                : 'text-stone-400 hover:text-stone-600 border-transparent'
            }`}
          >
            Novo Cadastro
          </button>
        </div>

        {mensagemSucesso && (
          <div className="p-3 bg-pastel-sage text-pastel-sage-dark text-xs font-mono font-bold border border-pastel-sage-dark/30 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {aba === 'register' && (
            <>
              {/* Seleção de Perfil (RF01) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2 font-mono">
                  Perfil de Usuário:
                </label>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setTipoPerfil('Cliente')}
                    className={`p-3 border text-center font-bold uppercase tracking-wider transition ${
                      tipoPerfil === 'Cliente'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-pastel-cream text-stone-600 border-stone-300 hover:border-stone-500'
                    }`}
                  >
                    Cliente
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoPerfil('Prestador')}
                    className={`p-3 border text-center font-bold uppercase tracking-wider transition ${
                      tipoPerfil === 'Prestador'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-pastel-cream text-stone-600 border-stone-300 hover:border-stone-500'
                    }`}
                  >
                    Prestador
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1 font-mono">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-2.5 bg-pastel-cream border border-stone-300 text-sm focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1 font-mono">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="tel"
                    required
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-10 pr-4 py-2.5 bg-pastel-cream border border-stone-300 text-sm focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              {tipoPerfil === 'Prestador' && (
                <div className="space-y-4 pt-2 border-t border-stone-200">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-800 mb-1 font-mono">
                      Nome do Estabelecimento
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                      <input
                        type="text"
                        required
                        value={nomeNegocio}
                        onChange={e => setNomeNegocio(e.target.value)}
                        placeholder="Ex: Barbearia Estilo, Studio Bella"
                        className="w-full pl-10 pr-4 py-2.5 bg-pastel-cream border border-stone-300 text-sm focus:outline-none focus:border-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-800 mb-1 font-mono">
                      Endereço Completo
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                      <input
                        type="text"
                        required
                        value={endereco}
                        onChange={e => setEndereco(e.target.value)}
                        placeholder="Rua, Número, Bairro, Cidade"
                        className="w-full pl-10 pr-4 py-2.5 bg-pastel-cream border border-stone-300 text-sm focus:outline-none focus:border-stone-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1 font-mono">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-2.5 bg-pastel-cream border border-stone-300 text-sm focus:outline-none focus:border-stone-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1 font-mono">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="password"
                required
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Sua senha secreta"
                className="w-full pl-10 pr-4 py-2.5 bg-pastel-cream border border-stone-300 text-sm focus:outline-none focus:border-stone-900 font-mono"
              />
            </div>
            <p className="text-[10px] text-stone-400 font-mono mt-1">Hash bcrypt no banco (RNF03)</p>
          </div>

          <button
            type="submit"
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider py-4 border border-stone-900 transition"
          >
            {aba === 'login' ? 'Acessar Plataforma' : 'Concluir Cadastro'}
          </button>

          {aba === 'login' && (
            <div className="pt-2 text-center text-xs font-mono text-stone-500">
              Alternar acesso demonstrativo:{' '}
              <button
                type="button"
                onClick={() => setEmail('prestador@exemplo.com')}
                className="text-stone-900 font-bold underline"
              >
                Prestador
              </button>
              {' • '}
              <button
                type="button"
                onClick={() => setEmail('cliente@exemplo.com')}
                className="text-stone-900 font-bold underline"
              >
                Cliente
              </button>
            </div>
          )}

        </form>

      </div>
    </div>
  );
};
