import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  showDetails: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Qualcosa è andato storto
              </CardTitle>
              <CardDescription className="text-red-700">
                Si è verificato un errore inaspettato nell'applicazione. 
                Prova a ricaricare la pagina per continuare.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={this.handleReload}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Riprova
                </Button>
                <Button
                  variant="outline"
                  onClick={this.toggleDetails}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <ChevronDown 
                    className={`w-4 h-4 mr-2 transition-transform ${
                      this.state.showDetails ? 'rotate-180' : ''
                    }`} 
                  />
                  {this.state.showDetails ? 'Nascondi dettagli' : 'Mostra dettagli'}
                </Button>
              </div>

              {this.state.showDetails && (
                <details className="mt-4 p-4 bg-red-100 rounded-lg border border-red-200">
                  <summary className="cursor-pointer font-medium text-red-800 mb-2">
                    Dettagli tecnici dell'errore
                  </summary>
                  <div className="mt-2 text-sm text-red-700 space-y-2">
                    {this.state.error && (
                      <div>
                        <strong>Errore:</strong>
                        <pre className="mt-1 p-2 bg-red-200 rounded text-xs overflow-auto">
                          {this.state.error.message}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Stack trace:</strong>
                        <pre className="mt-1 p-2 bg-red-200 rounded text-xs overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;