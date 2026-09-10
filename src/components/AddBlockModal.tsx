import React, { useState } from 'react';
import { DomainId, TimeBlock } from '../types';
import { DOMAINS } from '../data/mockData';
import { X, Plus, Clock, Flag, AlignLeft } from 'lucide-react';

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (block: Omit<TimeBlock, 'id'>) => void;
  defaultDate?: Date;
}

export const AddBlockModal: React.FC<AddBlockModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<DomainId>('tech');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:30');
  const [globalObjective, setGlobalObjective] = useState('');
  const [firstTask, setFirstTask] = useState('');
  const [isSpecificDate, setIsSpecificDate] = useState<boolean>(true);
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = defaultDate || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);
    const durationMinutes = Math.max(30, endMinutes - startMinutes);

    onAdd({
      title: title.trim(),
      domain,
      date: isSpecificDate ? scheduledDate : undefined,
      startTime,
      endTime,
      startMinutes,
      durationMinutes,
      isRecurring: !isSpecificDate,
      recurringDays: [1, 2, 3, 4, 5],
      globalObjective: globalObjective.trim() || 'Objectif du bloc défini en session.',
      notes: '',
      checklist: firstTask.trim()
        ? [{ id: `item-${Date.now()}`, title: firstTask.trim(), isCompleted: false }]
        : [
            { id: `item-${Date.now()}-1`, title: 'Cadrage initial du bloc', isCompleted: false },
            { id: `item-${Date.now()}-2`, title: 'Exécution focalisée sans interruption', isCompleted: false },
          ],
    });

    setTitle('');
    setGlobalObjective('');
    setFirstTask('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#1E1E24] border border-[#2E2E38] rounded-[20px] w-full max-w-lg p-6 text-[#EDEDED] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#2E2E38]">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#6C5CE7]" />
            <h2 className="text-lg font-bold">Nouveau Bloc de Temps</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#A0A0AB] hover:text-white hover:bg-[#282830] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Domain Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-2 uppercase tracking-wider">
              Pilier Multipotentiel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DOMAINS) as DomainId[]).map((dId) => {
                const cfg = DOMAINS[dId];
                const isSelected = domain === dId;
                return (
                  <button
                    key={dId}
                    type="button"
                    onClick={() => setDomain(dId)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      isSelected
                        ? 'border-white/30 text-white shadow-lg'
                        : 'border-[#2E2E38] text-[#A0A0AB] bg-[#121214]/60 hover:bg-[#121214]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? cfg.bgRgba : undefined,
                      borderColor: isSelected ? cfg.color : undefined,
                    }}
                  >
                    <span style={{ color: isSelected ? cfg.color : undefined }}>
                      {cfg.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5 uppercase tracking-wider">
              Titre du Bloc
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Architecture de streaming Firestore..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#121214] border border-[#2E2E38] rounded-xl px-4 py-2.5 text-sm text-[#EDEDED] placeholder-[#71717A] focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>

          {/* Date / Scheduling Mode */}
          <div className="bg-[#121214] p-3 rounded-xl border border-[#2E2E38] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A0A0AB] uppercase tracking-wider">
                Planification Temporelle
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSpecificDate(true)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    isSpecificDate
                      ? 'bg-[#6C5CE7] text-white'
                      : 'text-[#A0A0AB] hover:text-white bg-[#1E1E24]'
                  }`}
                >
                  Date Précise
                </button>
                <button
                  type="button"
                  onClick={() => setIsSpecificDate(false)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    !isSpecificDate
                      ? 'bg-[#6C5CE7] text-white'
                      : 'text-[#A0A0AB] hover:text-white bg-[#1E1E24]'
                  }`}
                >
                  Hebdomadaire Récurrent
                </button>
              </div>
            </div>

            {isSpecificDate ? (
              <div>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-[#1E1E24] border border-[#2E2E38] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#6C5CE7]"
                />
              </div>
            ) : (
              <p className="text-[11px] text-[#71717A]">
                Ce bloc se répétera automatiquement du Lundi au Vendredi.
              </p>
            )}
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Début
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#121214] border border-[#2E2E38] rounded-xl px-4 py-2 text-sm text-[#EDEDED] focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Fin
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#121214] border border-[#2E2E38] rounded-xl px-4 py-2 text-sm text-[#EDEDED] focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
          </div>

          {/* Global Objective */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <Flag className="w-3.5 h-3.5" /> Objectif Global (Roadmap)
            </label>
            <textarea
              rows={2}
              placeholder="Résultat concret attendu à la fin de cette session..."
              value={globalObjective}
              onChange={(e) => setGlobalObjective(e.target.value)}
              className="w-full bg-[#121214] border border-[#2E2E38] rounded-xl px-4 py-2.5 text-sm text-[#EDEDED] placeholder-[#71717A] focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>

          {/* Initial Checklist Item */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5" /> Première sous-tâche
            </label>
            <input
              type="text"
              placeholder="Ex: Rédiger la spécification technique..."
              value={firstTask}
              onChange={(e) => setFirstTask(e.target.value)}
              className="w-full bg-[#121214] border border-[#2E2E38] rounded-xl px-4 py-2 text-sm text-[#EDEDED] placeholder-[#71717A] focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#2E2E38]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#A0A0AB] hover:bg-[#282830]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#6C5CE7] hover:bg-[#5b4be0] text-white shadow-lg shadow-[#6C5CE7]/25"
            >
              <Plus className="w-4 h-4" />
              Créer le bloc
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
