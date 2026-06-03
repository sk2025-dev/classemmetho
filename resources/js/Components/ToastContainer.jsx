import React from "react";
import Toast from "./Toast";

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-6 right-6 z-[9999] pointer-events-none space-y-3">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast
                        id={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={removeToast}
                        action={toast.action}
                    />
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
