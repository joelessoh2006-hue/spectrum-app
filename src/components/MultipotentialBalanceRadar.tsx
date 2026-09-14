import React, { useState } from 'react';
import { TimeBlock, DomainConfig } from '../types';
import { getPillarIcon } from '../utils/iconMap';
import {
  Compass,
  PieChart as PieIcon,
  HelpCircle,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MultipotentialBalanceRadarProps {
  blocks: TimeBlock[];
  categories: DomainConfig[];
  selectedDate: Date;
}

export const MultipotentialBalanceRadar: React.FC<MultipotentialBalanceRadarProps> = ({
  blocks,
  categories,
  selectedDate,
}) => {
  const [period, setPeriod] = useState<'week' | 'day' | 'all'>('week');
  const [activeTab, setActiveTab] = useState<'donut' | 'radar'>('donut');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [hoveredPillar, setHoveredPillar] = useState<string | null>(null);

  // 1. Détermination de la plage de dates
  // Semaine courante basée sur selectedDate (lundi au dimanche)
  const getWeekRange = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diffToMonday = current.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(current.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);

    const weekDays: string[] = [];
    const weekDaysNumbers: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      weekDays.push(str);
      const dow = d.getDay() === 0 ? 7 : d.getDay();
      weekDaysNumbers.push(dow);
    }

    return { monday, weekDays, weekDaysNumbers };
  };

  const { monday, weekDays, weekDaysNumbers } = getWeekRange(selectedDate);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const selectedDateStr = `${selectedDate.getFullYear()}-${String(
    selectedDate.getMonth() + 1
  ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedDow = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();

  // 2. Filtrage des blocs selon la période
  const relevantBlocks = blocks.filter((block) => {
    if (period === 'all') return true;
    if (period === 'day') {
      if (block.date) return block.date === selectedDateStr;
      if (block.isRecurring && Array.isArray(block.recurringDays)) {
        return block.recurringDays.includes(selectedDow);
      }
      return false;
    }
    // 'week'
    if (block.date) {
      return weekDays.includes(block.date);
    }
    if (block.isRecurring && Array.isArray(block.recurringDays)) {
      return block.recurringDays.some((d) => weekDaysNumbers.includes(d));
    }
    return false;
  });

  // 3. Calcul du temps cumulé en minutes et en heures par pilier
  const pillarDurations: Record<string, number> = {};
  categories.forEach((cat) => {
    pillarDurations[cat.id] = 0;
  });

  relevantBlocks.forEach((b) => {
    // Si récurrent sur la semaine, calculer le nombre de jours récurrents qui tombent dans la semaine
    let occurrences = 1;
    if (period === 'week' && !b.date && b.isRecurring && Array.isArray(b.recurringDays)) {
      occurrences = b.recurringDays.filter((d) => weekDaysNumbers.includes(d)).length || 1;
    }
    const mins = (b.durationMinutes || 60) * occurrences;
    pillarDurations[b.domain] = (pillarDurations[b.domain] || 0) + mins;
  });

  const totalMinutes = Object.values(pillarDurations).reduce((acc, v) => acc + v, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  // Calcul du % et des métriques par pilier
  const pillarStats = categories.map((cat) => {
    const mins = pillarDurations[cat.id] || 0;
    const hours = Math.round((mins / 60) * 10) / 10;
    const percent = totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0;
    return {
      cat,
      mins,
      hours,
      percent,
    };
  });

  // 4. Calcul du Score d'Harmonie & Équilibre Multipotentiel (0 à 100%)
  // Formule basée sur la répartition uniforme idéale (ex. pour 3 piliers: 33% chacun).
  // L'indice d'écart moyen par rapport à l'uniformité donne le score d'équilibre.
  const n = categories.length;
  let balanceScore = 0;
  if (totalMinutes > 0 && n > 1) {
    const idealPercent = 100 / n;
    const sumDiff = pillarStats.reduce((acc, p) => acc + Math.abs(p.percent - idealPercent), 0);
    // Pire cas théorique : 100% sur un seul pilier, 0% sur les autres
    // maxDiff = (100 - ideal) + (n-1)*ideal = 2 * (100 - 100/n)
    const maxDiff = 2 * (100 - idealPercent);
    const scoreRaw = 100 - (sumDiff / (maxDiff || 1)) * 100;
    balanceScore = Math.max(10, Math.min(100, Math.round(scoreRaw)));
  } else if (totalMinutes > 0) {
    balanceScore = 100;
  }

  // Diagnostic qualitatif
  const getBalanceBadge = (score: number) => {
    if (totalMinutes === 0) {
      return {
        label: 'En attente d’activités',
        color: 'var(--text-muted)',
        bg: 'var(--bg-surface-elevated)',
        desc: 'Planifiez ou lancez des sessions pour observer votre équilibre.',
      };
    }
    if (score >= 80) {
      return {
        label: 'Harmonie Remarquable',
        color: '#55E6C1',
        bg: '#55E6C115',
        desc: 'Vos différents piliers de vie reçoivent une attention équilibrée et fluide.',
      };
    }
    if (score >= 55) {
      return {
        label: 'Équilibre Bon / Centré',
        color: '#6C5CE7',
        bg: '#6C5CE715',
        desc: 'Un pilier domine légèrement cette période, tout en préservant les autres.',
      };
    }
    return {
      label: 'Polarisation Forte',
      color: '#FF7675',
      bg: '#FF767515',
      desc: 'Attention : un domaine monopolise votre temps au détriment des autres passions.',
    };
  };

  const balanceBadge = getBalanceBadge(balanceScore);

  // Pilier le plus délaissé et pilier le plus investi
  const activeStatsSorted = [...pillarStats].sort((a, b) => b.mins - a.mins);
  const topPillar = activeStatsSorted[0]?.mins > 0 ? activeStatsSorted[0] : null;
  const lowestPillar =
    activeStatsSorted[activeStatsSorted.length - 1]?.mins === 0
      ? activeStatsSorted[activeStatsSorted.length - 1]
      : null;

  // Format date range string
  const formatShortDate = (d: Date) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  // 5. Calcul SVG pour le Donut Chart interactif
  // Rayon 60, centre 80, 80
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  // 6. Calcul SVG pour le Radar Polygon
  // Polygone régulier à N côtés
  const radarCenter = 80;
  const radarMaxRadius = 55;
  const maxHours = Math.max(...pillarStats.map((p) => p.hours), 1);

  const radarPoints = pillarStats.map((p, index) => {
    const angle = (Math.PI * 2 * index) / (categories.length || 1) - Math.PI / 2;
    // Ratio de 0.15 (minimum pour visibilité) à 1
    const valueRatio = Math.max(0.12, p.hours / (maxHours * 1.1));
    const r = valueRatio * radarMaxRadius;
    const x = radarCenter + r * Math.cos(angle);
    const y = radarCenter + r * Math.sin(angle);
    return { x, y, angle, cat: p.cat, hours: p.hours, percent: p.percent };
  });

  const radarPolygonPath = radarPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden transition-all">
      {/* Background glow ambiance */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-10 transition-colors"
        style={{
          backgroundColor:
            balanceScore >= 75 ? '#55E6C1' : balanceScore >= 50 ? '#6C5CE7' : '#FF7675',
        }}
      />

      {/* Header : Title + Score + Collapse Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-card)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#00CEC9] text-white flex items-center justify-center shadow-sm">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                Radar d’Équilibre Multipotentiel
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#6C5CE7]/15 text-[#6C5CE7]">
                Analytics
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Visualisez la répartition de votre énergie pour nourrir chacun de vos piliers sans culpabilité.
            </p>
          </div>
        </div>

        {/* Right side : Period toggles & Accordion toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-xl p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPeriod('day')}
              className={`px-2.5 py-1 rounded-lg transition ${
                period === 'day'
                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Jour
            </button>
            <button
              type="button"
              onClick={() => setPeriod('week')}
              className={`px-2.5 py-1 rounded-lg transition ${
                period === 'week'
                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Semaine
            </button>
            <button
              type="button"
              onClick={() => setPeriod('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                period === 'all'
                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Global
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title={isExpanded ? 'Réduire' : 'Agrandir'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-4 space-y-6 animate-fadeIn">
          {/* Top KPI row: Score d'Harmonie & Diagnostic */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Score d'Harmonie */}
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Indice d'Équilibre
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span
                    className="text-2xl md:text-3xl font-mono font-black"
                    style={{ color: balanceBadge.color }}
                  >
                    {totalMinutes > 0 ? `${balanceScore}%` : '—'}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">
                    / 100
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-medium">
                  {balanceBadge.label}
                </p>
              </div>

              {/* Jauge semi-circulaire ou mini circle */}
              <div className="w-12 h-12 rounded-2xl border flex items-center justify-center font-mono font-bold text-xs"
                style={{
                  backgroundColor: balanceBadge.bg,
                  borderColor: `${balanceBadge.color}35`,
                  color: balanceBadge.color,
                }}
              >
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            {/* 2. Total Temps Consacré */}
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Temps Total ({period === 'week' ? 'Semaine' : period === 'day' ? 'Journée' : 'Global'})
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl md:text-3xl font-mono font-black text-[var(--text-primary)]">
                  {totalHours}h
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  ({totalMinutes} min)
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                {period === 'week'
                  ? `Du ${formatShortDate(monday)} au ${formatShortDate(sunday)}`
                  : period === 'day'
                  ? `Focus du ${formatShortDate(selectedDate)}`
                  : 'Cumul de tous les blocs'}
              </p>
            </div>

            {/* 3. Conseil Anti-Culpabilité / Suggestion */}
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <Info className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Diagnostic Fluide</span>
              </div>
              <p className="text-xs text-[var(--text-primary)] mt-1 leading-snug">
                {lowestPillar ? (
                  <>
                    Le pilier <strong style={{ color: lowestPillar.cat.color }}>« {lowestPillar.cat.name} »</strong> n'a pas encore reçu de session. Prévoyez un petit bloc de 30 min !
                  </>
                ) : topPillar ? (
                  <>
                    <strong style={{ color: topPillar.cat.color }}>« {topPillar.cat.name} »</strong> est votre moteur actuel ({topPillar.hours}h - {topPillar.percent}%).
                  </>
                ) : (
                  'Aucune activité enregistrée sur cette période.'
                )}
              </p>
              <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                {categories.length} piliers configurés
              </div>
            </div>
          </div>

          {/* Core Graphical Area: Donut or Radar + Pillars Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Visual Chart Container (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl relative">
              {/* Toggle switch between Donut & Radar */}
              <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-xl p-0.5 text-[11px] font-semibold mb-2 self-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('donut')}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                    activeTab === 'donut'
                      ? 'bg-[#6C5CE7] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <PieIcon className="w-3.5 h-3.5" />
                  <span>Anneau de Répartition</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('radar')}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                    activeTab === 'radar'
                      ? 'bg-[#6C5CE7] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Radar Polygone</span>
                </button>
              </div>

              {/* Graphic Display */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                {activeTab === 'donut' ? (
                  /* SVG DONUT CHART */
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                    {/* Background circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      className="stroke-[var(--border-card)]"
                      strokeWidth="16"
                      fill="transparent"
                    />

                    {totalMinutes === 0 ? (
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke="var(--border-card)"
                        strokeWidth="16"
                        strokeDasharray="4 6"
                        fill="transparent"
                      />
                    ) : (
                      pillarStats.map((p) => {
                        const strokeDasharray = `${(p.percent / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                        cumulativePercent += p.percent;

                        const isHovered = hoveredPillar === p.cat.id;

                        return (
                          <circle
                            key={p.cat.id}
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke={p.cat.color}
                            strokeWidth={isHovered ? 20 : 16}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            fill="transparent"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredPillar(p.cat.id)}
                            onMouseLeave={() => setHoveredPillar(null)}
                          />
                        );
                      })
                    )}
                  </svg>
                ) : (
                  /* SVG RADAR POLYGON */
                  <svg className="w-full h-full" viewBox="0 0 160 160">
                    {/* Concentric Guide Circles */}
                    {[0.25, 0.5, 0.75, 1].map((scale) => (
                      <circle
                        key={scale}
                        cx={radarCenter}
                        cy={radarCenter}
                        r={radarMaxRadius * scale}
                        fill="transparent"
                        stroke="var(--border-card)"
                        strokeWidth="1"
                        strokeDasharray={scale === 1 ? undefined : '2 3'}
                      />
                    ))}

                    {/* Radial axis lines for each category */}
                    {categories.map((cat, idx) => {
                      const angle = (Math.PI * 2 * idx) / (categories.length || 1) - Math.PI / 2;
                      const x2 = radarCenter + radarMaxRadius * Math.cos(angle);
                      const y2 = radarCenter + radarMaxRadius * Math.sin(angle);
                      return (
                        <line
                          key={cat.id}
                          x1={radarCenter}
                          y1={radarCenter}
                          x2={x2}
                          y2={y2}
                          stroke="var(--border-card)"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Polygon fill */}
                    {totalMinutes > 0 && (
                      <polygon
                        points={radarPolygonPath}
                        fill="#6C5CE7"
                        fillOpacity="0.25"
                        stroke="#6C5CE7"
                        strokeWidth="2"
                        className="transition-all duration-500"
                      />
                    )}

                    {/* Data Points on vertices */}
                    {radarPoints.map((pt) => {
                      const isHovered = hoveredPillar === pt.cat.id;
                      return (
                        <g key={pt.cat.id}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 6 : 4}
                            fill={pt.cat.color}
                            stroke="white"
                            strokeWidth="1.5"
                            className="transition-all cursor-pointer"
                            onMouseEnter={() => setHoveredPillar(pt.cat.id)}
                            onMouseLeave={() => setHoveredPillar(null)}
                          />
                        </g>
                      );
                    })}
                  </svg>
                )}

                {/* Center Badge in Donut */}
                {activeTab === 'donut' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-tight">
                      {hoveredPillar
                        ? categories.find((c) => c.id === hoveredPillar)?.name
                        : 'Harmonie'}
                    </span>
                    <span
                      className="text-xl font-mono font-extrabold tracking-tight"
                      style={{
                        color: hoveredPillar
                          ? categories.find((c) => c.id === hoveredPillar)?.color
                          : balanceBadge.color,
                      }}
                    >
                      {hoveredPillar
                        ? `${pillarStats.find((p) => p.cat.id === hoveredPillar)?.percent}%`
                        : `${balanceScore}%`}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                      {hoveredPillar
                        ? `${pillarStats.find((p) => p.cat.id === hoveredPillar)?.hours}h`
                        : `${totalHours}h total`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Pillar List Breakdown (7 cols) */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] pb-1 px-1">
                <span>Pilier d'épanouissement</span>
                <span className="font-mono">Volume & Proportion</span>
              </div>

              {pillarStats.map(({ cat, hours, mins, percent }) => {
                const Icon = getPillarIcon(cat.iconName);
                const isHovered = hoveredPillar === cat.id;

                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setHoveredPillar(cat.id)}
                    onMouseLeave={() => setHoveredPillar(null)}
                    className={`p-2.5 sm:p-3 rounded-2xl border transition-all ${
                      isHovered
                        ? 'border-[#6C5CE7] bg-[var(--bg-surface-elevated)] ring-1 ring-[#6C5CE7]/30 shadow-sm'
                        : 'border-[var(--border-card)] bg-[var(--bg-surface-elevated)]/60 hover:bg-[var(--bg-surface-elevated)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: cat.color }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                          {cat.name}
                        </span>
                        {cat.label && (
                          <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">
                            • {cat.label}
                          </span>
                        )}
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                          {hours}h
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            borderColor: `${cat.color}35`,
                            color: cat.color,
                          }}
                        >
                          {percent}%
                        </span>
                      </div>
                    </div>

                    {/* Individual progress bar */}
                    <div className="w-full h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-card)]">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
