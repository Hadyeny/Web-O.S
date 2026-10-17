import React, { useState } from 'react';
import { AppTemplate } from '../types';
import { STARTER_TEMPLATES } from '../data';
import { Copy, Check, ArrowRight, Lightbulb } from 'lucide-react';

interface TemplateSelectorProps {
  onSelectPrompt: (prompt: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectPrompt }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (t: AppTemplate) => {
    navigator.clipboard.writeText(t.suggestedPrompt);
    setCopiedId(t.id);
    onSelectPrompt(t.suggestedPrompt);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  return (
    <section id="template-selector-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-slate-900">
              O que você gostaria de construir?
            </h3>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Escolha uma das sugestões abaixo ou diga diretamente o que você deseja criar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STARTER_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            id={`template-card-${tpl.id}`}
            className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {tpl.category}
                </span>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {tpl.badge}
                </span>
              </div>
              <h4 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {tpl.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {tpl.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                id={`btn-use-prompt-${tpl.id}`}
                type="button"
                onClick={() => onSelectPrompt(tpl.suggestedPrompt)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Usar ideia</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                id={`btn-copy-prompt-${tpl.id}`}
                type="button"
                onClick={() => handleCopy(tpl)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition cursor-pointer"
              >
                {copiedId === tpl.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copiar texto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
