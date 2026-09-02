import React, { ReactNode, ErrorInfo } from 'react';
import { reportClientError } from '../services/telemetry';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  readonly props: Readonly<ErrorBoundaryProps>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportClientError(error, errorInfo.componentStack);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-600">Please refresh the page. If the problem continues, contact support.</p>
          <button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
            Refresh page
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
