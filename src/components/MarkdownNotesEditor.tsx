import React, { useState, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  Bold,
  Italic,
  Code,
  Terminal,
  List,
  ListTodo,
  Link2,
  Heading2,
  Heading3,
  Quote,
  Eye,
  Edit3,
  Columns,
  Copy,
  Check,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  FileText,
  X,
} from 'lucide-react';

interface MarkdownNotesEditorProps {
  value: string;
  onChange: (value: string) => void;
  accentColor?: string;
  placeholder?: string;
  title?: string;
}

export const MarkdownNotesEditor: React.FC<MarkdownNotesEditorProps> = ({
  value,
  onChange,
  accentColor = '#6C5CE7',
  placeholder = 'Consignez vos notes, commandes de terminal, liens et synthèses en Markdown...',
  title = 'Notes de Session & Documentation',
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to insert markdown syntax at cursor or wrap current selection
  const insertFormatting = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || defaultText;

    const newText =
      value.substring(0, start) + prefix + textToInsert + suffix + value.substring(end);

    onChange(newText);

    // Reposition cursor after insert
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + textToInsert.length;
      textarea.setSelectionRange(
        selectedText ? newCursorPos + suffix.length : start + prefix.length,
        selectedText ? newCursorPos + suffix.length : start + prefix.length + textToInsert.length
      );
    }, 10);
  };

  const insertTerminalSnippet = (snippetType: 'bash' | 'nmap' | 'curl' | 'python') => {
    let snippet = '';
    switch (snippetType) {
      case 'nmap':
        snippet = `\n\`\`\`bash\n# Scan furtif Nmap avec détection des versions et scripts par défaut\nnmap -sS -sV -sC -T4 192.168.1.1/24 -oN audit_scan.txt\n\`\`\`\n`;
        break;
      case 'bash':
        snippet = `\n\`\`\`bash\n# Commande de terminal\nsudo systemctl status nginx\njournalctl -u spectrum-app -f --no-tail\n\`\`\`\n`;
        break;
      case 'curl':
        snippet = `\n\`\`\`bash\n# Requête API de test avec headers de diagnostic\ncurl -i -H "Authorization: Bearer <TOKEN>" https://api.local/v1/health\n\`\`\`\n`;
        break;
      case 'python':
        snippet = `\n\`\`\`python\n# Script de test rapide\nimport requests\nres = requests.get('https://api.local')\nprint(f"Status: {res.status_code}")\n\`\`\`\n`;
        break;
    }
    insertFormatting(snippet, '', '');
  };

  const handleCopyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(id);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  // Stats calculation
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const lineCount = value ? value.split('\n').length : 0;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl shadow-sm overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-[var(--border-card)] flex flex-wrap items-center justify-between gap-2.5 bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-card)]">
                Markdown enrichi
              </span>
            </div>
          </div>
        </div>

        {/* Controls: View modes + Cheatsheet */}
        <div className="flex items-center gap-1.5">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)]">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'edit'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Mode Édition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Édition</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Aperçu du rendu Markdown"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Aperçu</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Vue partagée Côte à côte"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          {/* Guide / Aide Markdown */}
          <button
            type="button"
            onClick={() => setShowCheatsheet((prev) => !prev)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              showCheatsheet
                ? 'bg-[#6C5CE7]/15 border-[#6C5CE7] text-[#6C5CE7]'
                : 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Guide syntaxique Markdown & Raccourcis"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cheatsheet collapsible helper */}
      {showCheatsheet && (
        <div className="p-4 bg-[var(--bg-surface-elevated)] border-b border-[var(--border-card)] text-xs text-[var(--text-secondary)] space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between font-bold text-[var(--text-primary)]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#55E6C1]" />
              Aide-Mémoire Markdown & Snippets Techniques
            </span>
            <button
              type="button"
              onClick={() => setShowCheatsheet(false)}
              className="p-1 hover:text-[var(--text-primary)] rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-[11px] font-mono">
            <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)]">
              <span className="text-[#6C5CE7] font-bold block mb-1">Titres & Accent :</span>
              <p>## Titre de section</p>
              <p>### Sous-titre</p>
              <p>**texte en gras**</p>
              <p>*italique*</p>
            </div>
            <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)]">
              <span className="text-[#55E6C1] font-bold block mb-1">Code & Terminal :</span>
              <p>`commande simple`</p>
              <p>```bash</p>
              <p>nmap -sV target</p>
              <p>```</p>
            </div>
            <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)]">
              <span className="text-amber-400 font-bold block mb-1">Listes & Tâches :</span>
              <p>- Point de liste</p>
              <p>- [ ] Tâche à faire</p>
              <p>- [x] Tâche cochée</p>
              <p>&gt; Note ou citation</p>
            </div>
            <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)]">
              <span className="text-[#FF7675] font-bold block mb-1">Liens & Docs :</span>
              <p>[Titre](https://...)</p>
              <p className="mt-1 text-[10px] text-[var(--text-muted)] font-sans">
                Liens cliquables automatiquement sécurisés.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formatting Toolbar (Only in edit or split mode) */}
      {(viewMode === 'edit' || viewMode === 'split') && (
        <div className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] border-b border-[var(--border-card)] flex items-center gap-1 overflow-x-auto scrollbar-none">
          {/* Headings */}
          <button
            type="button"
            onClick={() => insertFormatting('## ', '', 'Titre de section')}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
            title="Titre de niveau 2 (##)"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('### ', '', 'Sous-titre')}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
            title="Titre de niveau 3 (###)"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-[var(--border-card)] mx-0.5" />

          {/* Bold & Italic */}
          <button
            type="button"
            onClick={() => insertFormatting('**', '**', 'texte en gras')}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
            title="Gras (**texte**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*', 'texte en italique')}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
            title="Italique (*texte*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-[var(--border-card)] mx-0.5" />

          {/* Inline code & Code block */}
          <button
            type="button"
            onClick={() => insertFormatting('`', '`', 'code')}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
            title="Code en ligne (`code`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('```bash\n', '\n```', '# Commande terminal')}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
            title="Bloc de code terminal (```bash)"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          <div className="w-[1px] h-4 bg-[var(--border-card)] mx-0.5" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => insertFormatting('- ', '', 'Point')}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
            title="Liste à puces (- item)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('- [ ] ', '', 'Tâche à valider')}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
            title="Checklist Markdown (- [ ] tâche)"
          >
            <ListTodo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('> ', '', 'Note ou citation')}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
            title="Citation (> texte)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-[var(--border-card)] mx-0.5" />

          {/* Link */}
          <button
            type="button"
            onClick={() => insertFormatting('[', '](https://url-de-reference)', 'Titre du lien')}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
            title="Lien hypertexte ([titre](url))"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>

          {/* Quick Terminal Presets for Tech & Cybersécurité */}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-[var(--text-muted)] font-mono hidden sm:inline">
              Snippets :
            </span>
            <button
              type="button"
              onClick={() => insertTerminalSnippet('nmap')}
              className="px-2 py-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-card)] text-[10px] font-mono font-semibold text-emerald-400 hover:border-emerald-400/50 transition cursor-pointer"
              title="Insérer un scan Nmap typique"
            >
              nmap
            </button>
            <button
              type="button"
              onClick={() => insertTerminalSnippet('bash')}
              className="px-2 py-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-card)] text-[10px] font-mono font-semibold text-[#6C5CE7] hover:border-[#6C5CE7]/50 transition cursor-pointer"
              title="Insérer bloc Bash"
            >
              bash
            </button>
            <button
              type="button"
              onClick={() => insertTerminalSnippet('curl')}
              className="px-2 py-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-card)] text-[10px] font-mono font-semibold text-amber-400 hover:border-amber-400/50 transition cursor-pointer"
              title="Insérer commande curl"
            >
              curl
            </button>
          </div>
        </div>
      )}

      {/* Editor & Preview Body */}
      <div className="relative">
        {/* VIEW: SPLIT */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-card)] min-h-[220px]">
            {/* Editor column */}
            <div className="p-3">
              <textarea
                ref={textareaRef}
                rows={10}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-full bg-transparent border-none text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none leading-relaxed font-mono resize-y"
              />
            </div>

            {/* Live Preview column */}
            <div className="p-4 bg-[var(--bg-surface-elevated)]/30 overflow-y-auto max-h-[400px]">
              <MarkdownPreviewRenderer
                content={value}
                accentColor={accentColor}
                onCopyCode={handleCopyCode}
                copiedIndex={copiedIndex}
              />
            </div>
          </div>
        )}

        {/* VIEW: EDIT ONLY */}
        {viewMode === 'edit' && (
          <div className="p-3">
            <textarea
              ref={textareaRef}
              rows={7}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent border-none text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none leading-relaxed font-sans resize-y"
            />
          </div>
        )}

        {/* VIEW: PREVIEW ONLY */}
        {viewMode === 'preview' && (
          <div className="p-5 min-h-[160px] max-h-[500px] overflow-y-auto bg-[var(--bg-surface-elevated)]/20">
            <MarkdownPreviewRenderer
              content={value}
              accentColor={accentColor}
              onCopyCode={handleCopyCode}
              copiedIndex={copiedIndex}
            />
          </div>
        )}
      </div>

      {/* Footer bar with stats and auto-save notice */}
      <div className="px-4 py-2 border-t border-[var(--border-card)] bg-[var(--bg-surface-elevated)]/40 flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
        <div className="flex items-center gap-3">
          <span>{wordCount} mots</span>
          <span>•</span>
          <span>{lineCount} lignes</span>
          <span>•</span>
          <span>{value.length} caractères</span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400 font-sans">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Auto-sync actif</span>
        </div>
      </div>
    </div>
  );
};

/* Sub-component: Formatted Markdown Renderer with dark terminal blocks and clickable links */
interface MarkdownPreviewRendererProps {
  content: string;
  accentColor: string;
  onCopyCode: (code: string, id: string) => void;
  copiedIndex: string | null;
}

const MarkdownPreviewRenderer: React.FC<MarkdownPreviewRendererProps> = ({
  content,
  accentColor,
  onCopyCode,
  copiedIndex,
}) => {
  if (!content.trim()) {
    return (
      <div className="text-center py-8 text-xs text-[var(--text-muted)] italic">
        Aucune note pour l'instant. Utilisez l'éditeur pour saisir du texte, des commandes bash ou des liens.
      </div>
    );
  }

  let codeBlockCounter = 0;

  return (
    <div className="markdown-body text-sm text-[var(--text-primary)] space-y-3 leading-relaxed">
      <Markdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-extrabold text-[var(--text-primary)] border-b border-[var(--border-card)] pb-1.5 mt-4 mb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-card)]/50 pb-1 mt-3.5 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: accentColor }} />
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-[var(--text-primary)] mt-3 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed my-1.5">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)] my-2 marker:text-[#6C5CE7]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1 text-sm text-[var(--text-secondary)] my-2 marker:font-mono marker:text-[#6C5CE7]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-4 pl-3.5 py-1.5 my-2.5 bg-[var(--bg-surface-elevated)] rounded-r-xl italic text-sm text-[var(--text-secondary)]"
              style={{ borderColor: accentColor }}
            >
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80 transition"
              style={{ color: accentColor }}
            >
              <span>{children}</span>
              <ExternalLink className="w-3 h-3 inline-block" />
            </a>
          ),
          hr: () => <hr className="my-4 border-[var(--border-card)]" />,
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const rawCode = String(children).replace(/\n$/, '');
            const isMultiLine = rawCode.includes('\n') || match;

            if (isMultiLine) {
              codeBlockCounter++;
              const blockId = `cb-${codeBlockCounter}`;
              const lang = match ? match[1] : 'bash';
              const isCopied = copiedIndex === blockId;

              return (
                <div className="my-3 rounded-2xl overflow-hidden border border-neutral-800 bg-[#0d1117] shadow-md">
                  {/* Terminal Header Bar */}
                  <div className="px-3 py-1.5 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {/* Mac-style window dots */}
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 ml-1">
                        <Terminal className="w-3 h-3 text-emerald-400" />
                        <span>{lang}</span>
                      </div>
                    </div>

                    {/* Copy button */}
                    <button
                      type="button"
                      onClick={() => onCopyCode(rawCode, blockId)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-[11px] font-mono text-neutral-300 transition active:scale-95 cursor-pointer"
                      title="Copier la commande"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Terminal Content */}
                  <pre className="p-3.5 overflow-x-auto text-xs font-mono text-[#e6edf3] leading-relaxed select-all">
                    <code>{rawCode}</code>
                  </pre>
                </div>
              );
            }

            // Inline Code
            return (
              <code
                className="px-1.5 py-0.5 rounded-md font-mono text-xs font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-emerald-400"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
