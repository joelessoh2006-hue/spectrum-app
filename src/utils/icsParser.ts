import { ImportedCalendarEvent } from '../types';

/**
 * Parses an iCalendar (.ics) string into an array of ImportedCalendarEvent objects.
 * Compatible with exports from Xiaomi Calendar, Google Calendar, Apple iCal, Outlook, etc.
 */
export function parseICS(
  icsContent: string,
  defaultPillarId: string = 'tech',
  defaultDate?: Date
): ImportedCalendarEvent[] {
  const events: ImportedCalendarEvent[] = [];

  // Step 1: Unfold lines according to RFC 5545 (lines beginning with space or tab are continuations)
  const unfolded = icsContent
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '')
    .replace(/\r/g, '');

  const lines = unfolded.split('\n');

  let inEvent = false;
  let currentEventProps: Record<string, string> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEventProps = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      inEvent = false;
      const parsed = createEventFromProps(currentEventProps, defaultPillarId, defaultDate);
      if (parsed) {
        events.push(parsed);
      }
      continue;
    }

    if (inEvent) {
      // Split on first colon, but handle properties with parameters (e.g. DTSTART;TZID=...:20260913T090000)
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        const fullKey = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);
        const keyName = fullKey.split(';')[0].toUpperCase();
        currentEventProps[keyName] = value;

        // Also store parameters if needed
        if (fullKey.includes(';')) {
          currentEventProps[`${keyName}_PARAMS`] = fullKey.split(';').slice(1).join(';');
        }
      }
    }
  }

  return events;
}

/**
 * Parse an ICS date string:
 * - 20260913T090000Z
 * - 20260913T090000
 * - 20260913
 */
function parseICSDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const cleaned = dateStr.trim();

  // Full datetime: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const dtMatch = cleaned.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (dtMatch) {
    const year = parseInt(dtMatch[1], 10);
    const month = parseInt(dtMatch[2], 10) - 1;
    const day = parseInt(dtMatch[3], 10);
    const hour = parseInt(dtMatch[4], 10);
    const min = parseInt(dtMatch[5], 10);
    const sec = parseInt(dtMatch[6], 10);

    if (cleaned.endsWith('Z')) {
      return new Date(Date.UTC(year, month, day, hour, min, sec));
    }
    return new Date(year, month, day, hour, min, sec);
  }

  // Date only: YYYYMMDD (All-day event)
  const dMatch = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dMatch) {
    const year = parseInt(dMatch[1], 10);
    const month = parseInt(dMatch[2], 10) - 1;
    const day = parseInt(dMatch[3], 10);
    return new Date(year, month, day, 0, 0, 0); // All-day events start at 00:00:00
  }

  return null;
}

function formatTwoDigits(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

function unescapeICSText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Smart detection: Guess if the event should be imported as a fixed constraint
 * (doctor, meeting, admin) or converted to a creative Spectrum Pillar block.
 */
export function guessCategoryAndType(
  title: string,
  description: string,
  defaultPillarId: string
): { importAs: 'constraint' | 'spectrum_block'; pillarId: string; reason: string } {
  const combined = `${title} ${description}`.toLowerCase();

  // 1. Médical & Santé
  const medicalKeywords = [
    'docteur', 'dentiste', 'médical', 'medical', 'medecin', 'médecin',
    'kiné', 'kine', 'psy', 'ophtalmo', 'santé', 'sante', 'clinique',
    'hopital', 'hôpital', 'pharmacie', 'vaccin', 'ordonnance', 'dentist',
    'consultation', 'doctolib'
  ];
  for (const kw of medicalKeywords) {
    if (combined.includes(kw)) {
      return {
        importAs: 'constraint',
        pillarId: defaultPillarId,
        reason: '🏥 Santé & Médical → Contrainte fixe verrouillée',
      };
    }
  }

  // 2. Réunions & Sync professionnelles
  const meetingKeywords = [
    'réunion', 'reunion', 'meeting', 'call', 'sync', 'standup', 'entretien',
    'interview', '1:1', 'point', 'debrief', 'revue', 'client', 'soutenance',
    'visio', 'zoom', 'teams', 'meet', 'google meet'
  ];
  for (const kw of meetingKeywords) {
    if (combined.includes(kw)) {
      return {
        importAs: 'constraint',
        pillarId: defaultPillarId,
        reason: '💼 Réunion & Échange pro → Contrainte fixe verrouillée',
      };
    }
  }

  // 3. Cours, Université & Études
  const schoolKeywords = [
    'cours', 'exam', 'examen', 'partiel', 'td', 'tp', 'amphi', 'université',
    'universite', 'école', 'ecole', 'formation', 'classe', 'devoir', 'leçon', 'lecon', 'prof'
  ];
  for (const kw of schoolKeywords) {
    if (combined.includes(kw)) {
      return {
        importAs: 'constraint',
        pillarId: defaultPillarId,
        reason: '🎓 Cours & Études → Contrainte horaire fixe',
      };
    }
  }

  // 4. Administratif & Quotidien
  const adminKeywords = [
    'banque', 'impots', 'impôts', 'mairie', 'prefecture', 'préfecture',
    'poste', 'colis', 'courses', 'ménage', 'menage', 'garage', 'admin',
    'rendez-vous', 'rdv', 'facture', 'notaire'
  ];
  for (const kw of adminKeywords) {
    if (combined.includes(kw)) {
      return {
        importAs: 'constraint',
        pillarId: defaultPillarId,
        reason: '📋 Administratif / Démarche → Contrainte fixe',
      };
    }
  }

  // 5. Transports & Trajets
  const transportKeywords = [
    'train', 'sncf', 'tgv', 'ter', 'vol', 'avion', 'trajet', 'bus',
    'covoiturage', 'uber', 'gare', 'aeroport', 'aéroport', 'départ', 'arrivee'
  ];
  for (const kw of transportKeywords) {
    if (combined.includes(kw)) {
      return {
        importAs: 'constraint',
        pillarId: defaultPillarId,
        reason: '🚆 Transport & Trajet → Créneau fixe bloqué',
      };
    }
  }

  // 6. Événements festifs / Calendrier personnel (anniversaires, vacances, fériés)
  const personalKeywords = [
    'anniversaire', 'fête', 'fete', 'vacances', 'férié', 'ferie',
    'congé', 'conge', 'rtt', 'noel', 'noël', 'nouvel an'
  ];
  for (const kw of personalKeywords) {
    if (combined.includes(kw)) {
      return {
        importAs: 'constraint',
        pillarId: defaultPillarId,
        reason: '🎉 Repère agenda / Personnel → Contrainte repère',
      };
    }
  }

  // 7. Tech & Développement
  const techKeywords = [
    'code', 'dev', 'flutter', 'react', 'python', 'javascript', 'typescript',
    'cyber', 'nmap', 'linux', 'serveur', 'cloud', 'database', 'algo', 'bug',
    'api', 'docker', 'git', 'github', 'architecture', 'front', 'backend', 'ia', 'gemini'
  ];
  for (const kw of techKeywords) {
    if (combined.includes(kw)) {
      return {
        importAs: 'spectrum_block',
        pillarId: 'tech',
        reason: '💻 Tech & Développement → Suggéré en Bloc Actif (Pilier Tech)',
      };
    }
  }

  // 8. Art & Création musicale / visuelle
  const artKeywords = [
    'rap', 'musique', 'beat', 'prod', 'chant', 'guitare', 'piano', 'studio',
    'mix', 'mastering', 'dessin', 'graphisme', 'photo', 'vidéo', 'video',
    'montage', 'écriture', 'ecriture', 'texte', 'clip', 'tournage', 'voix'
  ];
  for (const kw of artKeywords) {
    if (combined.includes(kw)) {
      return {
        importAs: 'spectrum_block',
        pillarId: 'art',
        reason: '🎨 Art & Création → Suggéré en Bloc Actif (Pilier Art)',
      };
    }
  }

  // 9. Curiosité & Exploration
  const curiosityKeywords = [
    'lecture', 'livre', 'recherche', 'podcast', 'veille', 'philosophie',
    'neuro', 'science', 'conférence', 'conference', 'article', 'synthèse',
    'synthese', 'documentaire'
  ];
  for (const kw of curiosityKeywords) {
    if (combined.includes(kw)) {
      return {
        importAs: 'spectrum_block',
        pillarId: 'curiosity',
        reason: '📚 Curiosité & Synthèse → Suggéré en Bloc Actif (Pilier Curiosité)',
      };
    }
  }

  // Default: import as fixed constraint to prevent clutter, but easy to toggle
  return {
    importAs: 'constraint',
    pillarId: defaultPillarId,
    reason: '🔒 Créneau extérieur → Suggéré en Contrainte fixe (modifiable)',
  };
}

function createEventFromProps(
  props: Record<string, string>,
  defaultPillarId: string,
  targetFallbackDate?: Date
): ImportedCalendarEvent | null {
  let rawTitle = (props['SUMMARY'] || '').trim();
  if (!rawTitle) {
    if (props['DESCRIPTION'] && props['DESCRIPTION'].trim()) {
      rawTitle = props['DESCRIPTION'].trim().split('\n')[0].substring(0, 50);
    } else if (props['LOCATION'] && props['LOCATION'].trim()) {
      rawTitle = `Rendez-vous à : ${props['LOCATION'].trim()}`;
    } else {
      rawTitle = 'Événement calendrier sans titre';
    }
  }
  const title = unescapeICSText(rawTitle);
  const description = props['DESCRIPTION'] ? unescapeICSText(props['DESCRIPTION'].trim()) : undefined;
  const location = props['LOCATION'] ? unescapeICSText(props['LOCATION'].trim()) : undefined;

  const startDate = parseICSDate(props['DTSTART']);
  if (!startDate) return null;

  let endDate = parseICSDate(props['DTEND']);
  if (!endDate || endDate <= startDate) {
    // Default duration 60 mins if missing
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  }

  const durationMinutes = Math.max(15, Math.round((endDate.getTime() - startDate.getTime()) / 60000));

  const year = startDate.getFullYear();
  const month = formatTwoDigits(startDate.getMonth() + 1);
  const day = formatTwoDigits(startDate.getDate());
  const dateStr = `${year}-${month}-${day}`;

  const startTime = `${formatTwoDigits(startDate.getHours())}:${formatTwoDigits(startDate.getMinutes())}`;
  const endTime = `${formatTwoDigits(endDate.getHours())}:${formatTwoDigits(endDate.getMinutes())}`;

  const isDateOnly = Boolean(
    (props['DTSTART_PARAMS'] && props['DTSTART_PARAMS'].toUpperCase().includes('VALUE=DATE')) ||
    (props['DTSTART'] && props['DTSTART'].trim().length === 8)
  );

  const rawTitleLower = rawTitle.toLowerCase();
  const isBirthday =
    rawTitleLower.includes('birthday') ||
    rawTitleLower.includes('anniversaire') ||
    rawTitleLower.includes('anniv') ||
    rawTitleLower.includes('fête') ||
    rawTitleLower.includes('fete') ||
    rawTitleLower.includes('naissance');

  const rruleStr = (props['RRULE'] || '').toUpperCase();
  const isYearlyRrule = rruleStr.includes('FREQ=YEARLY');
  const isYearly = isYearlyRrule || isBirthday;

  const isAllDay =
    isDateOnly ||
    durationMinutes >= 1440 ||
    (startTime === '00:00' && (endTime === '00:00' || endTime === '23:59')) ||
    isBirthday;

  const finalStartTime = isAllDay ? 'Toute la journée' : startTime;
  const finalEndTime = isAllDay ? 'Toute la journée' : endTime;
  const finalDurationMinutes = isAllDay ? 1440 : durationMinutes;

  const categoryResult = isBirthday
    ? {
        importAs: 'constraint' as const,
        pillarId: 'constraint',
        reason: '🎂 Anniversaire / Rendez-vous annuel (Journée entière)',
      }
    : isAllDay
    ? {
        importAs: 'constraint' as const,
        pillarId: 'constraint',
        reason: '📅 Événement journée entière (All-Day)',
      }
    : guessCategoryAndType(title, description || '', defaultPillarId);

  return {
    id: props['UID'] || `ics-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    startDate,
    endDate,
    dateStr,
    startTime: finalStartTime,
    endTime: finalEndTime,
    durationMinutes: finalDurationMinutes,
    description,
    location,
    source: 'Fichier .ics / Xiaomi / Google',
    importAs: categoryResult.importAs,
    selectedPillarId: categoryResult.pillarId,
    included: true,
    isAllDay,
    isYearly,
    classificationReason: categoryResult.reason,
  };
}

/**
 * Realistic demonstration sample of an ICS export from a Xiaomi Smartphone (MIUI/HyperOS / Google Calendar sync)
 * Contains both fixed constraints (medical, sync) and technical/creative sessions.
 */
export function getSampleXiaomiICS(currentDate: Date = new Date()): string {
  const y = currentDate.getFullYear();
  const m = formatTwoDigits(currentDate.getMonth() + 1);
  const d = formatTwoDigits(currentDate.getDate());
  const dateBase = `${y}${m}${d}`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Xiaomi Inc//MIUI Calendar 13.0//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Calendrier Xiaomi (joelessoh)
X-WR-TIMEZONE:Europe/Paris
BEGIN:VEVENT
UID:xiaomi-evt-001@miui.com
DTSTART:${dateBase}T083000
DTEND:${dateBase}T093000
SUMMARY:Point d'équipe & Sync Hebdomadaire
DESCRIPTION:Revue des priorités, blocages et planification des sprints.
LOCATION:Google Meet
END:VEVENT
BEGIN:VEVENT
UID:xiaomi-evt-002@miui.com
DTSTART:${dateBase}T100000
DTEND:${dateBase}T120000
SUMMARY:Audit Cybersécurité & Scan Réseau
DESCRIPTION:Cartographie des ports ouverts avec nmap et analyse des en-têtes HTTP de l'infrastructure.
LOCATION:Lab de sécurité local
END:VEVENT
BEGIN:VEVENT
UID:xiaomi-evt-003@miui.com
DTSTART:${dateBase}T130000
DTEND:${dateBase}T140000
SUMMARY:Rendez-vous Médical / Santé
DESCRIPTION:Bilan semestriel de routine.
LOCATION:Cabinet Médical Central
END:VEVENT
BEGIN:VEVENT
UID:xiaomi-evt-004@miui.com
DTSTART:${dateBase}T160000
DTEND:${dateBase}T173000
SUMMARY:Session Enregistrement Rap & Sound Design
DESCRIPTION:Prise de voix sur le couplet 2 et mixage des drums 808.
LOCATION:Home Studio
END:VEVENT
END:VCALENDAR`;
}
