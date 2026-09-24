import React, { useState } from 'react';
import { DomainConfig, Project, TimeBlock } from '../types';
import { TASK_MASTER_PRO_PROGRAM, ProgramImportPayload } from '../data/taskMasterProgram';
import { getPillarIcon } from '../utils/iconMap';
import {
  Sparkles,
  X,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  BookOpen,
  ArrowRight,
  Download,
  Upload,
  AlertCircle,
  FileCode2,
  ListChecks,
} from 'lucide-react';

interface ImportProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DomainConfig[];
  selectedDate: Date;
  onImportProgram: (options: {
    project: Omit<Project, 'id'>;
    blocks: Omit<TimeBlock, 'id'>[];
    targetPillarId: string;
  }) => void;
}

export const ImportProgramModal: React.FC<ImportProgramModalProps> = ({
  isOpen,
  onClose,
  categories,
  selectedDate,
  onImportProgram,
}) => {
  const [selectedPillarId, setSelectedPillarId] = useState<string>(() => {
    const techCat = categories.find((c) => c.id === 'tech' || c.name.toLowerCase().includes('tech') || c.name.toLowerCase().includes('dev'));
    return techCat ? techCat.id : categories[0]?.id || 'tech';
  });

  const [startDateStr, setStartDateStr] = useState<string>(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [scheduleTime, setScheduleTime] = useState<string>('18:00');
  const [skipSundays, setSkipSundays] = useState<boolean>(false);
  const [includeAgendaBlocks, setIncludeAgendaBlocks] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'json'>('overview');
  const [customJsonText, setCustomJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentProgram: ProgramImportPayload = (() => {
    if (customJsonText.trim()) {
      try {
        const parsed = JSON.parse(customJsonText);
        if (parsed.project && parsed.dailyPlan) return parsed;
      } catch (_) {}
    }
    return TASK_MASTER_PRO_PROGRAM;
  })();

  const targetCategory = categories.find((c) => c.id === selectedPillarId) || categories[0] || {
    id: 'tech',
    name: 'Tech / Dev',
    color: '#6C5CE7',
    iconName: 'Terminal',
  };

  const TargetIcon = getPillarIcon(targetCategory.iconName);

  // Compute scheduled dates preview
  const generateDatesPreview = () => {
    const dates: string[] = [];
    const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
    let cur = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);

    let count = 0;
    while (count < currentProgram.dailyPlan.length) {
      const dayOfWeek = cur.getDay(); // 0 = Sun
      if (skipSundays && dayOfWeek === 0) {
        cur.setDate(cur.getDate() + 1);
        continue;
      }
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      count++;
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(TASK_MASTER_PRO_PROGRAM, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `programme_spectrum_task_master_pro.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyCustomJson = () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(customJsonText);
      if (!parsed.project || !parsed.dailyPlan || !Array.isArray(parsed.dailyPlan)) {
        throw new Error("Le format JSON doit contenir les clés 'project' et 'dailyPlan'.");
      }
      setActiveTab('overview');
    } catch (err: any) {
      setJsonError(err.message || 'JSON invalide');
    }
  };

  const handleConfirmImport = () => {
    const plannedDates = generateDatesPreview();

    // 1. Prepare Project
    const newProject: Omit<Project, 'id'> = {
      title: currentProgram.project.title,
      domain: selectedPillarId,
      description: currentProgram.project.description,
      progress: 0,
      status: 'in_progress',
      bentoSize: currentProgram.project.bentoSize || 'large',
      milestones: currentProgram.project.milestones.map((m, idx) => ({
        id: `m-prog-${Date.now()}-${idx}`,
        title: m.title,
        completed: false,
      })),
      notes: currentProgram.project.notes,
      tags: currentProgram.project.tags || ['Dev Web', 'Full-Stack'],
      targetCompletionDate: currentProgram.project.targetCompletionDate,
    };

    // Map milestone indices to created milestone IDs
    const milestoneMap: Record<string, string> = {};
    currentProgram.project.milestones.forEach((m, idx) => {
      milestoneMap[m.id] = newProject.milestones[idx].id;
    });

    // 2. Prepare TimeBlocks if requested
    const newBlocks: Omit<TimeBlock, 'id'>[] = [];
    if (includeAgendaBlocks) {
      const [startH, startM] = scheduleTime.split(':').map(Number);
      const startMinutes = (startH || 18) * 60 + (startM || 0);

      currentProgram.dailyPlan.forEach((planItem, idx) => {
        const assignedDate = plannedDates[idx] || startDateStr;
        const duration = planItem.durationMinutes || 120;
        const endMinutes = Math.min(23 * 60 + 59, startMinutes + duration);
        const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
        const endM = String(endMinutes % 60).padStart(2, '0');
        const endTimeStr = `${endH}:${endM}`;

        const subtasks = planItem.subtasks.map((stText, stIdx) => ({
          id: `st-${Date.now()}-${idx}-${stIdx}`,
          text: stText,
          completed: false,
        }));

        const mappedMilestoneId = milestoneMap[planItem.milestoneId] || newProject.milestones[0]?.id;

        newBlocks.push({
          title: `Jour ${planItem.dayNumber} : ${planItem.title}`,
          domain: selectedPillarId,
          date: assignedDate,
          startTime: scheduleTime,
          endTime: endTimeStr,
          startMinutes,
          durationMinutes: duration,
          isRecurring: false,
          recurringDays: [],
          globalObjective: planItem.objective,
          subtasks,
          notes: `### 🎯 Jour ${planItem.dayNumber} — Semaine ${planItem.weekNumber}\n- **Objectif de session** : ${planItem.objective}\n- **Projet** : ${currentProgram.project.title}\n- **Jalon associé** : ${planItem.milestoneId}`,
          milestoneId: mappedMilestoneId,
        });
      });
    }

    onImportProgram({
      project: newProject,
      blocks: newBlocks,
      targetPillarId: selectedPillarId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col text-[var(--text-primary)] shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-card)] flex items-start justify-between gap-3 bg-[var(--bg-surface-elevated)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#00CEC9] text-white flex items-center justify-center shadow-md shadow-[#6C5CE7]/30 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#00CEC9] bg-[#00CEC9]/10 px-2 py-0.5 rounded-full border border-[#00CEC9]/30">
                  Import Automatique Clé en Main
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-[var(--text-primary)] mt-0.5">
                Intégrer le Programme Web « Task Master Pro »
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-[var(--border-card)] bg-[var(--bg-surface)]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#6C5CE7] text-[#6C5CE7]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Configuration &amp; Aperçu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'curriculum'
                ? 'border-[#6C5CE7] text-[#6C5CE7]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Programme des 56 Jours (8 Semaines)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'json'
                ? 'border-[#6C5CE7] text-[#6C5CE7]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Fichier JSON brut</span>
          </button>
        </div>

        {/* Content area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 max-h-[68vh] scrollbar-thin">
          
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Highlight summary banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#6C5CE7]/15 to-[#00CEC9]/15 border border-[#6C5CE7]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {currentProgram.project.title}
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#6C5CE7] text-white font-bold">
                    8 semaines • 56 sessions de 2h
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {currentProgram.project.description}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-[var(--text-secondary)] flex-wrap">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#55E6C1]" />
                    <strong>14 Jalons Bento</strong> structurés
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#00CEC9]" />
                    <strong>112 heures</strong> de code &amp; d'audit IA
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#FAB1A0]" />
                    <strong>Carnet de bord</strong> prérempli
                  </span>
                </div>
              </div>

              {/* Pilier de rattachement */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                  1. Pilier de destination dans Spectrum :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => {
                    const Icon = getPillarIcon(cat.iconName);
                    const isSelected = selectedPillarId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedPillarId(cat.id)}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? 'border-[#6C5CE7] bg-[#6C5CE7]/10 ring-1 ring-[#6C5CE7]'
                            : 'border-[var(--border-card)] bg-[var(--bg-surface-elevated)] hover:border-[var(--border-highlight)]'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Planification dans l'Agenda */}
              <div className="p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={includeAgendaBlocks}
                      onChange={(e) => setIncludeAgendaBlocks(e.target.checked)}
                      className="rounded text-[#6C5CE7] focus:ring-[#6C5CE7] cursor-pointer"
                    />
                    <span>2. Planifier automatiquement les 56 sessions quotidiennes dans l'Agenda</span>
                  </label>
                </div>

                {includeAgendaBlocks && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border-card)]">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                        Date de début (Jour 1)
                      </label>
                      <input
                        type="date"
                        value={startDateStr}
                        onChange={(e) => setStartDateStr(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] text-[var(--text-primary)] focus:outline-none focus:border-[#6C5CE7]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                        Heure quotidienne (session 2h)
                      </label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] text-[var(--text-primary)] focus:outline-none focus:border-[#6C5CE7]"
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-secondary)] pt-3">
                        <input
                          type="checkbox"
                          checked={skipSundays}
                          onChange={(e) => setSkipSundays(e.target.checked)}
                          className="rounded text-[#6C5CE7] focus:ring-[#6C5CE7] cursor-pointer"
                        />
                        <span>Sauter les dimanches (repos)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Ce qui va être créé */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-card)] space-y-2 text-xs">
                <span className="font-bold text-[var(--text-primary)] block">
                  Résumé de ce qui sera injecté en 1 clic :
                </span>
                <ul className="space-y-1.5 text-[var(--text-secondary)] list-disc pl-4">
                  <li>
                    <strong>1 Projet Bento complet</strong> avec ses 14 jalons officiels, taille large, tags et date cible.
                  </li>
                  <li>
                    <strong>Carnet de bord &amp; Notes</strong> comprenant toutes les documentations MDN/Node/Express/PostgreSQL, aides-mémoires et grille d'audit IA.
                  </li>
                  {includeAgendaBlocks && (
                    <li>
                      <strong>56 blocs de 2h dans l'Agenda</strong> avec pour chacun son objectif précis, son jalon relié et sa checklist de 4 sous-tâches concrètes prête pour le mode Focus !
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pb-1 border-b border-[var(--border-card)]">
                <span>Détail des 56 sessions quotidiennes (Checklists prêtes)</span>
                <span>56 jours / 8 semaines</span>
              </div>

              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {currentProgram.dailyPlan.map((item) => (
                  <div
                    key={item.dayNumber}
                    className="p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        Jour {item.dayNumber} : {item.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-card)] text-[var(--text-secondary)]">
                        Semaine {item.weekNumber} • 2h
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      🎯 {item.objective}
                    </p>
                    <div className="pt-1 flex flex-wrap gap-1">
                      {item.subtasks.map((st, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-card)] truncate max-w-xs"
                        >
                          ✓ {st}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Fichier JSON structuré (téléchargeable ou modifiable)
                </span>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-card)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#00CEC9]" />
                  <span>Télécharger le .json</span>
                </button>
              </div>

              <textarea
                rows={12}
                value={customJsonText || JSON.stringify(TASK_MASTER_PRO_PROGRAM, null, 2)}
                onChange={(e) => setCustomJsonText(e.target.value)}
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl p-3 text-[11px] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#6C5CE7] leading-relaxed"
              />

              {jsonError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}

              {customJsonText && (
                <button
                  type="button"
                  onClick={handleApplyCustomJson}
                  className="px-3.5 py-1.5 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold transition cursor-pointer"
                >
                  Appliquer ce JSON modifié
                </button>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-card)] flex items-center justify-between gap-3 bg-[var(--bg-surface-elevated)]">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
            title="Télécharger une copie du fichier JSON sur votre appareil"
          >
            <Download className="w-3.5 h-3.5 text-[#00CEC9]" />
            <span className="hidden sm:inline">Télécharger le fichier JSON</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#6C5CE7]/30 hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Importer tout dans Spectrum</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
