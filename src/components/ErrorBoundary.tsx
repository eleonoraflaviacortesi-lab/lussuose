import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  error?: Error;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-2xl bg-card text-card-foreground shadow-lg p-6">
            <h1 className="text-lg font-semibold">Si è verificato un errore</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Apri la console per vedere i dettagli tecnici. Se vuoi, ripristiniamo l’ultima versione funzionante.
            </p>
            <pre className="mt-4 text-xs whitespace-pre-wrap break-words bg-muted text-foreground/90 rounded-lg p-3 overflow-auto max-h-56">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
