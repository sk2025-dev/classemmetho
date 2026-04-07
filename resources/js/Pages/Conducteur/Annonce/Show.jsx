import React from "react";
import { Link } from "@inertiajs/react";
import { Eye } from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

export default function Show({ annonce }) {
    return (
        <div className="conducteur-annonce-show">
            <div className="page-header">
                <h1>Détail de l'annonce</h1>
                <Link
                    href={withBasePath("", "/conducteur/annonces")}
                    className="btn-ghost"
                >
                    ← Retour
                </Link>
            </div>
            <div className="detail-block">
                <p>
                    <strong>Référence :</strong> {annonce.reference}
                </p>
                <p>
                    <strong>Famille :</strong> {annonce.family?.nom || "—"}
                </p>
                {annonce.membre && (
                    <p>
                        <strong>Membre :</strong> {annonce.membre.prenom}{" "}
                        {annonce.membre.nom}
                    </p>
                )}
                <p>
                    <strong>Statut :</strong> {annonce.statut}
                </p>
                <div className="message-block">
                    <strong>Message :</strong>
                    <div>{annonce.details?.contenu || annonce.message}</div>
                </div>
                {["VALIDEE", "PUBLIEE", "ARCHIVEE"].includes(
                    annonce.statut,
                ) && (
                    <button
                        className="btn-pdf"
                        onClick={() =>
                            window.open(
                                `/conducteur/annonces/${annonce.id}/fiche`,
                                "_blank",
                            )
                        }
                    >
                        <Eye size={13} /> Voir la fiche
                    </button>
                )}
            </div>
        </div>
    );
}
