export type DomainId = 'tech' | 'art' | 'curiosity';

export interface DomainConfig {
  id: DomainId;
  name: string;
  label: string;
  color: string;
  colorSecondary: string;
  bgRgba: string;
  borderRgba: string;
  iconName: string;
  description: string;
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
  checklist: ChecklistItem[];
  notes: string;
  projectId?: string;
  isFocusSessionActive?: boolean;
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
  status: 'in_progress' | 'ideation' | 'paused' | 'completed';
  bentoSize: 'small' | 'medium' | 'large'; // for bento layout
  milestones: ProjectMilestone[];
  targetCompletionDate?: string;
  tags: string[];
}

export interface DartSourceFile {
  path: string;
  name: string;
  category: 'core' | 'model' | 'provider' | 'screen' | 'widget' | 'config';
  description: string;
  content: string;
}
