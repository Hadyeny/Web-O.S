import React from 'react';
import { CheckCircle2, Server, Cpu, Globe, RefreshCw } from 'lucide-react';

interface StatusCardProps {
  onRefreshCheck: () => void;
  lastChecked: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({ onRefreshCheck, lastChecked }) => {
  return (
    <section id="status-card-section" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 mt-0.5">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Aplicação Carregada com Sucesso!
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              O projeto foi inicializado e a tela já está respondendo normalmente.
            </p>
          </div>
        </div>

        <button
          id="btn-refresh-status"
          type="button"
          onClick={onRefreshCheck}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Verificar Status
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
          <Server className="w-5 h-5 text-slate-600 mt-0.5" />
          <div>
            <div className="text-xs text-slate-500 font-medium">Servidor Local</div>
            <div className="text-sm font-semibold text-slate-800 mt-0.5">Ativo na Porta 3000</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">Conexão estável</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
          <Cpu className="w-5 h-5 text-slate-600 mt-0.5" />
          <div>
            <div className="text-xs text-slate-500 font-medium">Renderização</div>
            <div className="text-sm font-semibold text-slate-800 mt-0.5">React 19 & Tailwind</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">Compilação rápida</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
          <Globe className="w-5 h-5 text-slate-600 mt-0.5" />
          <div>
            <div className="text-xs text-slate-500 font-medium">Última Checagem</div>
            <div className="text-sm font-semibold text-slate-800 mt-0.5">{lastChecked}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">100% Funcional</div>
          </div>
        </div>
      </div>
    </section>
  );
};
