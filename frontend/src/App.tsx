import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Agendamento } from './pages/Agendamento';
import { DashboardPrestador } from './pages/DashboardPrestador';
import { Avaliacao } from './pages/Avaliacao';
import { Login } from './pages/Login';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'agendamento':
        return <Agendamento onNavigate={setCurrentPage} />;
      case 'dashboard':
        return <DashboardPrestador onNavigate={setCurrentPage} />;
      case 'avaliacao':
        return <Avaliacao onNavigate={setCurrentPage} />;
      case 'login':
        return <Login onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-grow">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
