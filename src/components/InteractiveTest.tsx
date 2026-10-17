import React, { useState } from 'react';
import { MousePointerClick, RotateCcw, Plus, Check } from 'lucide-react';

export const InteractiveTest: React.FC = () => {
  const [clickCount, setClickCount] = useState<number>(0);
  const [inputText, setInputText] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<string[]>([
    'Ambiente testado e aprovado',
  ]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setSavedNotes((prev) => [inputText.trim(), ...prev]);
    setInputText('');
  };

  return (
    <div id="interactive-test-container" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <MousePointerClick className="w-5 h-5 text-indigo-600" />
        <h3 className="text-base font-semibold text-slate-900">
          Teste Rápido de Interatividade
        </h3>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        Clique nos botões abaixo para confirmar que a interface e o estado estão respondendo instantaneamente.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Counter test */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Contador em Tempo Real
            </span>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              {clickCount} <span className="text-sm font-normal text-slate-500">cliques</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Testa a reatividade do React e atualização do DOM.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/60">
            <button
              id="btn-increment-counter"
              type="button"
              onClick={() => setClickCount((c) => c + 1)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Clique Aqui (+1)
            </button>
            <button
              id="btn-reset-counter"
              type="button"
              onClick={() => setClickCount(0)}
              title="Zerar contador"
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Input test */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Teste de Formulário
            </span>
            <form onSubmit={handleAddNote} className="mt-2 flex gap-2">
              <input
                id="input-quick-note"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Digite algo para testar..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                id="btn-add-note"
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition cursor-pointer"
              >
                Adicionar
              </button>
            </form>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60">
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Itens salvos:</span>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {savedNotes.map((note, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  {note}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
