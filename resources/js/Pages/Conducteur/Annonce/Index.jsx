import React, { useState } from "react";
import { Link } from "@inertiajs/react";
import { Eye } from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

function Pagination({ paginator }) {
    if (!paginator || !paginator.links) return null;
    return (
        <nav className="pagination">
            {paginator.links.map((l, idx) => (
                <a
                    key={idx}
                    href={l.url || "#"}
                    className={l.active ? "active" : ""}
                    dangerouslySetInnerHTML={{ __html: l.label }}
                />
            ))}
        </nav>
    );
}

export default function Index({
    enAttente = [],
    validees = [],
    enAttentePasteur = [],
    historique = [],
}) {
    const [selected, setSelected] = useState(null);

    const openDetail = (ann) => setSelected(ann);
    const closeDetail = () => setSelected(null);

    const renderList = (list) => {
        const items = Array.isArray(list) ? list : list.data || [];
        if (items.length === 0) return <p>Aucune demande de prière.</p>;
        return (
            <>
                <ul className="simple-list">
                    {items.map((a) => (
                        <li
                            key={a.id}
                            className="list-item"
                            onClick={() => openDetail(a)}
                        >
                            <strong>{a.reference}</strong> —{" "}
                            {a.details?.titre || a.message || "Sans titre"}
                            <span className="list-meta">
                                {a.family?.nom || "Paroisse"}
                            </span>
                        </li>
                    ))}
                </ul>
                {/* pagination */}
                {!Array.isArray(list) && <Pagination paginator={list} />}
            </>
        );
    };

    return (
        <div className="conducteur-annonces-page">
            <div className="page-header">
                <h1>Demandes de prière</h1>
                <Link
                    href={withBasePath("", "/conducteur/dashboard")}
                    className="btn-ghost"
                >
                    ← Retour
                </Link>
            </div>

            <section>
                <h2>
                    À traiter ({enAttente.meta?.total ?? enAttente.length ?? 0})
                </h2>
                {renderList(enAttente)}
            </section>
            <section>
                <h2>
                    Validées ({validees.meta?.total ?? validees.length ?? 0})
                </h2>
                {renderList(validees)}
            </section>
            <section>
                <h2>
                    En attente pasteur (
                    {enAttentePasteur.meta?.total ??
                        enAttentePasteur.length ??
                        0}
                    )
                </h2>
                {renderList(enAttentePasteur)}
            </section>
            <section>
                <h2>
                    Historique (
                    {historique.meta?.total ?? historique.length ?? 0})
                </h2>
                {renderList(historique)}
            </section>

            {selected && (
                <div className="modal-overlay" onClick={closeDetail}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3>Détail de l'annonce</h3>
                            <button
                                className="modal-close"
                                onClick={closeDetail}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                <strong>Référence :</strong>{" "}
                                {selected.reference}
                            </p>
                            <p>
                                <strong>Famille :</strong>{" "}
                                {selected.family?.nom || "—"}
                            </p>
                            {selected.membre && (
                                <p>
                                    <strong>Membre :</strong>{" "}
                                    {selected.membre.prenom}{" "}
                                    {selected.membre.nom}
                                </p>
                            )}
                            <p>
                                <strong>Statut :</strong> {selected.statut}
                            </p>
                            <div className="message-block">
                                <strong>Message :</strong>
                                <div>
                                    {selected.details?.contenu ||
                                        selected.message}
                                </div>
                            </div>
                            {["VALIDEE", "PUBLIEE", "ARCHIVEE"].includes(
                                selected.statut,
                            ) && (
                                <button
                                    className="btn-pdf"
                                    onClick={() =>
                                        window.open(
                                            withBasePath("", `/conducteur/annonces/${selected.id}/fiche`),
                                            "_blank",
                                        )
                                    }
                                >
                                    <Eye size={13} /> Voir la fiche
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
