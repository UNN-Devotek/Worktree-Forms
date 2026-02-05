'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';


interface Props {
  children: ReactNode;
  className?: string;
}

interface State {
  hasError: boolean;
}

export class SidebarErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Sidebar:', error, errorInfo);
  }

  public render() {
    return (
      <div className={this.props.className}>
        {this.state.hasError ? (
          <div className="flex flex-col items-center py-4 bg-muted/50 w-full h-full">
            <div className="h-10 w-10 flex items-center justify-center rounded-md bg-destructive/10 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
            </div>
            <span className="sr-only">Sidebar Error</span>
          </div>
        ) : (
          this.props.children
        )}
      </div>
    );
  }
}
