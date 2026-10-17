import React, { useState } from 'react';
import { X, Plus, AlertCircle, User, Wrench, ShieldAlert } from 'lucide-react';
import { Client, User as UserType, OSPriority } from '../types';

interface CreateOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  technicians: UserType[];
  onSubmit: (data: {
    clientId: string;
    clientName: string;
    equipment: string;
    category: string;
    description: string;
    priority: OSPriority;
    technicianId?: string;
  }) => void;
}

export const CreateOSModal: React.FC<CreateOSModalProps> = ({
  isOpen,
  onClose,
  clients,
  technicians,
  onSubmit,
}) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [equipment, setEquipment] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<OSPriority>('Média');
  const [technicianId, setTechnicianId] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let clientName = customClientName;
    if (selectedClientId) {
      const found = clients.find((c) => c.id === selectedClientId);
      if (found) clientName = found.name;
    }

    if (!clientName) {
      setError('Por favor selecione ou informe o nome do cliente.');
      return;
    }

    if (!equipment) {
      setError('Informe o equipamento ou item atrelado (ex: Servidor, Notebook Dell).');
      return;
    }

    if (!description) {
      setError('Forneça um detalhamento inicial da ocorrência.');
      return;
    }

    onSubmit({
      clientId: selectedClientId,
      clientName,
      equipment,
      category,
      description,
      priority,
      technicianId: technicianId || undefined,
    });

    // Reset
    setSelectedClientId('');
    setCustomClientName('');
    setEquipment('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Nova Ordem de Serviço (O.S.)</h2>
              <p className="text-xs text-slate-400">Cadastre um novo chamado de TI no sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Client Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Cliente
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                if (e.target.value) setCustomClientName('');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            >
              <option value="">-- Selecione um Cliente da Lista --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
            {!selectedClientId && (
              <input
                type="text"
                placeholder="Ou digite a Razão Social / Nome do Cliente"
                value={customClientName}
                onChange={(e) => setCustomClientName(e.target.value)}
                className="mt-2 w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            )}
          </div>

          {/* Equipment & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Equipamento / Ativo
              </label>
              <input
                type="text"
                placeholder="Ex: Servidor, Notebook HP"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              >
                <option value="Hardware">Hardware</option>
                <option value="Rede">Rede / Wi-Fi</option>
                <option value="Servidores">Servidores / Backup</option>
                <option value="Sistemas">Sistemas / ERP</option>
                <option value="Periféricos">Periféricos / Impressora</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Priority & Assigned Technician */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as OSPriority)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Técnico Responsável
              </label>
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              >
                <option value="">-- Atribuir Depois --</option>
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

          {/* Issue Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-slate-500" />
              Descrição do Problema
            </label>
            <textarea
              rows={3}
              placeholder="Descreva o defeito relatado, sintomas ou solicitação..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition resize-none"
            ></textarea>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25 transition transform active:scale-95"
            >
              Abrir O.S.
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
