import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const Toast = ({
    id,
    message,
    type = "info",
    duration = 5000,
    onClose,
    action = null,
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const styles = {
        success: {
            bg: "bg-green-50",
            border: "border-green-200",
            text: "text-green-800",
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        },
        error: {
            bg: "bg-red-50",
            border: "border-red-200",
            text: "text-red-800",
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        },
        warning: {
            bg: "bg-yellow-50",
            border: "border-yellow-200",
            text: "text-yellow-800",
            icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
        },
        info: {
            bg: "bg-blue-50",
            border: "border-blue-200",
            text: "text-blue-800",
            icon: <Info className="w-5 h-5 text-blue-500" />,
        },
    }[type];

    const handleActionClick = () => {
        if (action && action.onClick) {
            action.onClick();
        }
        onClose(id);
    };

    return (
        <div
            className={`
                fixed top-6 right-6 z-[9999] max-w-sm w-full
                ${styles.bg} border ${styles.border}
                rounded-lg shadow-lg backdrop-blur-sm
                transform transition-all duration-300 ease-out
                animate-slide-in-right
            `}
        >
            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>

            <div className="flex items-start gap-3 p-4">
                <div className="flex-shrink-0 mt-0.5">
                    {styles.icon}
                </div>
                <div className="flex-1">
                    <p className={`text-sm font-medium ${styles.text}`}>
                        {message}
                    </p>
                </div>
                {action && action.label && (
                    <button
                        onClick={handleActionClick}
                        className={`
                            flex-shrink-0 ml-2 px-3 py-1 rounded text-white text-xs font-medium
                            transition-colors duration-200
                            ${type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                              type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                              type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                              'bg-blue-600 hover:bg-blue-700'}
                        `}
                    >
                        {action.label}
                    </button>
                )}
                <button
                    onClick={() => onClose(id)}
                    className={`
                        flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600
                        focus:outline-none transition-colors duration-200
                    `}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export const ToastContainer = ({ toasts, onRemoveToast }) => {
    return (
        <div className="fixed top-6 right-6 flex flex-col gap-3 z-[9999] pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast
                        id={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration || 3000}
                        onClose={onRemoveToast}
                        action={toast.action}
                    />
                </div>
            ))}
        </div>
    );
};

// Hook personnalisé pour utiliser les toasts
export const useToast = ({ toasts, setToasts }) => {
    const addToast = (message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts([...toasts, { id, message, type, duration }]);
        return id;
    };

    const removeToast = (id) => {
        setToasts(toasts.filter((toast) => toast.id !== id));
    };

    const success = (message) => addToast(message, 'success', 3000);
    const error = (message) => addToast(message, 'error', 4000);
    const warning = (message) => addToast(message, 'warning', 3500);
    const info = (message) => addToast(message, 'info', 3000);

    return { addToast, removeToast, success, error, warning, info };
};

export default Toast;
