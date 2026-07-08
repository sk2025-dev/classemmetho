import React, { useMemo, useState } from "react";
import axios from "axios";
import { Link, router, usePage } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import Select2Single from "../../Components/Select2Single";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Building2,
    CheckCircle,
    Clock,
    History,
    MapPin,
    Plus,
    Send,
    ShieldCheck,
    User,
    Users,
    XCircle,
} from "lucide-react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;font-family:'DM Sans',sans-serif}.mono{font-family:'DM Mono',monospace}
  .glass{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(14px)}
  .card{background:#fff;border:1px solid #e5ebf4;border-radius:20px;box-shadow:0 12px 32px rgba(15,23,42,.10)}
  .tab{border:none;border-radius:999px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;gap:8px;align-items:center}
  .tab.active{background:#fff;color:#0f172a}.tab.idle{background:rgba(255,255,255,.12);color:#fff}
  .btn{border:none;border-radius:12px;padding:12px 16px;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;gap:8px;align-items:center;justify-content:center}
  .btn-primary{color:#fff;background:#0f766e}
  .btn-ghost{color:#334155;background:#fff;border:1px solid #d9e2ef}
  .btn-danger{color:#9f1239;background:#fff1f2;border:1px solid #fecdd3}
  .btn:disabled{opacity:.6;cursor:not-allowed}
  .field{width:100%;border-radius:12px;border:1px solid #d9e2ef;padding:12px 14px;font-size:14px;outline:none}
  .field:focus{border-color:#0f766e;box-shadow:0 0 0 4px rgba(15,118,110,.12)}
  .pill{display:inline-flex;gap:6px;align-items:center;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;text-transform:uppercase}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px;align-items:start;justify-items:start}
  .modal-backdrop{position:fixed;inset:0;z-index:90;background:rgba(15,23,42,.56);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px}
  .modal{width:min(680px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#f8fbff;border:1px solid #d9e2ef;border-radius:24px;box-shadow:0 30px 60px rgba(15,23,42,.25)}
  .step-option{border:1px solid #d9e2ef;border-radius:18px;padding:16px;background:#fff;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease;cursor:pointer}
  .step-option:hover{transform:translateY(-2px);border-color:#99f6e4;box-shadow:0 12px 26px rgba(15,23,42,.08)}
  .step-option-active{border-color:#0f766e;background:#ccfbf1;box-shadow:0 16px 32px rgba(15,118,110,.16)}
`;

const initialForm = {
    type: "member",
    transfer_mode: "internal",
    user_id: "",
    family_id: "",
    target_class_id: "",
    destination_city: "",
    destination_church: "",
    reason: "",
};

const legacyTransferTypeOptions = [
    {
        value: "member",
        label: "Un membre",
        description: "Transfert individuel d'un membre de votre classe.",
        icon: User,
        accent: "#f97316",
        soft: "#fff7ed",
    },
    {
        value: "family",
        label: "Toute la famille",
        description: "Transfert complet de la famille vers une autre classe.",
        icon: Users,
        accent: "#06b6d4",
        soft: "#ecfeff",
    },
    {
        value: "external",
        label: "Sortie externe",
        description: "Départ hors communauté vers une autre ville ou un autre pays.",
        icon: MapPin,
        accent: "#8b5cf6",
        soft: "#f5f3ff",
    },
];

const transferTypeOptions = [
    {
        value: "member_internal",
        type: "member",
        transferMode: "internal",
        label: "Un membre",
        description: "Transfert individuel d'un membre vers une autre classe.",
        icon: User,
        accent: "#f97316",
        soft: "#fff7ed",
    },
    {
        value: "family_internal",
        type: "family",
        transferMode: "internal",
        label: "Toute la famille",
        description: "Transfert complet de la famille vers une autre classe.",
        icon: Users,
        accent: "#06b6d4",
        soft: "#ecfeff",
    },
    {
        value: "member_external",
        type: "member",
        transferMode: "external",
        label: "Sortie externe d'un membre",
        description: "Archive un membre comme ancien membre vers une autre eglise.",
        icon: MapPin,
        accent: "#8b5cf6",
        soft: "#f5f3ff",
    },
    {
        value: "family_external",
        type: "family",
        transferMode: "external",
        label: "Sortie externe d'une famille",
        description: "Archive toute la famille hors communaute vers une autre eglise.",
        icon: MapPin,
        accent: "#7c3aed",
        soft: "#f5f3ff",
    },
];

const statusCfg = {
    EN_ATTENTE_SOURCE:  { label: "Attente source",  bg: "#fff7ed", color: "#c2410c", dot: "#f97316" },
    EN_ATTENTE_ACCUEIL: { label: "Attente accueil", bg: "#ecfeff", color: "#155e75", dot: "#06b6d4" },
    EN_ATTENTE_PASTEUR: { label: "Attente pasteur", bg: "#f5f3ff", color: "#6d28d9", dot: "#7c3aed" },
    TERMINEE:           { label: "Terminée",        bg: "#f0fdf4", color: "#166534", dot: "#22c55e" },
    REFUSEE:            { label: "Refusée",         bg: "#fff1f2", color: "#9f1239", dot: "#f43f5e" },
};

const inputLabel = { display: "grid", gap: 8 };
const inputLabelText = { fontSize: 13, fontWeight: 700, color: "#334155" };

function buildTransferOptionLabel(entity, baseLabel) {
    if (!entity?.transfer_locked) {
        return baseLabel;
    }

    return `${baseLabel} - ${entity.transfer_label || "Transfert bloque"}`;
}

function buildTransferOptionDescription(entity, fallback) {
    if (!entity?.transfer_locked) {
        return fallback;
    }

    return entity.transfer_status === "completed"
        ? `${entity.transfer_label || "Ancien membre"} archive, aucune nouvelle action possible.`
        : "Transfert en cours, impossible de lancer une nouvelle action.";
}

function getTransferOptionKey(type, transferMode) {
    return `${type}_${transferMode}`;
}

function StatusPill({ status }) {
    const cfg = statusCfg[status] || { label: status || "Inconnu", bg: "#f8fafc", color: "#475569", dot: "#94a3b8" };
    return (
        <span className="pill" style={{ background: cfg.bg, color: cfg.color }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot }} />
            {cfg.label}
        </span>
    );
}

function Stat({ icon: Icon, title, value, iconBg, iconColor }) {
    return (
        <div className="card" style={{ padding: 20 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: iconBg, marginBottom: 14 }}>
                <Icon size={18} style={{ color: iconColor }} />
            </div>
            <div style={{ fontSize: 30, lineHeight: 1, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>{value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#64748b" }}>{title}</div>
        </div>
    );
}

function StepDots({ current, total = 3 }) {
    return (
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
            {Array.from({ length: total }, (_, index) => {
                const step = index + 1;
                const active = current === step;
                const done = current > step;

                return (
                    <div
                        key={step}
                        style={{
                            flex: 1,
                            height: 6,
                            borderRadius: 999,
                            background: done
                                ? "rgba(255,255,255,.92)"
                                : active
                                  ? "rgba(255,255,255,.72)"
                                  : "rgba(255,255,255,.22)",
                            boxShadow: active
                                ? "0 0 0 1px rgba(255,255,255,.2) inset"
                                : "none",
                        }}
                    />
                );
            })}
        </div>
    );
}

function SummaryRow({ label, value, strong = false }) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 18,
                padding: "13px 16px",
                alignItems: "flex-start",
            }}
        >
            <span
                style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                    color: "#64748b",
                }}
            >
                {label}
            </span>
            <span
                style={{
                    fontSize: 14,
                    fontWeight: strong ? 800 : 600,
                    color: "#0f172a",
                    textAlign: "right",
                    maxWidth: "65%",
                    lineHeight: 1.45,
                }}
            >
                {value || "-"}
            </span>
        </div>
    );
}

function TransferDetailModal({ transfer, onApprove, onRefuse, onClose }) {
    const [showRefuse, setShowRefuse] = useState(false);
    const [reason, setReason] = useState("");
    const [processing, setProcessing] = useState(false);
    const accent = transfer.approval_stage === "source" ? "#f97316" : "#06b6d4";
    const soft = transfer.approval_stage === "source" ? "#fff7ed" : "#ecfeff";
    const border = transfer.approval_stage === "source" ? "#fed7aa" : "#a5f3fc";
    const name = transfer.member?.name || transfer.family?.name || "-";
    const family = transfer.famille_source?.nom || transfer.family?.name || "-";
    const target = transfer.external_destination || transfer.classe_cible?.nom || "-";

    const approve = () => { setProcessing(true); onApprove(transfer.id); };
    const refuse = () => { if (!reason.trim()) return; setProcessing(true); onRefuse(transfer.id, reason); };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                {/* En-tête modal */}
                <div style={{ padding: "20px 24px", background: soft, borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {transfer.type === "member" ? <User size={18} /> : <Users size={18} />}
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>{name}</div>
                            <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                                <span style={{ borderRadius: 999, padding: "3px 8px", background: "#fff", border: `1px solid ${border}`, color: accent, fontSize: 11, fontWeight: 700 }}>
                                    {transfer.type === "member" ? "Membre" : transfer.type === "external" ? "Sortie" : "Famille"}
                                </span>
                                <span className="mono" style={{ color: "#64748b", fontSize: 11 }}>{transfer.reference}</span>
                                <StatusPill status={transfer.status} />
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ border: "none", background: "rgba(0,0,0,.08)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                        <XCircle size={16} style={{ color: "#64748b" }} />
                    </button>
                </div>

                {/* Corps */}
                <div style={{ padding: "20px 24px", display: "grid", gap: 16 }}>
                    {/* Infos */}
                    <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
                        <Info icon={Clock} label="Date" value={transfer.created_at || "-"} />
                        <Info icon={User} label="Demandeur" value={transfer.created_by || "-"} />
                        <Info icon={Users} label="Famille" value={family} />
                    </div>

                    {/* Trajet */}
                    <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
                        <RouteBox label="Depuis" value={transfer.classe_source?.nom || "-"} />
                        <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: soft, border: `1px solid ${border}`, color: accent, justifySelf: "center" }}>
                            <ArrowRight size={14} />
                        </div>
                        <RouteBox label="Vers" value={target} />
                    </div>

                    {/* Motif */}
                    {transfer.reason && (
                        <div style={{ borderRadius: 12, border: "1px dashed #d9e2ef", padding: "12px 14px", background: "#f8fafc", color: "#334155", lineHeight: 1.5, fontSize: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Motif</div>
                            {transfer.reason}
                        </div>
                    )}

                    {/* Actions */}
                    {transfer.requires_action ? (
                        !showRefuse ? (
                            <div style={{ display: "flex", gap: 10 }}>
                                <button type="button" className="btn btn-primary" onClick={approve} disabled={processing} style={{ flex: 1 }}>
                                    <CheckCircle size={15} />
                                    {processing ? "Traitement..." : "Approuver"}
                                </button>
                                <button type="button" className="btn btn-danger" onClick={() => setShowRefuse(true)} disabled={processing} style={{ flex: 1 }}>
                                    <XCircle size={15} />
                                    Refuser
                                </button>
                            </div>
                        ) : (
                            <div style={{ borderRadius: 14, background: "#fff1f2", border: "1px solid #fecdd3", padding: 14 }}>
                                <textarea className="field" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Motif du refus (obligatoire)" style={{ resize: "vertical", marginBottom: 10 }} />
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => { setShowRefuse(false); setReason(""); }} style={{ flex: 1 }}>Annuler</button>
                                    <button type="button" className="btn btn-danger" onClick={refuse} disabled={!reason.trim() || processing} style={{ flex: 1 }}>Confirmer le refus</button>
                                </div>
                            </div>
                        )
                    ) : (
                        <div style={{ borderRadius: 12, background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px 14px", color: "#334155", fontSize: 14, lineHeight: 1.5 }}>
                            <strong style={{ color: "#1d4ed8" }}>En attente du conducteur d'accueil.</strong>{" "}
                            Votre validation est enregistrée. La demande attend la classe <strong>{transfer.classe_cible?.nom || "d'accueil"}</strong>.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TransferCard({ transfer, onApprove, onRefuse, selected = false, onToggle = null }) {
    const [showDetail, setShowDetail] = useState(false);
    const accent = transfer.approval_stage === "source" ? "#f97316" : "#06b6d4";
    const soft = transfer.approval_stage === "source" ? "#fff7ed" : "#ecfeff";
    const border = transfer.approval_stage === "source" ? "#fed7aa" : "#a5f3fc";
    const name = transfer.member?.name || transfer.family?.name || "-";
    const from = transfer.classe_source?.nom || "-";
    const target = transfer.external_destination || transfer.classe_cible?.nom || "-";
    const canSelect = transfer.requires_action && onToggle;

    return (
        <>
            <div
                className="card"
                style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    width: "100%",
                    outline: selected ? `2px solid ${accent}` : "none",
                    outlineOffset: -2,
                    transition: "outline 0.15s",
                }}
            >
                {/* Checkbox */}
                {canSelect && (
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggle(transfer.id)}
                        style={{ width: 16, height: 16, accentColor: accent, cursor: "pointer", flexShrink: 0 }}
                    />
                )}

                {/* Icône */}
                <div style={{ width: 38, height: 38, borderRadius: 10, background: soft, border: `1px solid ${border}`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {transfer.type === "member" ? <User size={16} /> : <Users size={16} />}
                </div>

                {/* Nom + badges */}
                <div style={{ flex: "1 1 0", minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ borderRadius: 999, padding: "2px 7px", background: soft, color: accent, fontSize: 10, fontWeight: 700, border: `1px solid ${border}` }}>
                            {transfer.type === "member" ? "Membre" : transfer.type === "external" ? "Sortie" : "Famille"}
                        </span>
                        <span className="mono" style={{ color: "#94a3b8", fontSize: 10 }}>{transfer.reference}</span>
                    </div>
                </div>

                {/* Trajet compact */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", background: "#f1f5f9", borderRadius: 8, padding: "4px 8px", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{from}</span>
                    <ArrowRight size={12} style={{ color: accent, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", background: "#f1f5f9", borderRadius: 8, padding: "4px 8px", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{target}</span>
                </div>

                {/* Status */}
                <div style={{ flexShrink: 0 }}>
                    <StatusPill status={transfer.status} />
                </div>

                {/* Bouton voir plus */}
                <button
                    type="button"
                    onClick={() => setShowDetail(true)}
                    style={{ flexShrink: 0, border: "1px solid #e2e8f0", borderRadius: 10, padding: "7px 12px", background: "#f8fafc", color: "#334155", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
                >
                    <ArrowRight size={12} />
                    Voir plus
                </button>
            </div>

            {showDetail && (
                <TransferDetailModal
                    transfer={transfer}
                    onApprove={onApprove}
                    onRefuse={onRefuse}
                    onClose={() => setShowDetail(false)}
                />
            )}
        </>
    );
}

function Info({ icon: Icon, label, value }) {
    return (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 14px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                <Icon size={14} />
                {label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{value}</div>
        </div>
    );
}

function RouteBox({ label, value }) {
    return (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 14px", minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.35, wordBreak: "break-word" }}>{value}</div>
        </div>
    );
}

export default function TransfersWorkflow() {
    const { pendingTransfers = [], processedTransfers = [], classes = [], families = [], members = [], userClass = {}, flash = {}, errors = {} } = usePage().props;

    // Séparer les transferts externes en attente pasteur des transferts clôturés
    const externalPasteurPending = processedTransfers.filter(t => t.status === "EN_ATTENTE_PASTEUR");
    const closedTransfers = processedTransfers.filter(t => t.status !== "EN_ATTENTE_PASTEUR");
    const [tab, setTab] = useState("pending");
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState(initialForm);

    const grouped = useMemo(() => ({
        source: pendingTransfers.filter((t) => t.approval_stage === "source"),
        accueil: pendingTransfers.filter((t) => t.approval_stage === "accueil"),
        outgoing: pendingTransfers.filter((t) => t.waiting_on_other_class),
    }), [pendingTransfers]);

    const formErrors = useMemo(() => Object.values(errors || {}), [errors]);
    const canCreate = members.length > 0 || families.length > 0;
    const canSubmit = form.type.includes("member")
        ? form.type.includes("external")
          ? Boolean(form.user_id && form.destination_city && form.destination_church)
          : Boolean(form.user_id && form.target_class_id)
        : form.type.includes("external")
          ? Boolean(form.family_id && form.destination_city && form.destination_church)
          : Boolean(form.family_id && form.target_class_id);
    const selectedType = useMemo(
        () => transferTypeOptions.find((option) => option.value === form.type) || transferTypeOptions[0],
        [form.type],
    );
    const selectedMember = useMemo(
        () => (form.user_id ? members.find((member) => String(member.id) === String(form.user_id)) : null),
        [members, form.user_id],
    );
    const selectedFamily = useMemo(
        () => (form.family_id ? families.find((family) => String(family.id) === String(form.family_id)) : null),
        [families, form.family_id],
    );
    const selectedClass = useMemo(
        () => (form.target_class_id ? classes.find((classe) => String(classe.id) === String(form.target_class_id)) : null),
        [classes, form.target_class_id],
    );
    const stepTwoValid = form.type.includes("member")
        ? form.type.includes("external")
          ? Boolean(form.user_id && form.destination_city && form.destination_church)
          : Boolean(form.user_id && form.target_class_id)
        : form.type.includes("external")
          ? Boolean(form.family_id && form.destination_city && form.destination_church)
          : Boolean(form.family_id && form.target_class_id);
    const reviewRows = useMemo(() => {
        const rows = [
            { label: "Type", value: selectedType?.label || form.type },
            {
                label: form.type.includes("member") ? "Beneficiaire" : "Famille source",
                value: form.type.includes("member")
                    ? (selectedMember ? `${selectedMember.nom} ${selectedMember.prenom}` : "-")
                    : (selectedFamily ? `${selectedFamily.nom}${selectedFamily.code_famille ? ` • ${selectedFamily.code_famille}` : ""}` : "-"),
                strong: true,
            },
            {
                label: "Depart",
                value: userClass.nom || "Votre classe",
            },
            form.type.includes("external")
                ? {
                      label: "Destination",
                      value: `${form.destination_city || "-"}${form.destination_church ? ` • ${form.destination_church}` : ""}`,
                  }
                : {
                      label: "Classe d'accueil",
                      value: selectedClass?.nom || "-",
                  },
        ];

        if (form.type.includes("member") && selectedMember?.family_name) {
            rows.push({
                label: "Famille d'origine",
                value: `${selectedMember.family_name}${selectedMember.family_code ? ` • ${selectedMember.family_code}` : ""}`,
            });
        }

        if (form.type.includes("external") && form.destination_note) {
            rows.push({
                label: "Note destination",
                value: form.destination_note,
            });
        }

        if (form.reason) {
            rows.push({
                label: "Motif",
                value: form.reason,
            });
        }

        return rows;
    }, [form, selectedClass, selectedFamily, selectedMember, selectedType, userClass.nom]);

    const approve = (id) => {
        const transfer = pendingTransfers.find((t) => t.id === id);
        if (!transfer) return;
        const url = transfer.approval_stage === "source" ? `/conducteur/transferts/${id}/approve-source` : `/conducteur/transferts/${id}/approve-accueil`;
        router.post(withBasePath("", url), {}, { preserveScroll: true });
    };

    const refuse = (id, reason) => {
        router.post(withBasePath("", `/conducteur/transferts/${id}/refuse`), { reason }, { preserveScroll: true });
    };

    const closeModal = () => {
        setOpen(false);
        setStep(1);
        setSubmitting(false);
        setForm(initialForm);
    };

    const openModal = () => {
        setForm(initialForm);
        setStep(1);
        setSubmitting(false);
        setOpen(true);
    };

    const handleTypeChange = (type) => {
        setForm({
            ...initialForm,
            type,
        });
    };

    const nextStep = () => {
        if (step === 1) {
            setStep(2);
            return;
        }

        if (step === 2 && stepTwoValid) {
            setStep(3);
        }
    };

    const previousStep = () => {
        if (step > 1) {
            setStep(step - 1);
            return;
        }

        closeModal();
    };

    const submit = () => {
        if (!canSubmit) return;
        setSubmitting(true);
        router.post(withBasePath("", "/conducteur/transferts"), {
            type: form.type.includes("member") ? "member" : "family",
            transfer_mode: form.type.includes("external") ? "external" : "internal",
            user_id: form.type.includes("member") ? Number(form.user_id) : null,
            family_id: !form.type.includes("member") ? Number(form.family_id) : null,
            target_class_id: !form.type.includes("external") ? Number(form.target_class_id) : null,
            destination_city: form.type.includes("external") ? form.destination_city : null,
            destination_church: form.type.includes("external") ? form.destination_church : null,
            reason: form.reason || null,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: closeModal,
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <>
            <style>{styles}</style>
            <div style={{ minHeight: "100vh", width: "100%", background: "#5B21B6" }}>
                <div style={{ width: "100%", maxWidth: "none", margin: 0, padding: "28px clamp(12px, 2vw, 24px) 40px" }}>
                    <Link href={withBasePath("", "/conducteur/inscriptions")} className="glass" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", marginBottom: 18 }}>
                        <ArrowLeft size={16} />
                        Retour aux inscriptions
                    </Link>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".10em", textTransform: "uppercase", color: "rgba(255,255,255,.65)", marginBottom: 8 }}>Tableau conducteur</div>
                            <div style={{ fontSize: 34, lineHeight: 1.05, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Gestion des transferts</div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", color: "rgba(255,255,255,.82)", fontSize: 14 }}>
                                <Building2 size={15} />
                                Classe : <strong style={{ color: "#fff" }}>{userClass.nom || "-"}</strong>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                            <div className="glass" style={{ borderRadius: 999, padding: "10px 14px", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                                <Clock size={15} />
                                {pendingTransfers.length} en attente
                            </div>
                            <button type="button" className="btn btn-primary" onClick={openModal} disabled={!canCreate}>
                                <Plus size={16} />
                                Nouveau transfert
                            </button>
                        </div>
                    </div>

                    {(flash.success || flash.error) && (
                        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
                            {flash.success && <div className="glass" style={{ borderRadius: 16, padding: "14px 16px", color: "#fff", display: "flex", gap: 10, alignItems: "center" }}><CheckCircle size={18} style={{ color: "#86efac" }} />{flash.success}</div>}
                            {flash.error && <div className="glass" style={{ borderRadius: 16, padding: "14px 16px", color: "#fff", display: "flex", gap: 10, alignItems: "center" }}><AlertCircle size={18} style={{ color: "#fca5a5" }} />{flash.error}</div>}
                        </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 26 }}>
                        <Stat icon={ShieldCheck} title="A valider source" value={grouped.source.length} iconBg="#fff7ed" iconColor="#f97316" />
                        <Stat icon={MapPin} title="A valider accueil" value={grouped.accueil.length} iconBg="#ecfeff" iconColor="#06b6d4" />
                        <Stat icon={Send} title="Attente autre classe" value={grouped.outgoing.length} iconBg="#eff6ff" iconColor="#2563eb" />
                        <Stat icon={History} title="Cloturees" value={processedTransfers.length} iconBg="#f0fdf4" iconColor="#16a34a" />
                    </div>

                    <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                        <button type="button" className={`tab ${tab === "pending" ? "active" : "idle"}`} onClick={() => setTab("pending")}><Clock size={15} />En cours</button>
                        <button type="button" className={`tab ${tab === "processed" ? "active" : "idle"}`} onClick={() => setTab("processed")}><History size={15} />Historique</button>
                    </div>

                    {tab === "pending" ? (
                        pendingTransfers.length === 0 ? (
                            <div className="glass" style={{ borderRadius: 22, padding: "56px 22px", textAlign: "center", color: "#fff" }}>Aucune demande en attente.</div>
                        ) : (
                            <div style={{ display: "grid", gap: 30 }}>
                                {grouped.source.length > 0 && <Section title="Validation source" desc="Demandes qui attendent votre accord dans votre classe." count={grouped.source.length} color="#f97316"><PaginatedTransferList transfers={grouped.source} onApprove={approve} onRefuse={refuse} /></Section>}
                                {grouped.accueil.length > 0 && <Section title="Validation accueil" desc="Demandes recues d'une autre classe." count={grouped.accueil.length} color="#06b6d4"><PaginatedTransferList transfers={grouped.accueil} onApprove={approve} onRefuse={refuse} /></Section>}
                                {grouped.outgoing.length > 0 && <Section title="Demandes envoyees" desc="Demandes deja validees cote source et en attente ailleurs." count={grouped.outgoing.length} color="#2563eb"><PaginatedTransferList transfers={grouped.outgoing} onApprove={approve} onRefuse={refuse} /></Section>}
                            </div>
                        )
                    ) : (
                        <div style={{ display: "grid", gap: 20 }}>

                            {/* Transferts externes en attente du pasteur */}
                            {externalPasteurPending.length > 0 && (
                                <Section title="Sorties externes — en attente du pasteur" desc="Ces demandes ont été transmises au pasteur pour validation finale." count={externalPasteurPending.length} color="#7c3aed">
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead><tr style={{ background: "#f8fafc" }}>
                                                <th style={head}>Bénéficiaire</th>
                                                <th style={head}>Destination</th>
                                                <th style={head}>Demandé le</th>
                                                <th style={{ ...head, textAlign: "right" }}>Statut</th>
                                            </tr></thead>
                                            <tbody>
                                                {externalPasteurPending.map(t => (
                                                    <tr key={t.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                                                        <td style={cell}>
                                                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{t.member?.name || t.family?.name || "-"}</div>
                                                            <div className="mono" style={{ fontSize: 11, color: "#64748b" }}>{t.reference}</div>
                                                        </td>
                                                        <td style={cell}>
                                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                                <span style={{ color: "#64748b" }}>{t.classe_source?.nom || "-"}</span>
                                                                <ArrowRight size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                                                                <strong style={{ color: "#7c3aed" }}>{t.external_destination || "—"}</strong>
                                                            </div>
                                                            {t.reason && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{t.reason}</div>}
                                                        </td>
                                                        <td style={cell}>{t.created_at || "-"}</td>
                                                        <td style={{ ...cell, textAlign: "right" }}><StatusPill status={t.status} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Section>
                            )}

                            {/* Historique clôturé */}
                            <div className="card" style={{ overflow: "hidden" }}>
                                <div style={{ padding: "18px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, color: "#0f172a" }}><History size={18} />Historique des transferts</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{closedTransfers.length} entrée(s)</div>
                                </div>
                                {closedTransfers.length === 0
                                    ? <div style={{ padding: 40, color: "#64748b", textAlign: "center" }}>Aucun transfert clôturé pour le moment.</div>
                                    : (
                                        <div style={{ overflowX: "auto" }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                <thead><tr style={{ background: "#f8fafc" }}>
                                                    <th style={head}>Bénéficiaire</th>
                                                    <th style={head}>Trajet</th>
                                                    <th style={head}>Date</th>
                                                    <th style={{ ...head, textAlign: "right" }}>Statut</th>
                                                </tr></thead>
                                                <tbody>
                                                    {closedTransfers.map(t => (
                                                        <tr key={t.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                                                            <td style={cell}>
                                                                <div style={{ fontWeight: 700, color: "#0f172a" }}>{t.member?.name || t.family?.name || "-"}</div>
                                                                <div className="mono" style={{ fontSize: 11, color: "#64748b" }}>{t.reference}</div>
                                                            </td>
                                                            <td style={cell}>
                                                                <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 220 }}>
                                                                    <span>{t.classe_source?.nom || "-"}</span>
                                                                    <ArrowRight size={14} style={{ color: "#94a3b8" }} />
                                                                    <strong style={{ color: "#0f172a" }}>{t.external_destination || t.classe_cible?.nom || "-"}</strong>
                                                                </div>
                                                            </td>
                                                            <td style={cell}>{t.created_at || "-"}</td>
                                                            <td style={{ ...cell, textAlign: "right" }}><StatusPill status={t.status} /></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {open && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <div style={{ padding: "24px 24px 22px", background: selectedType.accent, borderBottom: "1px solid rgba(255,255,255,.12)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.68)", marginBottom: 8 }}>Etape {step} sur 3</div>
                                    <div style={{ fontSize: 28, lineHeight: 1.05, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Nouveau transfert</div>
                                    <div style={{ color: "rgba(255,255,255,.82)", fontSize: 14, lineHeight: 1.6, maxWidth: 560 }}>Même structure que le module responsable de famille, avec la validation source automatique propre au conducteur.</div>
                                    <StepDots current={step} total={3} />
                                </div>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={closeModal}
                                    style={{ background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.16)" }}
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: 24, display: "grid", gap: 18 }}>
                            {formErrors.length > 0 && <div style={{ borderRadius: 16, border: "1px solid #fecaca", background: "#fff1f2", padding: 14, color: "#9f1239" }}>{formErrors.map((m, i) => <div key={`${m}-${i}`}>- {m}</div>)}</div>}
                            {step === 1 && (
                                <div style={{ display: "grid", gap: 18 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 14 }}>Qui concerne ce transfert ?</div>
                                        <div style={{ display: "grid", gap: 12 }}>
                                            {transferTypeOptions.map((option) => {
                                                const Icon = option.icon;
                                                const active = form.type === option.value;

                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        className={`step-option ${active ? "step-option-active" : ""}`}
                                                        onClick={() => handleTypeChange(option.value)}
                                                        style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", width: "100%" }}
                                                    >
                                                        <div style={{ width: 48, height: 48, borderRadius: 16, background: option.soft, color: option.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <div style={{ minWidth: 0, flex: 1 }}>
                                                            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{option.label}</div>
                                                            <div style={{ fontSize: 13, lineHeight: 1.55, color: "#64748b" }}>{option.description}</div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div style={{ borderRadius: 18, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1e3a8a", padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                                        <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                                        <div style={{ lineHeight: 1.6, fontSize: 13 }}>
                                            {form.type.includes("external")
                                                ? "Une sortie externe est cloturee directement apres votre validation, sans attente d'une autre classe."
                                                : "Comme conducteur, votre validation source sera appliquee automatiquement a l'envoi. Le conducteur d'accueil reste le seul validateur suivant."}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div style={{ display: "grid", gap: 18 }}>
                                    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                                        {form.type.includes("member") ? (
                                            <label style={inputLabel}><span style={inputLabelText}>Membre concerne</span><Select2Single name="user_id" value={form.user_id} placeholder="Selectionner un membre" onChange={(e) => setForm((cur) => ({ ...cur, user_id: e.target.value }))} options={members.map((m) => ({ value: m.id, label: buildTransferOptionLabel(m, `${m.nom} ${m.prenom} - ${m.family_name || "Sans famille"}`), description: buildTransferOptionDescription(m, `${m.code_membre || "Sans code"}${m.family_code ? ` - ${m.family_code}` : ""}`), disabled: m.transfer_locked }))} /></label>
                                        ) : (
                                            <label style={inputLabel}><span style={inputLabelText}>Famille concernee</span><Select2Single name="family_id" value={form.family_id} placeholder="Selectionner une famille" onChange={(e) => setForm((cur) => ({ ...cur, family_id: e.target.value }))} options={families.map((f) => ({ value: f.id, label: buildTransferOptionLabel(f, `${f.nom} - ${f.code_famille || "Sans code"}`), description: buildTransferOptionDescription(f, f.responsable ? `Responsable: ${f.responsable}` : "Sans responsable"), disabled: f.transfer_locked }))} /></label>
                                        )}

                                        {!form.type.includes("external") ? (
                                            <label style={inputLabel}><span style={inputLabelText}>Classe d'accueil</span><Select2Single name="target_class_id" value={form.target_class_id} placeholder="Selectionner une classe" onChange={(e) => setForm((cur) => ({ ...cur, target_class_id: e.target.value }))} options={classes.map((c) => ({ value: c.id, label: c.nom }))} /></label>
                                        ) : (
                                            <>
                                                <label style={inputLabel}><span style={inputLabelText}>Ville de destination</span><input className="field" value={form.destination_city} onChange={(e) => setForm((cur) => ({ ...cur, destination_city: e.target.value }))} placeholder="Ex: Abidjan" /></label>
                                                <label style={inputLabel}><span style={inputLabelText}>Nom d'eglise de destination</span><input className="field" value={form.destination_church} onChange={(e) => setForm((cur) => ({ ...cur, destination_church: e.target.value }))} placeholder="Ex: Eglise genese" /></label>
                                            </>
                                        )}
                                    </div>

                                    {form.type.includes("external") && (
                                        <label style={inputLabel}><span style={inputLabelText}>Motif</span><textarea className="field" rows={4} value={form.reason} onChange={(e) => setForm((cur) => ({ ...cur, reason: e.target.value }))} placeholder="Expliquez la raison du transfert" style={{ resize: "vertical" }} /></label>
                                    )}

                                    {!form.type.includes("external") && (
                                        <label style={inputLabel}><span style={inputLabelText}>Motif</span><textarea className="field" rows={4} value={form.reason} onChange={(e) => setForm((cur) => ({ ...cur, reason: e.target.value }))} placeholder="Expliquez la raison du transfert" style={{ resize: "vertical" }} /></label>
                                    )}

                                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                                        <div style={{ borderRadius: 16, background: "#fff", border: "1px solid #e2e8f0", padding: "14px 16px" }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>Depuis</div>
                                            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{userClass.nom || "Votre classe"}</div>
                                        </div>
                                        <div style={{ borderRadius: 16, background: "#fff", border: "1px solid #e2e8f0", padding: "14px 16px" }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>Suite du workflow</div>
                                            <div style={{ fontSize: 14, lineHeight: 1.5, color: "#334155" }}>
                                                {form.type.includes("external")
                                                    ? "Cloture immediate apres validation source."
                                                    : "Transmission directe au conducteur de la classe d'accueil."}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div style={{ display: "grid", gap: 18 }}>
                                    <div style={{ display: "grid", gap: 8 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Recapitulatif avant envoi</div>
                                        <div style={{ borderRadius: 20, overflow: "hidden", background: "#fff", border: "1px solid #e2e8f0" }}>
                                            {reviewRows.map((row, index) => (
                                                <div key={`${row.label}-${index}`} style={{ borderBottom: index === reviewRows.length - 1 ? "none" : "1px solid #e2e8f0" }}>
                                                    <SummaryRow label={row.label} value={row.value} strong={row.strong} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ borderRadius: 18, border: "1px solid #c7f9cc", background: "#f0fdf4", color: "#166534", padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                                        <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                                        <div style={{ fontSize: 13, lineHeight: 1.65 }}>
                                            {form.type.includes("external")
                                                ? "Apres confirmation, le transfert sera enregistre et cloture immediatement dans le workflow conducteur."
                                                : "Apres confirmation, votre validation source sera enregistree puis la demande passera automatiquement en attente d'accueil."}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                                <button type="button" className="btn btn-ghost" onClick={previousStep}>{step > 1 ? "Retour" : "Annuler"}</button>
                                {step < 3 ? (
                                    <button type="button" className="btn btn-primary" onClick={nextStep} disabled={step === 2 && !stepTwoValid}><ArrowRight size={16} />Continuer</button>
                                ) : (
                                    <button type="button" className="btn btn-primary" onClick={submit} disabled={!canSubmit || submitting}><Send size={16} />{submitting ? "Envoi..." : "Confirmer l'envoi"}</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

const PER_PAGE = 5;

function PaginatedTransferList({ transfers, onApprove, onRefuse }) {
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [showBulkRefuse, setShowBulkRefuse] = useState(false);
    const [bulkRefuseReason, setBulkRefuseReason] = useState("");

    const total = transfers.length;
    const totalPages = Math.ceil(total / PER_PAGE);
    const start = (page - 1) * PER_PAGE;
    const visible = transfers.slice(start, start + PER_PAGE);
    const actionable = visible.filter(t => t.requires_action);
    const allPageSelected = actionable.length > 0 && actionable.every(t => selectedIds.has(t.id));
    const selectedCount = selectedIds.size;

    React.useEffect(() => { setPage(1); setSelectedIds(new Set()); }, [transfers.length]);

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allPageSelected) {
                actionable.forEach(t => next.delete(t.id));
            } else {
                actionable.forEach(t => next.add(t.id));
            }
            return next;
        });
    };

    const handleBulkApprove = async () => {
        if (selectedCount === 0 || bulkProcessing) return;
        setBulkProcessing(true);
        try {
            await Promise.all([...selectedIds].map(id => {
                const t = transfers.find(x => x.id === id);
                if (!t) return Promise.resolve();
                const url = t.approval_stage === "source"
                    ? withBasePath("", `/conducteur/transferts/${id}/approve-source`)
                    : withBasePath("", `/conducteur/transferts/${id}/approve-accueil`);
                return axios.post(url);
            }));
            setSelectedIds(new Set());
            router.reload({ preserveScroll: true });
        } catch (e) {
            console.error("Erreur approbation groupée", e);
        } finally {
            setBulkProcessing(false);
        }
    };

    const handleBulkRefuse = async () => {
        if (!bulkRefuseReason.trim() || selectedCount === 0 || bulkProcessing) return;
        setBulkProcessing(true);
        try {
            await Promise.all([...selectedIds].map(id =>
                axios.post(withBasePath("", `/conducteur/transferts/${id}/refuse`), { reason: bulkRefuseReason })
            ));
            setSelectedIds(new Set());
            setShowBulkRefuse(false);
            setBulkRefuseReason("");
            router.reload({ preserveScroll: true });
        } catch (e) {
            console.error("Erreur refus groupé", e);
        } finally {
            setBulkProcessing(false);
        }
    };

    return (
        <div>
            {/* Barre d'actions groupées */}
            {actionable.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, padding: "10px 14px", background: "rgba(255,255,255,.08)", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 600, userSelect: "none" }}>
                        <input
                            type="checkbox"
                            checked={allPageSelected}
                            onChange={toggleSelectAll}
                            style={{ width: 16, height: 16, accentColor: "#0f766e", cursor: "pointer" }}
                        />
                        Tout sélectionner ({actionable.length})
                    </label>

                    {selectedCount > 0 && (
                        <>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>
                                {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
                            </span>
                            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                                <button
                                    type="button"
                                    onClick={handleBulkApprove}
                                    disabled={bulkProcessing}
                                    style={{ display: "flex", alignItems: "center", gap: 7, border: "none", borderRadius: 10, padding: "8px 16px", background: "#0f766e", color: "#fff", fontSize: 13, fontWeight: 700, cursor: bulkProcessing ? "not-allowed" : "pointer", opacity: bulkProcessing ? 0.7 : 1 }}
                                >
                                    <CheckCircle size={15} />
                                    {bulkProcessing ? "Traitement..." : `Approuver (${selectedCount})`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowBulkRefuse(true)}
                                    disabled={bulkProcessing}
                                    style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid #fecdd3", borderRadius: 10, padding: "8px 16px", background: "#fff1f2", color: "#9f1239", fontSize: 13, fontWeight: 700, cursor: bulkProcessing ? "not-allowed" : "pointer", opacity: bulkProcessing ? 0.7 : 1 }}
                                >
                                    <XCircle size={15} />
                                    Refuser ({selectedCount})
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Mini-modale refus groupé */}
            {showBulkRefuse && (
                <div className="modal-backdrop" onClick={() => { setShowBulkRefuse(false); setBulkRefuseReason(""); }}>
                    <div style={{ width: "min(480px,100%)", background: "#fff", borderRadius: 20, boxShadow: "0 30px 60px rgba(15,23,42,.25)", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: "18px 22px", background: "#fff1f2", borderBottom: "1px solid #fecdd3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: "#9f1239" }}>Refus groupé</div>
                                <div style={{ fontSize: 12, color: "#e11d48", marginTop: 2 }}>{selectedCount} demande{selectedCount > 1 ? "s" : ""} sélectionnée{selectedCount > 1 ? "s" : ""}</div>
                            </div>
                            <button onClick={() => { setShowBulkRefuse(false); setBulkRefuseReason(""); }} style={{ border: "none", background: "rgba(0,0,0,.06)", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                <XCircle size={15} style={{ color: "#64748b" }} />
                            </button>
                        </div>
                        <div style={{ padding: "18px 22px", display: "grid", gap: 14 }}>
                            <div style={{ fontSize: 13, color: "#334155" }}>
                                Ce motif sera appliqué à toutes les demandes sélectionnées.
                            </div>
                            <textarea
                                className="field"
                                rows={4}
                                value={bulkRefuseReason}
                                onChange={e => setBulkRefuseReason(e.target.value)}
                                placeholder="Motif du refus (obligatoire)…"
                                style={{ resize: "vertical" }}
                            />
                            <div style={{ display: "flex", gap: 10 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => { setShowBulkRefuse(false); setBulkRefuseReason(""); }} style={{ flex: 1 }}>
                                    Annuler
                                </button>
                                <button type="button" className="btn btn-danger" onClick={handleBulkRefuse} disabled={!bulkRefuseReason.trim() || bulkProcessing} style={{ flex: 1 }}>
                                    <XCircle size={15} />
                                    {bulkProcessing ? "Traitement..." : "Confirmer le refus"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Liste */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {visible.map((t) => (
                    <TransferCard
                        key={t.id}
                        transfer={t}
                        onApprove={onApprove}
                        onRefuse={onRefuse}
                        selected={selectedIds.has(t.id)}
                        onToggle={t.requires_action ? toggleSelect : null}
                    />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)", fontWeight: 600 }}>
                        {start + 1}–{Math.min(start + PER_PAGE, total)} sur {total}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            style={{ border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, padding: "5px 12px", background: page === 1 ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.12)", color: page === 1 ? "rgba(255,255,255,.3)" : "#fff", fontSize: 12, fontWeight: 700, cursor: page === 1 ? "default" : "pointer" }}>
                            ‹ Préc.
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} type="button" onClick={() => setPage(p)}
                                style={{ border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, padding: "5px 10px", background: p === page ? "#fff" : "rgba(255,255,255,.12)", color: p === page ? "#0f172a" : "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", minWidth: 32 }}>
                                {p}
                            </button>
                        ))}
                        <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            style={{ border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, padding: "5px 12px", background: page === totalPages ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.12)", color: page === totalPages ? "rgba(255,255,255,.3)" : "#fff", fontSize: 12, fontWeight: 700, cursor: page === totalPages ? "default" : "pointer" }}>
                            Suiv. ›
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Section({ title, desc, count, color, children }) {
    return (
        <div
            className="glass"
            style={{
                width: "100%",
                borderRadius: 26,
                padding: "18px clamp(14px, 1.8vw, 24px) 22px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 4, height: 32, borderRadius: 999, background: color, boxShadow: `0 0 18px ${color}55` }} />
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{title}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,.78)", maxWidth: 620 }}>{desc}</div>
                    </div>
                </div>
                <div style={{ borderRadius: 999, padding: "5px 11px", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.18)", color: "#fff", fontSize: 12, fontWeight: 700 }}>{count}</div>
            </div>
            <div style={{ width: "100%" }}>{children}</div>
        </div>
    );
}

const head = { textAlign: "left", padding: "12px 18px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#64748b" };
const cell = { padding: "14px 18px", fontSize: 14, color: "#334155" };
