import { useEffect, useRef } from "react";
import { usePage } from "@inertiajs/react";
import useToast from "../Hooks/useToast";
import ToastContainer from "./ToastContainer";
import {
    buildValidationToastMessage,
    focusFirstErrorField,
    getErrorSignature,
    markRequiredFieldLabels,
} from "../Utils/formFeedback";

export default function GlobalFormErrorHandler() {
    const { props } = usePage();
    const errors = props?.errors || {};
    const { toasts, removeToast, error } = useToast();
    const lastHandledSignatureRef = useRef(null);

    useEffect(() => {
        const hasErrors = Object.keys(errors).length > 0;

        if (!hasErrors) {
            lastHandledSignatureRef.current = null;
            return;
        }

        const signature = getErrorSignature(errors);

        if (signature === lastHandledSignatureRef.current) {
            return;
        }

        lastHandledSignatureRef.current = signature;
        focusFirstErrorField(errors);
        error(buildValidationToastMessage(errors), 5500);
    }, [error, errors]);

    useEffect(() => {
        markRequiredFieldLabels();

        const observer = new MutationObserver(() => {
            markRequiredFieldLabels();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => observer.disconnect();
    }, []);

    return <ToastContainer toasts={toasts} removeToast={removeToast} />;
}
