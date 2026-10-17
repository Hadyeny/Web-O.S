import React, { useState } from 'react';
import {
  X,
  User,
  Clock,
  ShieldAlert,
  Send,
  MessageSquare,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  History,
} from 'lucide-react';
import { ServiceOrder, OSStatus, OSPriority, User as UserType } from '../types';

interface OSDetailDrawerProps {
  os: ServiceOrder | null;
  onClose: () => void;
  technicians: UserType[];
  currentUser: UserType;
  onUpdateStatus: (osId: string, status: OSStatus, technicianId?: string) => void;
  onAddNote: (osId: string, noteContent: string) => void;
  onDeleteOS?: (osId: string) => void;
}

export const OSDetailDrawer: React.FC<OSDetailDrawerProps> = ({
  os,
  onClose,
  technicians,
  currentUser,
  onUpdateStatus,
  onAddNote,
  onDeleteOS,
}) => {
  const [noteText, setNoteText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OSStatus | ''>('');
  const [selectedTech, setSelectedTech] = useState<string>('');

  if (!os) return null;

  const handleStatusChange = (newStatus: OSStatus) => {
    setSelectedStatus(newStatus);
    onUpdateStatus(os.id, newStatus, selectedTech || os.technicianId);
  };

  const handleTechChange = (newTechId: string) => {
    setSelectedTech(newTechId);
    onUpdateStatus(os.id, os.status, newTechId);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(os.id, noteText);
    setNoteText('');
  };

  const statusOptions: OSStatus[] = [
    'Aberta',
    'Em Andamento',
    'Aguardando Peças',
    'Aguardando Cliente',
    'Finalizado',
    'Encerrado',
  ];

  return (
    <div 
      className="fixed inset-0 w-screen h-screen bg-slate-950/40 backdrop-blur-sm z-50 flex justify-end overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-xl text-blue-400">{os.id}</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  os.status === 'Finalizado'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : os.status === 'Em Andamento'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {os.status}
              </span>
            </div>
            <h2 className="font-bold text-lg text-white mt-1">{os.clientName}</h2>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.role === 'admin' && onDeleteOS && (
              <button
                onClick={() => {
                  if (confirm(`Tem certeza que deseja excluir a ${os.id}?`)) {
                    onDeleteOS(os.id);
                    onClose();
                  }
                }}
                className="p-2 text-rose-400 hover:text-rose-200 hover:bg-rose-900/40 rounded-xl transition"
                title="Excluir O.S."
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stalled Alert if applicable */}
        {(os.stalledHours || 0) >= 48 && os.status !== 'Finalizado' && (
          <div className="bg-rose-600 text-white px-6 py-2.5 flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 animate-bounce shrink-0" />
            <span>Alerta de SLA: Chamado sem movimentação há {os.stalledHours} horas.</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Actions Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Alterar Status
              </label>
              <select
                value={os.status}
                onChange={(e) => handleStatusChange(e.target.value as OSStatus)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Reassign Technician */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Técnico Atribuído
              </label>
              <select
                value={os.technicianId || ''}
                onChange={(e) => handleTechChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Sem técnico definido</option>
                {technicians
                  .filter((t) => t.role === 'technician' || (t.role as string) === 'TECNICO')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Details Card */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Informações do Chamado
            </h3>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-slate-400 block font-medium">Equipamento / Ativo:</span>
                  <span className="font-bold text-slate-800">{os.equipment}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Categoria:</span>
                  <span className="font-bold text-slate-800">{os.category}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-slate-400 block font-medium">Prioridade:</span>
                  <span className="font-bold text-slate-800">{os.priority}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Data de Abertura:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(os.createdAt).toLocaleDateString()} às{' '}
                    {new Date(os.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-1">Descrição Inicial:</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed font-normal border border-slate-100">
                  {os.description}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline Notes & Updates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" />
                Histórico de Andamento & Apontamentos
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                {os.notes?.length || 0} registros
              </span>
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar novo apontamento técnico..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition transform active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Registrar</span>
              </button>
            </form>

            {/* Notes List */}
            <div className="space-y-2.5 pt-2">
              {(!os.notes || os.notes.length === 0) ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Nenhum apontamento técnico registrado ainda.
                </div>
              ) : (
                os.notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <User className="w-3 h-3 text-blue-600" />
                        {n.authorName} ({n.authorRole})
                      </span>
                      <span className="text-[10px]">
                        {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-snug pt-1">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Fechar
          </button>

          <button
            onClick={() => handleStatusChange('Finalizado')}
            disabled={os.status === 'Finalizado'}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Concluir Chamado</span>
          </button>
        </div>
      </div>
    </div>
  );
};
