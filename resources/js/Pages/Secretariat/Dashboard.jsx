import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import { ArrowLeft, Archive, Printer, Inbox, CheckCircle2 } from "lucide-react";
import DashboardIntro from "@/Components/DashboardIntro";
import { withBasePath } from "../../Utils/urlHelper";

const ANNONCE_LABELS = {
    grace: { label: "Action de grâce", emoji: "🙌" },
    priere: { label: "Prière d'intercession", emoji: "🙏" },
};

function formatDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("fr-FR") + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function AnnonceCard({ item, onArchive, archiving }) {
    const type = ANNONCE_LABELS[item.type_acte] || { label: item.type_acte, emoji: "📢" };
    const membre = item.membre ? `${item.membre.prenom} ${item.membre.nom}` : "—";
    const isArchivee = item.statut === "ARCHIVEE";

    return (
        <div className="sec-card">
            <div className="sec-card-top">
                <span className="sec-badge">{type.emoji} {type.label}</span>
                <span className={`sec-statut sec-statut-${isArchivee ? "archived" : "pending"}`}>
                    {isArchivee ? "Archivée" : "Prête à archiver"}
                </span>
            </div>
            <div className="sec-card-name">{membre}</div>
            <div className="sec-card-meta">
                <span>{item.classe?.nom || "—"}</span>
                <span>{item.reference}</span>
                <span>Publiée le {formatDateTime(item.date_publication || item.updated_at)}</span>
            </div>
            {(item.details?.contenu || item.message) && (
                <div className="sec-card-msg">
                    {(item.details?.contenu || item.message || "").slice(0, 140)}
                    {(item.details?.contenu || item.message || "").length > 140 ? "…" : ""}
                </div>
            )}
            <div className="sec-card-actions">
                <a
                    className="sec-btn sec-btn-ghost"
                    href={withBasePath("", `/secretariat/annonces/${item.id}/fiche`)}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Printer size={14} /> Imprimer
                </a>
                {!isArchivee && (
                    <button
                        className="sec-btn sec-btn-gold"
                        disabled={archiving}
                        onClick={() => onArchive(item.id)}
                    >
                        <Archive size={14} /> {archiving ? "Archivage..." : "Archiver"}
                    </button>
                )}
            </div>
        </div>
    );
}

export default function SecretariatDashboard({ enAttente = [], archivees = [] }) {
    const [tab, setTab] = useState("attente");
    const [localEnAttente, setLocalEnAttente] = useState(enAttente);
    const [localArchivees, setLocalArchivees] = useState(archivees);
    const [archivingId, setArchivingId] = useState(null);
    const [toast, setToast] = useState(null);

    const notify = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleArchive = async (id) => {
        try {
            setArchivingId(id);
            await axios.post(withBasePath("", `/secretariat/annonces/${id}/archiver`));
            const archived = localEnAttente.find((a) => a.id === id);
            setLocalEnAttente((prev) => prev.filter((a) => a.id !== id));
            if (archived) {
                setLocalArchivees((prev) => [{ ...archived, statut: "ARCHIVEE" }, ...prev]);
            }
            notify("✅ Demande archivée avec succès.");
        } catch (e) {
            notify(e?.response?.data?.message || "Une erreur est survenue.", "error");
        } finally {
            setArchivingId(null);
        }
    };

    const list = tab === "attente" ? localEnAttente : localArchivees;

    return (
        <div className="sec-page">
            <Head title="Secrétariat" />
            <style>{styles}</style>

            {toast && (
                <div className={`sec-toast sec-toast-${toast.type}`}>{toast.msg}</div>
            )}

            <div className="sec-container">
                <Link href={withBasePath("", "/dashboard")} className="sec-back">
                    <ArrowLeft size={16} /> Retour
                </Link>

                <DashboardIntro title="ESPACE SECRÉTARIAT" />

                <div className="sec-tabs">
                    <button
                        className={`sec-tab ${tab === "attente" ? "active" : ""}`}
                        onClick={() => setTab("attente")}
                    >
                        <Inbox size={14} /> En attente
                        {localEnAttente.length > 0 && (
                            <span className="sec-tab-count">{localEnAttente.length}</span>
                        )}
                    </button>
                    <button
                        className={`sec-tab ${tab === "archivees" ? "active" : ""}`}
                        onClick={() => setTab("archivees")}
                    >
                        <CheckCircle2 size={14} /> Archivées
                    </button>
                </div>

                {list.length === 0 ? (
                    <div className="sec-empty">
                        {tab === "attente"
                            ? "Aucune demande en attente d'archivage pour le moment."
                            : "Aucune demande archivée pour le moment."}
                    </div>
                ) : (
                    <div className="sec-grid">
                        {list.map((item) => (
                            <AnnonceCard
                                key={item.id}
                                item={item}
                                onArchive={handleArchive}
                                archiving={archivingId === item.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = `
.sec-page{min-height:100vh;background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 55%,#0F3D24 100%);padding:32px 16px;font-family:inherit}
.sec-container{max-width:960px;margin:0 auto}
.sec-back{display:inline-flex;align-items:center;gap:8px;color:#fff;background:rgba(255,255,255,.12);padding:8px 16px;border-radius:8px;font-weight:600;font-size:13px;text-decoration:none;margin-bottom:8px}
.sec-back:hover{background:rgba(255,255,255,.2)}
.sec-tabs{display:flex;gap:8px;background:#fff;padding:6px;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,.12);margin-bottom:20px;width:fit-content}
.sec-tab{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;border:none;background:transparent;color:#374151;font-weight:600;font-size:13px;cursor:pointer}
.sec-tab.active{background:#1d4ed8;color:#fff}
.sec-tab-count{background:rgba(255,255,255,.9);color:#1d4ed8;border-radius:20px;padding:1px 7px;font-size:11px;font-weight:800}
.sec-tab:not(.active) .sec-tab-count{background:#fee2e2;color:#dc2626}
.sec-empty{background:rgba(255,255,255,.95);border-radius:12px;padding:40px;text-align:center;color:#6b7280;font-weight:600}
.sec-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.sec-card{background:#fff;border-radius:12px;padding:16px;box-shadow:0 4px 14px rgba(0,0,0,.1);display:flex;flex-direction:column;gap:8px}
.sec-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.sec-badge{font-size:11px;font-weight:700;color:#7c3aed;background:#ede9fe;padding:3px 10px;border-radius:20px}
.sec-statut{font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px}
.sec-statut-pending{background:#fef3c7;color:#d97706}
.sec-statut-archived{background:#dcfce7;color:#16a34a}
.sec-card-name{font-size:15px;font-weight:800;color:#111827}
.sec-card-meta{display:flex;flex-wrap:wrap;gap:10px;font-size:11.5px;color:#6b7280;font-weight:600}
.sec-card-msg{font-size:12.5px;color:#374151;background:#f9fafb;border-radius:8px;padding:8px 10px;line-height:1.5}
.sec-card-actions{display:flex;gap:8px;margin-top:4px}
.sec-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:700;border:none;cursor:pointer;text-decoration:none}
.sec-btn-ghost{background:#f3f4f6;color:#374151}
.sec-btn-ghost:hover{background:#e5e7eb}
.sec-btn-gold{background:linear-gradient(90deg,#d97706,#b45309);color:#fff}
.sec-btn-gold:disabled{opacity:.6;cursor:not-allowed}
.sec-toast{position:fixed;bottom:24px;right:24px;z-index:200;background:#16a34a;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.2);max-width:360px}
.sec-toast-error{background:#dc2626}
`;
