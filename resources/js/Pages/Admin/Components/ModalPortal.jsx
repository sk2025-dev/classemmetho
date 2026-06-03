import { createPortal } from "react-dom";

export default function ModalPortal({ children }) {
    // Cela crée un "tunnel" vers la balise <body> du document
    return createPortal(children, document.body);
}