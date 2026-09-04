import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="font-black text-white text-sm">Agendou!</span>
          <span>— Projeto Interdisciplinar (PI) 6º Semestre | FATEC</span>
        </div>
        <p className="text-slate-500">
          React • Vite • TypeScript • Tailwind CSS • Node.js REST API • Machine Learning (NLP)
        </p>
      </div>
    </footer>
  );
};
