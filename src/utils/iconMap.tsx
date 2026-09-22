import React from 'react';
import {
  Terminal,
  Flame,
  Compass,
  Sparkles,
  Code2,
  Music,
  Palette,
  BookOpen,
  Dumbbell,
  Briefcase,
  Heart,
  Camera,
  Mic,
  Brain,
  Globe,
  Feather,
  Lightbulb,
  Coffee,
  Zap,
  Layers,
  Star,
  Rocket,
  Wrench,
  Smile,
  PenTool,
  Film,
  Headphones,
  Laptop,
  GraduationCap,
  Hammer,
  Radio,
  Gamepad2,
  Folder,
  DollarSign,
  CircleDollarSign,
  Coins,
  Banknote,
  Euro,
} from 'lucide-react';

export const PILLAR_ICON_DEFINITIONS: { name: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { name: 'DollarSign', label: 'Finance & Revenus', icon: DollarSign },
  { name: 'CircleDollarSign', label: 'Business & Argent', icon: CircleDollarSign },
  { name: 'Coins', label: 'Investissement & Épargne', icon: Coins },
  { name: 'Banknote', label: 'Monnaie & Revenus', icon: Banknote },
  { name: 'Euro', label: 'Finance Euro', icon: Euro },
  { name: 'Briefcase', label: 'Business & Stratégie', icon: Briefcase },
  { name: 'Rocket', label: 'Projet & Lancement', icon: Rocket },
  { name: 'Terminal', label: 'Tech & Code', icon: Terminal },
  { name: 'Code2', label: 'Développement', icon: Code2 },
  { name: 'Laptop', label: 'Informatique', icon: Laptop },
  { name: 'Flame', label: 'Création & Flow', icon: Flame },
  { name: 'Music', label: 'Musique & Son', icon: Music },
  { name: 'Headphones', label: 'Audio & Mix', icon: Headphones },
  { name: 'Mic', label: 'Chant & Voix', icon: Mic },
  { name: 'Palette', label: 'Art & Design', icon: Palette },
  { name: 'PenTool', label: 'Graphisme', icon: PenTool },
  { name: 'Camera', label: 'Photo & Vidéo', icon: Camera },
  { name: 'Film', label: 'Cinéma & Vidéo', icon: Film },
  { name: 'Compass', label: 'Exploration', icon: Compass },
  { name: 'BookOpen', label: 'Lecture & Savoir', icon: BookOpen },
  { name: 'Brain', label: 'Neurosciences & Esprit', icon: Brain },
  { name: 'Lightbulb', label: 'Idées & Réflexion', icon: Lightbulb },
  { name: 'GraduationCap', label: 'Études & Formation', icon: GraduationCap },
  { name: 'Zap', label: 'Énergie & Productivité', icon: Zap },
  { name: 'Dumbbell', label: 'Sport & Santé', icon: Dumbbell },
  { name: 'Heart', label: 'Bien-être & Vie', icon: Heart },
  { name: 'Coffee', label: 'Pause & Rituel', icon: Coffee },
  { name: 'Globe', label: 'Langues & Monde', icon: Globe },
  { name: 'Feather', label: 'Écriture & Poésie', icon: Feather },
  { name: 'Gamepad2', label: 'Jeux & Loisirs', icon: Gamepad2 },
  { name: 'Hammer', label: 'Bricolage & Makers', icon: Hammer },
  { name: 'Sparkles', label: 'Inspiration', icon: Sparkles },
  { name: 'Star', label: 'Objectif Majeur', icon: Star },
];

export const PILLAR_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  DollarSign,
  Dollar: DollarSign,
  CircleDollarSign,
  Coins,
  Banknote,
  Euro,
  Terminal,
  Flame,
  Compass,
  Sparkles,
  Code2,
  Code: Code2,
  Music,
  Palette,
  BookOpen,
  Dumbbell,
  Briefcase,
  Heart,
  Camera,
  Mic,
  Brain,
  Globe,
  Feather,
  Lightbulb,
  Coffee,
  Zap,
  Layers,
  Star,
  Rocket,
  Wrench,
  Smile,
  PenTool,
  Film,
  Headphones,
  Laptop,
  GraduationCap,
  Hammer,
  Radio,
  Gamepad2,
  Folder,
};

export const PRESET_PILLAR_COLORS = [
  { hex: '#6C5CE7', name: 'Violet Électrique' },
  { hex: '#FF7675', name: 'Corail Vif' },
  { hex: '#55E6C1', name: 'Menthe / Turquoise' },
  { hex: '#0984E3', name: 'Bleu Intense' },
  { hex: '#FDCB6E', name: 'Ambre Solaire' },
  { hex: '#FD79A8', name: 'Framboise Pastel' },
  { hex: '#00CEC9', name: 'Cyan Néon' },
  { hex: '#10AC84', name: 'Vert Émeraude' },
  { hex: '#E17055', name: 'Orange Terre' },
  { hex: '#8E44AD', name: 'Pourpre Royal' },
  { hex: '#4F46E5', name: 'Indigo Profond' },
  { hex: '#636E72', name: 'Ardoise Métal' },
];

/**
 * Suggestions d'émojis populaires pour la personnalisation rapide
 */
export const POPULAR_PILLAR_EMOJIS = [
  '💵', '💰', '💸', '🤑', '💎', '📈', '💼',
  '💻', '⚡', '🔥', '🎯', '🚀', '🎨', '🎵',
  '🏋️', '🧠', '📚', '🧘', '🌍', '☕', '🌟'
];

/**
 * Détermine si une chaîne est un émoji ou un symbole personnalisé direct
 */
export function isCustomEmojiOrSymbol(iconName?: string): boolean {
  if (!iconName) return false;
  // S'il commence par "custom:" ou "emoji:" ou si ce n'est pas dans la liste des icônes Lucide connues
  if (iconName.startsWith('emoji:') || iconName.startsWith('custom:')) return true;
  // Détection des caractères émojis / unicode étendu ou symboles non alphabétiques courts
  const isRegisteredLucide = iconName in PILLAR_ICON_MAP;
  if (isRegisteredLucide) return false;
  return true;
}

/**
 * Extrait le caractère brut si préfixé par emoji: ou custom:
 */
export function getRawEmojiOrSymbol(iconName?: string): string {
  if (!iconName) return '✨';
  if (iconName.startsWith('emoji:') || iconName.startsWith('custom:')) {
    return iconName.split(':')[1] || '✨';
  }
  return iconName;
}

export function getPillarIcon(iconName?: string): React.ComponentType<{ className?: string }> {
  if (!iconName) return Sparkles;

  // Si c'est un émoji ou un symbole personnalisé saisi par l'utilisateur
  if (isCustomEmojiOrSymbol(iconName)) {
    const raw = getRawEmojiOrSymbol(iconName);
    const EmojiComponent: React.FC<{ className?: string }> = ({ className = '' }) => {
      // Extrait les dimensions relatives ou fournit un rendu émoji centré
      return (
        <span
          className={`inline-flex items-center justify-center select-none font-normal leading-none ${className}`}
          style={{ fontSize: '1.25em' }}
          role="img"
          aria-label="Icône personnalisée"
        >
          {raw}
        </span>
      );
    };
    EmojiComponent.displayName = `EmojiIcon_${raw}`;
    return EmojiComponent;
  }

  return PILLAR_ICON_MAP[iconName] || Sparkles;
}
