import { useState, useCallback } from "react";

const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "info", duration = 4000, action = null) => {
        const id = Date.now();
        setToasts((prevToasts) => [
            ...prevToasts,
            { id, message, type, duration, action },
        ]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prevToasts) =>
            prevToasts.filter((toast) => toast.id !== id)
        );
    }, []);

    const success = useCallback((message, duration = 4000, action = null) => {
        return addToast(message, "success", duration, action);
    }, [addToast]);

    const error = useCallback((message, duration = 4000, action = null) => {
        return addToast(message, "error", duration, action);
    }, [addToast]);

    const warning = useCallback((message, duration = 4000, action = null) => {
        return addToast(message, "warning", duration, action);
    }, [addToast]);

    const info = useCallback((message, duration = 4000, action = null) => {
        return addToast(message, "info", duration, action);
    }, [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
    };
};

export default useToast;
