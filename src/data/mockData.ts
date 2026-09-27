import { DomainConfig, Project, TimeBlock } from '../types';

export const DOMAINS: Record<string, DomainConfig> = {
  tech: {
    id: 'tech',
    name: 'Tech / Dev',
    label: 'Architecture & Code',
    color: '#6C5CE7',
    colorSecondary: '#00CEC9',
    bgRgba: 'rgba(108, 92, 231, 0.12)',
    borderRgba: 'rgba(108, 92, 231, 0.35)',
    iconName: 'Terminal',
    description: 'Systèmes logiciels, architecture Flutter, algo & infrastructures cloud',
  },
  art: {
    id: 'art',
    name: 'Art / Rap',
    label: 'Création & Flow',
    color: '#FF7675',
    colorSecondary: '#FAB1A0',
    bgRgba: 'rgba(255, 118, 117, 0.12)',
    borderRgba: 'rgba(255, 118, 117, 0.35)',
    iconName: 'Flame',
    description: 'Écriture de textes, production instrumentale, sound design & DA visuelle',
  },
  curiosity: {
    id: 'curiosity',
    name: 'Curiosité',
    label: 'Exploration & Synthèse',
    color: '#55E6C1',
    colorSecondary: '#10AC84',
    bgRgba: 'rgba(85, 230, 193, 0.12)',
    borderRgba: 'rgba(85, 230, 193, 0.35)',
    iconName: 'Compass',
    description: 'Neurosciences, philosophie des systèmes, veille cross-disciplinaire',
  },
};

export const INITIAL_TIME_BLOCKS: TimeBlock[] = [
  {
    id: 'block-demo-1',
    title: 'Architecture & Développement Backend / API',
    domain: 'tech',
    startTime: '08:30',
    endTime: '10:30',
    startMinutes: 8 * 60 + 30,
    durationMinutes: 120,
    isRecurring: true,
    recurringDays: [1, 2, 3, 4, 5],
    globalObjective: 'Structurer les modèles de données et sécuriser les règles d’accès en temps réel.',
    notes: `### 🛡️ Objectifs de la session :
- Mettre en place une architecture découplée et maintenable.
- Optimiser les requêtes et les index pour des temps de réponse ultra-rapides.
- Vérifier la robustesse de la persistance offline.`,
    checklist: [
      { id: 'c1-1', title: 'Définir les schémas de données et types stricts', isCompleted: true },
      { id: 'c1-2', title: 'Configurer les converters et la sérialisation', isCompleted: true },
      { id: 'c1-3', title: 'Écrire les tests unitaires et d’intégration', isCompleted: false },
    ],
    subtasks: [
      { id: 'c1-1', text: 'Définir les schémas de données et types stricts', completed: true },
      { id: 'c1-2', text: 'Configurer les converters et la sérialisation', completed: true },
      { id: 'c1-3', text: 'Écrire les tests unitaires et d’intégration', completed: false },
    ],
    projectId: 'proj-demo-1',
  },
  {
    id: 'block-demo-2',
    title: 'Design UI & Prototypage de Composants',
    domain: 'art',
    startTime: '11:00',
    endTime: '12:30',
    startMinutes: 11 * 60,
    durationMinutes: 90,
    isRecurring: true,
    recurringDays: [1, 3, 5],
    globalObjective: 'Affiner l’ergonomie visuelle et l’interactivité des cartes de projets.',
    notes: '• Travailler la hiérarchie visuelle, les contrastes et les micro-interactions.\n• Valider l’adaptabilité mobile et desktop.',
    checklist: [
      { id: 'c2-1', title: 'Harmoniser les palettes de couleurs et typographies', isCompleted: true },
      { id: 'c2-2', title: 'Tester les transitions et animations d’état', isCompleted: false },
    ],
    subtasks: [
      { id: 'c2-1', text: 'Harmoniser les palettes de couleurs et typographies', completed: true },
      { id: 'c2-2', text: 'Tester les transitions et animations d’état', completed: false },
    ],
    projectId: 'proj-demo-2',
  },
  {
    id: 'block-demo-3',
    title: 'Veille Technologique & Synthèse',
    domain: 'curiosity',
    startTime: '14:00',
    endTime: '15:30',
    startMinutes: 14 * 60,
    durationMinutes: 90,
    isRecurring: true,
    recurringDays: [2, 4],
    globalObjective: 'Explorer les dernières innovations et documenter les retours d’expérience.',
    notes: '• Analyser les évolutions de frameworks et les patterns d’architecture modernes.',
    checklist: [
      { id: 'c3-1', title: 'Lecture d’articles techniques et benchmarks', isCompleted: true },
      { id: 'c3-2', title: 'Rédaction d’une note de synthèse', isCompleted: true },
    ],
    subtasks: [
      { id: 'c3-1', text: 'Lecture d’articles techniques et benchmarks', completed: true },
      { id: 'c3-2', text: 'Rédaction d’une note de synthèse', completed: true },
    ],
    projectId: 'proj-demo-3',
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-demo-1',
    title: 'Plateforme Web & Application Mobile',
    domain: 'tech',
    description: 'Développement d’une solution moderne full-stack avec architecture réactive, synchronisation temps réel et interface soignée.',
    progress: 60,
    status: 'in_progress',
    bentoSize: 'large',
    targetCompletionDate: '2026-11-15',
    tags: ['Architecture', 'Cloud', 'Frontend', 'API'],
    notes: 'Conception modulaire et découplée pour garantir performance et scalabilité.',
    quickNotes: [
      { id: 'qn-1', text: 'Optimiser le chargement initial et le cache local', createdAt: '12 sept.' },
      { id: 'qn-2', text: 'Tester la fluidité sur différents écrans et appareils', createdAt: '14 sept.' }
    ],
    milestones: [
      { id: 'm1-1', title: 'Cadrage technique et modélisation des données', completed: true },
      { id: 'm1-2', title: 'Développement du socle frontend et des composants clés', completed: true },
      { id: 'm1-3', title: 'Intégration de la synchronisation en temps réel', completed: true },
      { id: 'm1-4', title: 'Tests d’intégration et audit de performance', completed: false },
    ],
  },
  {
    id: 'proj-demo-2',
    title: 'Design System & Identité de Marque',
    domain: 'art',
    description: 'Création d’un écosystème visuel complet : charte graphique, typographies, tokens de design et composants interactifs.',
    progress: 45,
    status: 'in_progress',
    bentoSize: 'medium',
    targetCompletionDate: '2026-12-01',
    tags: ['Design System', 'UI/UX', 'Figma', 'Tokens'],
    milestones: [
      { id: 'm2-1', title: 'Définition des palettes chromatiques et des contrastes', completed: true },
      { id: 'm2-2', title: 'Création de la bibliothèque de composants réutilisables', completed: false },
      { id: 'm2-3', title: 'Documentation des guidelines d’accessibilité', completed: false },
    ],
  },
  {
    id: 'proj-demo-3',
    title: 'Veille Stratégique & Apprentissage Continu',
    domain: 'curiosity',
    description: 'Synthèse multidisciplinaire reliant innovations technologiques, ergonomie cognitive et optimisation des méthodes de travail.',
    progress: 70,
    status: 'in_progress',
    bentoSize: 'medium',
    targetCompletionDate: '2026-12-20',
    tags: ['Stratégie', 'Veille', 'Méthodologie'],
    milestones: [
      { id: 'm3-1', title: 'Recherche documentaire et cartographie des tendances', completed: true },
      { id: 'm3-2', title: 'Synthèse des meilleures pratiques de productivité', completed: true },
      { id: 'm3-3', title: 'Partage des retours d’expérience et publication', completed: false },
    ],
  },
];
