import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full glass-card p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-grotesk">Something went wrong</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                The application encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <RefreshCcw size={18} />
              Reload Application
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-left text-xs text-red-500 overflow-auto max-h-40">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
