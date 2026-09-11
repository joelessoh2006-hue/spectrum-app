import React, { useState } from 'react';
import { FLUTTER_SOURCE_FILES } from '../data/flutterCode';
import { DartSourceFile } from '../types';
import {
  Code2,
  Copy,
  Check,
  Download,
  FolderTree,
  FileCode,
  Flame,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import JSZip from 'jszip';

interface FlutterCodeViewerProps {
  onBackToAgenda?: () => void;
}

export const FlutterCodeViewer: React.FC<FlutterCodeViewerProps> = ({ onBackToAgenda }) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('lib/main.dart');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const currentFile: DartSourceFile =
    FLUTTER_SOURCE_FILES.find((f) => f.path === selectedFilePath) || FLUTTER_SOURCE_FILES[1];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // Add all source files to the zip archive
      FLUTTER_SOURCE_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      // Add a README.md explaining how to run
      const readmeContent = `# Spectrum (Flutter & Firebase)
> Assistant pour esprit multipotentiel

## Installation & Lancement
\`\`\`bash
# 1. Récupération des dépendances
flutter pub get

# 2. Configuration Firebase
# Configurez votre projet via FlutterFire CLI :
flutterfire configure

# 3. Lancer l'application en mode debug
flutter run
\`\`\`

## Architecture
- **Material 3 Dark Luxe** : Palette #121214 & surfaces #1E1E24 avec arrondis de 20px.
- **Provider** : State management découplé avec \`AgendaProvider\` et \`ProjectProvider\`.
- **Cloud Firestore** : Synchronisation temps réel, snapshots et persistance locale offline.
- **CustomPainter** : Tracé néon vectoriel du Ruban de Möbius d'un seul trait.
`;
      zip.file('README.md', readmeContent);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'spectrum_flutter_project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export zip failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const categories = [
    { key: 'core', label: 'Core & Thème', icon: Cpu },
    { key: 'screen', label: 'Écrans (Screens)', icon: Layers },
    { key: 'model', label: 'Modèles Firestore', icon: Flame },
    { key: 'provider', label: 'Gestion d\'État (Provider)', icon: Code2 },
    { key: 'widget', label: 'Widgets & CustomPainter', icon: Sparkles },
    { key: 'config', label: 'Configs & Règles', icon: FolderTree },
  ];

  return (
    <div className="pb-24 max-w-6xl mx-auto px-4 pt-4 text-[#EDEDED] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header with quick stats and download button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2E2E38]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6C5CE7]">
            <Code2 className="w-4 h-4" />
            <span>Architecture Senior Flutter • Cloud Firestore • Provider</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 tracking-tight">
            Structure &amp; Code Source Dart
          </h1>
          <p className="text-xs text-[#A0A0AB] mt-1">
            Code modulaire, typé et documenté prêt pour la production sous Flutter 3+ et Material 3.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="flutter-copy-file-btn"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E1E24] hover:bg-[#282830] border border-[#2E2E38] text-xs font-bold text-white transition-all shadow-md active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#55E6C1]" />
                <span className="text-[#55E6C1]">Copié dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#A0A0AB]" />
                <span>Copier ce fichier</span>
              </>
            )}
          </button>

          <button
            id="flutter-download-zip-btn"
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5a48e5] text-white text-xs font-bold shadow-lg shadow-[#6C5CE7]/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Génération...' : 'Télécharger Projet (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* Architecture Highlights Banner */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#1E1E24] border border-[#2E2E38] rounded-2xl p-4">
          <div className="text-xs font-bold text-[#6C5CE7] uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Cpu className="w-3.5 h-3.5" />
            Material 3 &amp; Dark Luxe
          </div>
          <p className="text-xs text-[#A0A0AB] leading-relaxed">
            Surfaces <code className="text-[#EDEDED]">#1E1E24</code>, rayon 20px, typographie Plus Jakarta Sans et accents chromatiques par domaine cognitif.
          </p>
        </div>

        <div className="bg-[#1E1E24] border border-[#2E2E38] rounded-2xl p-4">
          <div className="text-xs font-bold text-[#FF7675] uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5" />
            Cloud Firestore &amp; Offline
          </div>
          <p className="text-xs text-[#A0A0AB] leading-relaxed">
            Synchronisation temps réel via <code className="text-[#EDEDED]">snapshots()</code>, modèles strongly-typed et règles de sécurité.
          </p>
        </div>

        <div className="bg-[#1E1E24] border border-[#2E2E38] rounded-2xl p-4">
          <div className="text-xs font-bold text-[#55E6C1] uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Path Drawing Möbius Strip
          </div>
          <p className="text-xs text-[#A0A0AB] leading-relaxed">
            <code className="text-[#EDEDED]">CustomPainter</code> haute performance utilisant <code className="text-[#EDEDED]">PathMetric.extractPath()</code> et shaders néon.
          </p>
        </div>
      </div>

      {/* Main Code Workspace */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Sidebar: File Tree */}
        <div className="lg:col-span-4 bg-[#1E1E24] border border-[#2E2E38] rounded-[20px] p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2E2E38]">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[#6C5CE7]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Fichiers du Projet ({FLUTTER_SOURCE_FILES.length})
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#71717A]">lib/</span>
          </div>

          <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
            {categories.map((cat) => {
              const filesInCat = FLUTTER_SOURCE_FILES.filter((f) => f.category === cat.key);
              if (filesInCat.length === 0) return null;
              const Icon = cat.icon;

              return (
                <div key={cat.key} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#71717A] px-2 py-1">
                    <Icon className="w-3 h-3" />
                    <span>{cat.label}</span>
                  </div>

                  <div className="space-y-1">
                    {filesInCat.map((file) => {
                      const isSelected = selectedFilePath === file.path;
                      return (
                        <button
                          key={file.path}
                          onClick={() => setSelectedFilePath(file.path)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all border ${
                            isSelected
                              ? 'bg-[#6C5CE7]/15 border-[#6C5CE7]/40 text-white font-bold shadow-sm'
                              : 'bg-transparent border-transparent text-[#A0A0AB] hover:text-white hover:bg-[#121214]/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileCode
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? 'text-[#6C5CE7]' : 'text-[#71717A]'
                              }`}
                            />
                            <span className="truncate font-mono">{file.name}</span>
                          </div>

                          {file.path.endsWith('.dart') && (
                            <span className="text-[10px] font-mono text-[#71717A] shrink-0">
                              .dart
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Code Viewer */}
        <div className="lg:col-span-8 bg-[#1E1E24] border border-[#2E2E38] rounded-[20px] shadow-2xl overflow-hidden flex flex-col">
          {/* File Tab Header */}
          <div className="bg-[#17171B] border-b border-[#2E2E38] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#55E6C1]" />
              <span className="text-xs font-mono font-bold text-white tracking-wide">
                {currentFile.path}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#A0A0AB] hidden sm:inline">
                {currentFile.content.split('\n').length} lignes
              </span>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1E1E24] hover:bg-[#282830] border border-[#2E2E38] text-xs font-medium text-[#A0A0AB] hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-[#55E6C1]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copié' : 'Copier'}</span>
              </button>
            </div>
          </div>

          {/* Description subhead */}
          <div className="px-5 py-2.5 bg-[#121214]/50 border-b border-[#2E2E38] text-xs text-[#A0A0AB]">
            {currentFile.description}
          </div>

          {/* Code Content Container */}
          <div className="bg-[#0D0D0F] p-4 font-mono text-xs overflow-x-auto max-h-[600px] overflow-y-auto leading-relaxed scrollbar-thin">
            <pre className="text-[#D4D4D8]">
              <code>
                {currentFile.content.split('\n').map((line, i) => (
                  <div key={i} className="table-row">
                    <span className="table-cell select-none text-right pr-4 text-[#4A4A55] text-[11px] w-10">
                      {i + 1}
                    </span>
                    <span className="table-cell whitespace-pre">{line || ' '}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
