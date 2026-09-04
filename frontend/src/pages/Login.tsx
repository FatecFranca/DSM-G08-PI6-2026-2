import React, { useState } from 'react';
import { User, Lock, Mail, Phone, Building2, MapPin, CheckCircle, ShieldAlert } from 'lucide-react';
import { api, PERFIS_DEMO } from '../services/api';
import { UserRole } from '../types';

interface LoginProps {
  onNavigate: (page: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [aba, setAba] = useState<'login' | 'register'>('login');
  const [tipoPerfil, setTipoPerfil] = useState<UserRole>('Admin');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('admin@agendou.com');
  const [senha, setSenha] = useState('123456');
  const [telefone, setTelefone] = useState('');
  const [nomeNegocio, setNomeNegocio] = useState('');
  const [endereco, setEndereco] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aba === 'login') {
      let role: UserRole = 'Admin';
      if (email.includes('prestador')) role = 'Prestador';
      else if (email.includes('cliente')) role = 'Cliente';

      const userPerfil = {
        id_usuario: role === 'Admin' ? 99 : (role === 'Prestador' ? 1 : 2),
        nome: role === 'Admin' ? 'Hugo Rodrigues' : (role === 'Prestador' ? 'Carlos Barbearia' : 'Mariana Silva'),
        email,
        tipo_perfil: role,
        nome_negocio: role === 'Prestador' ? 'Barbearia VIP Vintage' : undefined
      };

      api.setCurrentUser(userPerfil);
      onNavigate(role === 'Cliente' ? 'agendamento' : 'dashboard');
    } else {
      const novoUsuario = {
        id_usuario: Date.now(),
        nome,
        email,
        tipo_perfil: tipoPerfil,
        nome_negocio: tipoPerfil === 'Prestador' ? nomeNegocio : undefined
      };
      api.setCurrentUser(novoUsuario);

      setMensagemSucesso(`Conta criada com perfil "${tipoPerfil}"! Redirecionando...`);
      setTimeout(() => {
        onNavigate(tipoPerfil === 'Cliente' ? 'agendamento' : 'dashboard');
      }, 1200);
    }
  };

  const selecionarPerfilDemo = (perfilKey: 'admin' | 'prestador' | 'cliente') => {
    const demo = PERFIS_DEMO[perfilKey];
    setEmail(demo.email);
    setTipoPerfil(demo.tipo_perfil);
    api.setCurrentUser(demo);
    onNavigate(demo.tipo_perfil === 'Cliente' ? 'agendamento' : 'dashboard');
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
              {/* Seleção de Perfil (RF01 - CLIENT, PROVIDER, ADMIN) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2 font-mono">
                  Selecione seu Perfil de Acesso:
                </label>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setTipoPerfil('Cliente')}
                    className={`p-2.5 border text-center font-bold uppercase tracking-wider text-[11px] transition ${
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
                    className={`p-2.5 border text-center font-bold uppercase tracking-wider text-[11px] transition ${
                      tipoPerfil === 'Prestador'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-pastel-cream text-stone-600 border-stone-300 hover:border-stone-500'
                    }`}
                  >
                    Prestador
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoPerfil('Admin')}
                    className={`p-2.5 border text-center font-bold uppercase tracking-wider text-[11px] transition ${
                      tipoPerfil === 'Admin'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-pastel-cream text-stone-600 border-stone-300 hover:border-stone-500'
                    }`}
                  >
                    Admin
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
            {aba === 'login' ? 'Entrar no Sistema' : 'Concluir Cadastro'}
          </button>

          {/* Atalhos Rápidos para Demonstração de Perfis */}
          <div className="pt-3 border-t border-stone-200 text-center font-mono text-xs text-stone-500 space-y-2">
            <p className="uppercase tracking-wider text-[10px] font-bold text-stone-400">Entrar direto com perfil demo:</p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => selecionarPerfilDemo('admin')}
                className="px-2.5 py-1.5 bg-pastel-sand hover:bg-stone-900 hover:text-white border border-stone-300 text-stone-800 font-bold text-[11px] transition"
              >
                🛡️ Admin
              </button>
              <button
                type="button"
                onClick={() => selecionarPerfilDemo('prestador')}
                className="px-2.5 py-1.5 bg-pastel-blue hover:bg-stone-900 hover:text-white border border-pastel-blue-dark/30 text-stone-800 font-bold text-[11px] transition"
              >
                🛠️ Prestador
              </button>
              <button
                type="button"
                onClick={() => selecionarPerfilDemo('cliente')}
                className="px-2.5 py-1.5 bg-pastel-cream hover:bg-stone-900 hover:text-white border border-stone-300 text-stone-800 font-bold text-[11px] transition"
              >
                👤 Cliente
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
