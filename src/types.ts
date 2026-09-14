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
  isFocusSessionActive?: boolean;
  completed?: boolean;
  isFixedConstraint?: boolean; // Vrai si événement importé (contrainte fixe/agenda externe)
  sourceCalendar?: string;     // Ex: "Calendrier Xiaomi", "Google Calendar", "Fichier .ics"
  location?: string;
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
}

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
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
