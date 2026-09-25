export type DomainId = string;

export interface DomainConfig {
  id: string;
  name: string;
  label: string;
  color: string;
  colorSecondary?: string;
  bgRgba?: string;
  borderRgba?: string;
  iconName: string;
  description?: string;
  order?: number;
  createdAt?: string;
}

export type ThemeMode = 'light' | 'dark';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface FloatingTask {
  id: string;
  text: string;
  targetDate: string; // "YYYY-MM-DD"
  completed: boolean;
  domain?: DomainId;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  domain: DomainId;
  date?: string; // Format "YYYY-MM-DD" for specific day, or undefined if recurring
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "11:00"
  startMinutes: number; // minutes from 00:00 for positioning
  durationMinutes: number;
  isRecurring: boolean;
  recurringDays: number[]; // 1=Mon, 7=Sun
  globalObjective: string;
  subtasks: Subtask[];
  checklist?: ChecklistItem[]; // kept for compatibility
  notes: string;
  projectId?: string;
  milestoneId?: string; // ID optionnel du jalon/sous-tâche spécifique lié au projet
  isFocusSessionActive?: boolean;
  completed?: boolean;
  isFixedConstraint?: boolean; // Vrai si événement importé (contrainte fixe/agenda externe)
  isAllDay?: boolean;          // Vrai si événement sur toute la journée (anniversaire, fête, congé...)
  isYearly?: boolean;          // Vrai si rendez-vous annuel qui se répète chaque année (ex: anniversaire)
  sourceCalendar?: string;     // Ex: "Calendrier Xiaomi", "Google Calendar", "Fichier .ics"
  location?: string;
  reminderEnabled?: boolean;   // Active/désactive le rappel de notification pour cette activité
  reminderMinutesBefore?: number; // 0 = à l'heure, 5 = 5 min avant, 10 = 10 min avant, 15 = 15 min avant, 30 = 30 min avant
}

export interface ImportedCalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  dateStr: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  durationMinutes: number;
  description?: string;
  location?: string;
  source?: string;
  importAs: 'constraint' | 'spectrum_block';
  selectedPillarId: string;
  included: boolean;
  isAllDay?: boolean;
  isYearly?: boolean;          // Vrai si rendez-vous annuel
  classificationReason?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectQuickNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface MonthlyGoal {
  id: string;
  monthKey: string; // Format "YYYY-MM", ex: "2026-09"
  title: string;
  completed: boolean;
  domain?: DomainId;
  projectId?: string;
  notes?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  domain: DomainId;
  description: string;
  progress: number; // 0 to 100
  status: 'in_progress' | 'ideation' | 'paused' | 'completed' | 'archived';
  bentoSize: 'small' | 'medium' | 'large'; // for bento layout
  milestones: ProjectMilestone[];
  notes?: string; // Carnet / notes libres
  quickNotes?: ProjectQuickNote[]; // Mémos courts datés
  targetCompletionDate?: string;
  tags: string[];
  archived?: boolean;
  archivedAt?: string;
  completionDate?: string;
}

export interface DartSourceFile {
  path: string;
  name: string;
  category: 'core' | 'model' | 'provider' | 'screen' | 'widget' | 'config' | 'service';
  description: string;
  content: string;
}
