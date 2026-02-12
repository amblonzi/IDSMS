import React from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary component to catch and display React errors gracefully.
 * 
 * Prevents the entire app from crashing when a component error occurs.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // In production, you might want to log this to an error reporting service
        // e.g., Sentry, LogRocket, etc.
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg
                                    className="h-6 w-6 text-red-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Oops! Something went wrong
                            </h2>

                            <p className="text-gray-600 mb-6">
                                We're sorry for the inconvenience. An unexpected error occurred.
                            </p>

                            {/* Show error details in development */}
                            {import.meta.env.DEV && this.state.error && (
                                <div className="mb-6 text-left">
                                    <details className="bg-gray-100 rounded p-4">
                                        <summary className="cursor-pointer font-semibold text-sm text-gray-700 mb-2">
                                            Error Details (Development Only)
                                        </summary>
                                        <div className="mt-2 text-xs font-mono text-red-600 overflow-auto max-h-48">
                                            <p className="font-bold mb-2">{this.state.error.toString()}</p>
                                            <pre className="whitespace-pre-wrap">
                                                {this.state.errorInfo?.componentStack}
                                            </pre>
                                        </div>
                                    </details>
                                </div>
                            )}

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={this.handleReset}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Try Again
                                </button>

                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Go Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
