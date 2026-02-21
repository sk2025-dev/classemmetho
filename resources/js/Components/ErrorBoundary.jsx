import React from 'react'

/**
 * Composant ErrorBoundary pour capturer les erreurs React
 * Affiche une interface de secours plutôt que de crasher toute la page
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo)
        this.setState({
            error,
            errorInfo,
        })
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4v2m0 0v2m0-6H9m6 0h-3m2-7h2a2 2 0 012 2v2a2 2 0 01-2 2h-2V9z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                            Oups! Une erreur s'est produite
                        </h1>
                        <p className="text-gray-600 text-center mb-4">
                            Nous nous excusons. Une erreur inattendue s'est produite. Veuillez réessayer.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="bg-gray-100 rounded p-4 mb-6 text-sm">
                                <p className="font-bold text-red-600 mb-2">Détails de l'erreur (développement):</p>
                                <pre className="text-xs text-gray-700 overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                </pre>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Réessayer
                            </button>
                            <button
                                onClick={() => (window.location.href = '/')}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Accueil
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
