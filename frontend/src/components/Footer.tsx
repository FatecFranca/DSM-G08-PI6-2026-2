import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#FAF9F6] text-stone-500 py-12 border-t border-stone-200 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <span className="font-extrabold text-stone-900 tracking-wider uppercase text-sm">Agendou.</span>
          <span className="text-stone-300">|</span>
          <span className="text-stone-600">Projeto Interdisciplinar 6º Semestre • FATEC</span>
        </div>
        <p className="text-stone-400 font-mono text-[11px]">
          React • Vite • TypeScript • Tailwind CSS • Minimalist Aesthetic
        </p>
      </div>
    </footer>
  );
};
