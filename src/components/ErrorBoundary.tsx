import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary captured an error in component:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[var(--bg-surface)] border border-[#FF7675]/40 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-[#FF7675]/15 text-[#FF7675] flex items-center justify-center mx-auto border border-[#FF7675]/30">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {this.props.fallbackTitle || 'Une erreur est survenue'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed line-clamp-3">
                {this.state.error?.message || 'Une exception JavaScript a été interceptée.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#6C5CE7] text-white hover:bg-[#5b4bc4] transition flex items-center gap-1.5 shadow active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Réessayer</span>
              </button>
              {this.props.onReset && (
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center gap-1 active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Fermer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
