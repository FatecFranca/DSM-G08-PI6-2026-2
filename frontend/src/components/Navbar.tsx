import React, { useState, useEffect } from 'react';
import { CalendarCheck, User, LayoutDashboard, Star, Calendar, ShieldAlert, ChevronDown } from 'lucide-react';
import { api, PERFIS_DEMO } from '../services/api';
import { UserProfile } from '../types';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [usuario, setUsuario] = useState<UserProfile>(api.getCurrentUser());
  const [dropdownAberto, setDropdownAberto] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setUsuario(api.getCurrentUser());
    };
    window.addEventListener('agendou_auth_changed', handleAuthChange);
    return () => window.removeEventListener('agendou_auth_changed', handleAuthChange);
  }, []);

  const trocarPerfil = (perfilKey: string) => {
    const perfil = PERFIS_DEMO[perfilKey];
    if (perfil) {
      api.setCurrentUser(perfil);
      setUsuario(perfil);
      setDropdownAberto(false);
    }
  };

  return (
    <header className="bg-[#FAF9F6] border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo minimalista com ângulos retos */}
        <button onClick={() => onNavigate('home')} className="flex items-center space-x-3 text-left group">
          <div className="w-10 h-10 bg-stone-900 flex items-center justify-center text-white border border-stone-900 group-hover:bg-stone-800 transition">
            <CalendarCheck className="w-5 h-5 text-pastel-sage" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-stone-900 uppercase">
              Agendou<span className="text-pastel-sage-dark font-light">.</span>
            </span>
            <span className="block text-[9px] uppercase tracking-widest text-stone-400 font-semibold">
              PI 6º • Minimal
            </span>
          </div>
        </button>

        {/* Links Minimalistas */}
        <nav className="hidden md:flex items-center space-x-1 text-xs uppercase tracking-wider font-bold text-stone-600">
          <button
            onClick={() => onNavigate('home')}
            className={`px-4 py-2 border transition ${
              currentPage === 'home'
                ? 'bg-pastel-sand text-stone-900 border-stone-300'
                : 'border-transparent hover:border-stone-200 hover:bg-stone-100/60'
            }`}
          >
            Início
          </button>
          
          <button
            onClick={() => onNavigate('agendamento')}
            className={`px-4 py-2 border flex items-center space-x-2 transition ${
              currentPage === 'agendamento'
                ? 'bg-pastel-sage text-pastel-sage-dark border-pastel-sage-dark/30 font-extrabold'
                : 'border-transparent hover:border-stone-200 hover:bg-stone-100/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agendamento</span>
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-4 py-2 border flex items-center space-x-2 transition ${
              currentPage === 'dashboard'
                ? 'bg-pastel-blue text-pastel-blue-dark border-pastel-blue-dark/30 font-extrabold'
                : 'border-transparent hover:border-stone-200 hover:bg-stone-100/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Painel</span>
          </button>

          <button
            onClick={() => onNavigate('avaliacao')}
            className={`px-4 py-2 border flex items-center space-x-2 transition ${
              currentPage === 'avaliacao'
                ? 'bg-pastel-amber text-pastel-amber-dark border-pastel-amber-dark/30 font-extrabold'
                : 'border-transparent hover:border-stone-200 hover:bg-stone-100/60'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Avaliações & IA</span>
          </button>
        </nav>

        {/* Seletor de Perfil Ativo (Admin / Prestador / Cliente) */}
        <div className="relative">
          <button
            onClick={() => setDropdownAberto(!dropdownAberto)}
            className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 px-4 py-2.5 border transition ${
              usuario.tipo_perfil === 'Admin'
                ? 'bg-stone-900 text-white border-stone-900'
                : usuario.tipo_perfil === 'Prestador'
                ? 'bg-pastel-blue text-pastel-blue-dark border-pastel-blue-dark/40'
                : 'bg-pastel-sand text-stone-800 border-stone-300'
            }`}
          >
            {usuario.tipo_perfil === 'Admin' ? (
              <ShieldAlert className="w-3.5 h-3.5 text-pastel-sage" />
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
            <span>{usuario.nome}</span>
            <span className={`text-[9px] px-1.5 py-0.5 border font-mono ${
              usuario.tipo_perfil === 'Admin'
                ? 'bg-pastel-peach text-pastel-peach-dark border-pastel-peach-dark/30'
                : 'bg-white text-stone-700 border-stone-300'
            }`}>
              {usuario.tipo_perfil}
            </span>
            <ChevronDown className="w-3 h-3 ml-1 text-stone-400" />
          </button>

          {/* Menu Dropdown de Troca Rápida de Perfil */}
          {dropdownAberto && (
            <div className="absolute right-0 mt-1 w-64 bg-white border-2 border-stone-900 shadow-xl z-50 font-mono text-xs">
              <div className="p-3 bg-pastel-cream border-b border-stone-200 text-[11px] text-stone-500">
                Alternar Perfil para Teste (RF01):
              </div>
              
              <button
                onClick={() => trocarPerfil('admin')}
                className={`w-full text-left p-3 border-b border-stone-100 flex items-center justify-between hover:bg-pastel-cream transition ${
                  usuario.tipo_perfil === 'Admin' ? 'bg-pastel-sand font-bold' : ''
                }`}
              >
                <div>
                  <p className="font-bold text-stone-900">🛡️ Hugo Rodrigues</p>
                  <p className="text-[10px] text-stone-500">Administrador (Pode excluir qualquer serviço)</p>
                </div>
                {usuario.tipo_perfil === 'Admin' && <span className="text-pastel-sage-dark font-bold">✓</span>}
              </button>

              <button
                onClick={() => trocarPerfil('prestador')}
                className={`w-full text-left p-3 border-b border-stone-100 flex items-center justify-between hover:bg-pastel-cream transition ${
                  usuario.tipo_perfil === 'Prestador' ? 'bg-pastel-sand font-bold' : ''
                }`}
              >
                <div>
                  <p className="font-bold text-stone-900">🛠️ Carlos Barbearia</p>
                  <p className="text-[10px] text-stone-500">Prestador (Edita/Exclui seus serviços)</p>
                </div>
                {usuario.tipo_perfil === 'Prestador' && <span className="text-pastel-sage-dark font-bold">✓</span>}
              </button>

              <button
                onClick={() => trocarPerfil('cliente')}
                className={`w-full text-left p-3 flex items-center justify-between hover:bg-pastel-cream transition ${
                  usuario.tipo_perfil === 'Cliente' ? 'bg-pastel-sand font-bold' : ''
                }`}
              >
                <div>
                  <p className="font-bold text-stone-900">👤 Mariana Silva</p>
                  <p className="text-[10px] text-stone-500">Cliente (Apenas visualiza e agenda)</p>
                </div>
                {usuario.tipo_perfil === 'Cliente' && <span className="text-pastel-sage-dark font-bold">✓</span>}
              </button>

              <div className="p-2 bg-stone-50 border-t border-stone-200 text-center">
                <button
                  onClick={() => { setDropdownAberto(false); onNavigate('login'); }}
                  className="text-[10px] text-stone-600 hover:text-stone-900 underline font-bold uppercase tracking-wider"
                >
                  Ir para Tela de Login / Cadastro
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
