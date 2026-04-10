import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
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
  .btn-primary{color:#fff;background:linear-gradient(135deg,#0f766e,#155e75)}
  .btn-ghost{color:#334155;background:#fff;border:1px solid #d9e2ef}
  .btn-danger{color:#9f1239;background:#fff1f2;border:1px solid #fecdd3}
  .btn:disabled{opacity:.6;cursor:not-allowed}
  .field{width:100%;border-radius:12px;border:1px solid #d9e2ef;padding:12px 14px;font-size:14px;outline:none}
  .field:focus{border-color:#0f766e;box-shadow:0 0 0 4px rgba(15,118,110,.12)}
  .pill{display:inline-flex;gap:6px;align-items:center;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;text-transform:uppercase}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px;align-items:start;justify-items:start}
  .modal-backdrop{position:fixed;inset:0;z-index:90;background:rgba(15,23,42,.56);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px}
  .modal{width:min(760px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#f8fbff;border:1px solid #d9e2ef;border-radius:24px;box-shadow:0 30px 60px rgba(15,23,42,.25)}
`;

const initialForm = {
    type: "member",
    user_id: "",
    family_id: "",
    target_class_id: "",
    destination_city: "",
    destination_country: "",
    destination_note: "",
    reason: "",
};

const statusCfg = {
    EN_ATTENTE_SOURCE: { label: "Attente source", bg: "#fff7ed", color: "#c2410c", dot: "#f97316" },
    EN_ATTENTE_ACCUEIL: { label: "Attente accueil", bg: "#ecfeff", color: "#155e75", dot: "#06b6d4" },
    TERMINEE: { label: "Terminee", bg: "#f0fdf4", color: "#166534", dot: "#22c55e" },
    REFUSEE: { label: "Refusee", bg: "#fff1f2", color: "#9f1239", dot: "#f43f5e" },
};

const inputLabel = { display: "grid", gap: 8 };
const inputLabelText = { fontSize: 13, fontWeight: 700, color: "#334155" };

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

function TransferCard({ transfer, onApprove, onRefuse }) {
    const [showRefuse, setShowRefuse] = useState(false);
    const [reason, setReason] = useState("");
    const [processing, setProcessing] = useState(false);
    const accent = transfer.approval_stage === "source" ? "#f97316" : "#06b6d4";
    const soft = transfer.approval_stage === "source" ? "#fff7ed" : "#ecfeff";
    const border = transfer.approval_stage === "source" ? "#fed7aa" : "#a5f3fc";
    const name = transfer.member?.name || transfer.family?.name || "-";
    const family = transfer.famille_source?.nom || transfer.family?.name || "-";
    const target = transfer.external_destination || transfer.classe_cible?.nom || "-";

    const approve = () => {
        setProcessing(true);
        onApprove(transfer.id);
    };

    const refuse = () => {
        if (!reason.trim()) return;
        setProcessing(true);
        onRefuse(transfer.id, reason);
    };

    return (
        <div className="card" style={{ overflow: "hidden", width: "100%", maxWidth: 460, justifySelf: "start" }}>
            <div style={{ padding: "18px 20px", background: `linear-gradient(135deg, ${soft} 0%, #fff 100%)`, borderBottom: `1px solid ${border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 12, minWidth: 0, flex: "1 1 240px" }}>
                        <div style={{ width: 46, height: 46, borderRadius: 14, background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {transfer.type === "member" ? <User size={18} /> : <Users size={18} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4, lineHeight: 1.25 }}>{name}</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ borderRadius: 999, padding: "4px 9px", background: "#fff", border: `1px solid ${border}`, color: accent, fontSize: 11, fontWeight: 700 }}>
                                    {transfer.type === "member" ? "Membre" : transfer.type === "external" ? "Sortie" : "Famille"}
                                </span>
                                <span className="mono" style={{ color: "#64748b", fontSize: 11 }}>{transfer.reference}</span>
                            </div>
                        </div>
                    </div>
                    <StatusPill status={transfer.status} />
                </div>
            </div>
            <div style={{ padding: 20, display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
                    <Info icon={Clock} label="Date" value={transfer.created_at || "-"} />
                    <Info icon={User} label="Demandeur" value={transfer.created_by || "-"} />
                    <Info icon={Users} label="Famille" value={family} />
                </div>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
                    <RouteBox label="Depuis" value={transfer.classe_source?.nom || "-"} />
                    <div style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: soft, border: `1px solid ${border}`, color: accent, justifySelf: "center" }}>
                        <ArrowRight size={16} />
                    </div>
                    <RouteBox label="Vers" value={target} />
                </div>
                {transfer.reason && <div style={{ borderRadius: 14, border: "1px dashed #d9e2ef", padding: "12px 14px", background: "#f8fafc", color: "#334155", lineHeight: 1.5 }}>{transfer.reason}</div>}
                {transfer.requires_action ? (
                    !showRefuse ? (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button type="button" className="btn btn-primary" onClick={approve} disabled={processing} style={{ flex: 1 }}>
                                <CheckCircle size={16} />
                                {processing ? "Traitement..." : "Approuver"}
                            </button>
                            <button type="button" className="btn btn-danger" onClick={() => setShowRefuse(true)} disabled={processing} style={{ flex: 1 }}>
                                <XCircle size={16} />
                                Refuser
                            </button>
                        </div>
                    ) : (
                        <div style={{ borderRadius: 16, background: "#fff1f2", border: "1px solid #fecdd3", padding: 14 }}>
                            <textarea className="field" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif du refus" style={{ resize: "vertical", marginBottom: 10 }} />
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <button type="button" className="btn btn-ghost" onClick={() => { setShowRefuse(false); setReason(""); }} style={{ flex: 1 }}>Annuler</button>
                                <button type="button" className="btn btn-danger" onClick={refuse} disabled={!reason.trim() || processing} style={{ flex: 1 }}>Confirmer</button>
                            </div>
                        </div>
                    )
                ) : (
                    <div style={{ borderRadius: 16, background: "#eff6ff", border: "1px solid #bfdbfe", padding: 14, color: "#334155", lineHeight: 1.5 }}>
                        <strong style={{ color: "#1d4ed8" }}>En attente du conducteur d'accueil.</strong> Votre validation source est deja enregistree. La demande attend maintenant la classe <strong>{transfer.classe_cible?.nom || "d'accueil"}</strong>.
                    </div>
                )}
            </div>
        </div>
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
    const [tab, setTab] = useState("pending");
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState(initialForm);

    const grouped = useMemo(() => ({
        source: pendingTransfers.filter((t) => t.approval_stage === "source"),
        accueil: pendingTransfers.filter((t) => t.approval_stage === "accueil"),
        outgoing: pendingTransfers.filter((t) => t.waiting_on_other_class),
    }), [pendingTransfers]);

    const formErrors = useMemo(() => Object.values(errors || {}), [errors]);
    const canCreate = members.length > 0 || families.length > 0;
    const canSubmit = form.type === "member"
        ? Boolean(form.user_id && form.target_class_id)
        : form.type === "family"
          ? Boolean(form.family_id && form.target_class_id)
          : Boolean(form.family_id && form.destination_city && form.destination_country);

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
        setSubmitting(false);
        setForm(initialForm);
    };

    const submit = () => {
        if (!canSubmit) return;
        setSubmitting(true);
        router.post(withBasePath("", "/conducteur/transferts"), {
            type: form.type,
            user_id: form.type === "member" ? Number(form.user_id) : null,
            family_id: form.type !== "member" ? Number(form.family_id) : null,
            target_class_id: form.type === "external" ? null : Number(form.target_class_id),
            destination_city: form.type === "external" ? form.destination_city : null,
            destination_country: form.type === "external" ? form.destination_country : null,
            destination_note: form.type === "external" ? form.destination_note || null : null,
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
            <div style={{ minHeight: "100vh", width: "100%", background: "linear-gradient(135deg,#6B46C1 0%,#1E40AF 48%,#B6C01A 100%)" }}>
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
                            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)} disabled={!canCreate}>
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
                                {grouped.source.length > 0 && <Section title="Validation source" desc="Demandes qui attendent votre accord dans votre classe." count={grouped.source.length} color="#f97316"><div className="grid">{grouped.source.map((t) => <TransferCard key={t.id} transfer={t} onApprove={approve} onRefuse={refuse} />)}</div></Section>}
                                {grouped.accueil.length > 0 && <Section title="Validation accueil" desc="Demandes recues d'une autre classe." count={grouped.accueil.length} color="#06b6d4"><div className="grid">{grouped.accueil.map((t) => <TransferCard key={t.id} transfer={t} onApprove={approve} onRefuse={refuse} />)}</div></Section>}
                                {grouped.outgoing.length > 0 && <Section title="Demandes envoyees" desc="Demandes deja validees cote source et en attente ailleurs." count={grouped.outgoing.length} color="#2563eb"><div className="grid">{grouped.outgoing.map((t) => <TransferCard key={t.id} transfer={t} onApprove={approve} onRefuse={refuse} />)}</div></Section>}
                            </div>
                        )
                    ) : (
                        <div className="card" style={{ overflow: "hidden" }}>
                            <div style={{ padding: "18px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, color: "#0f172a" }}><History size={18} />Historique des transferts</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{processedTransfers.length} entree(s)</div>
                            </div>
                            {processedTransfers.length === 0 ? <div style={{ padding: 40, color: "#64748b", textAlign: "center" }}>Aucun transfert cloture pour le moment.</div> : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead><tr style={{ background: "#f8fafc" }}><th style={head}>Beneficiaire</th><th style={head}>Trajet</th><th style={head}>Date</th><th style={{ ...head, textAlign: "right" }}>Statut</th></tr></thead>
                                        <tbody>{processedTransfers.map((t) => <tr key={t.id} style={{ borderTop: "1px solid #e2e8f0" }}><td style={cell}><div style={{ fontWeight: 700, color: "#0f172a" }}>{t.member?.name || t.family?.name || "-"}</div><div className="mono" style={{ fontSize: 11, color: "#64748b" }}>{t.reference}</div></td><td style={cell}><div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 220 }}><span>{t.classe_source?.nom || "-"}</span><ArrowRight size={14} style={{ color: "#94a3b8" }} /><strong style={{ color: "#0f172a" }}>{t.external_destination || t.classe_cible?.nom || "-"}</strong></div></td><td style={cell}>{t.created_at || "-"}</td><td style={{ ...cell, textAlign: "right" }}><StatusPill status={t.status} /></td></tr>)}</tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {open && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <div style={{ padding: "24px 24px 18px", borderBottom: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".10em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Nouveau transfert</div>
                                    <div style={{ fontSize: 28, lineHeight: 1.05, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Soumettre un transfert conducteur</div>
                                    <div style={{ color: "#475569", fontSize: 14, lineHeight: 1.6 }}>Votre validation source sera appliquee automatiquement. Seul le conducteur de l'autre classe devra encore approuver.</div>
                                </div>
                                <button type="button" className="btn btn-ghost" onClick={closeModal}>Fermer</button>
                            </div>
                        </div>
                        <div style={{ padding: 24, display: "grid", gap: 18 }}>
                            {formErrors.length > 0 && <div style={{ borderRadius: 16, border: "1px solid #fecaca", background: "#fff1f2", padding: 14, color: "#9f1239" }}>{formErrors.map((m, i) => <div key={`${m}-${i}`}>- {m}</div>)}</div>}
                            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                                <label style={inputLabel}><span style={inputLabelText}>Type de transfert</span><select className="field" value={form.type} onChange={(e) => setForm({ ...initialForm, type: e.target.value })}><option value="member">Membre</option><option value="family">Famille</option><option value="external">Sortie externe</option></select></label>
                                {form.type === "member" ? <label style={inputLabel}><span style={inputLabelText}>Membre concerne</span><select className="field" value={form.user_id} onChange={(e) => setForm((cur) => ({ ...cur, user_id: e.target.value }))}><option value="">Selectionner un membre</option>{members.map((m) => <option key={m.id} value={m.id}>{`${m.nom} ${m.prenom} - ${m.family_name || "Sans famille"}`}</option>)}</select></label> : <label style={inputLabel}><span style={inputLabelText}>Famille concernee</span><select className="field" value={form.family_id} onChange={(e) => setForm((cur) => ({ ...cur, family_id: e.target.value }))}><option value="">Selectionner une famille</option>{families.map((f) => <option key={f.id} value={f.id}>{`${f.nom} - ${f.code_famille || "Sans code"}`}</option>)}</select></label>}
                                {form.type !== "external" ? <label style={inputLabel}><span style={inputLabelText}>Classe d'accueil</span><select className="field" value={form.target_class_id} onChange={(e) => setForm((cur) => ({ ...cur, target_class_id: e.target.value }))}><option value="">Selectionner une classe</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></label> : <>
                                    <label style={inputLabel}><span style={inputLabelText}>Ville de destination</span><input className="field" value={form.destination_city} onChange={(e) => setForm((cur) => ({ ...cur, destination_city: e.target.value }))} placeholder="Ex: Abidjan" /></label>
                                    <label style={inputLabel}><span style={inputLabelText}>Pays de destination</span><input className="field" value={form.destination_country} onChange={(e) => setForm((cur) => ({ ...cur, destination_country: e.target.value }))} placeholder="Ex: Cote d'Ivoire" /></label>
                                </>}
                            </div>
                            {form.type === "external" && <label style={inputLabel}><span style={inputLabelText}>Note de destination</span><textarea className="field" rows={3} value={form.destination_note} onChange={(e) => setForm((cur) => ({ ...cur, destination_note: e.target.value }))} placeholder="Detail complementaire" style={{ resize: "vertical" }} /></label>}
                            <label style={inputLabel}><span style={inputLabelText}>Motif</span><textarea className="field" rows={4} value={form.reason} onChange={(e) => setForm((cur) => ({ ...cur, reason: e.target.value }))} placeholder="Expliquez la raison du transfert" style={{ resize: "vertical" }} /></label>
                            <div style={{ borderRadius: 16, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1e3a8a", padding: 14, display: "flex", gap: 10, alignItems: "flex-start" }}><ShieldCheck size={18} style={{ flexShrink: 0 }} />{form.type === "external" ? "Une sortie externe sera enregistree directement sans validation d'une autre classe." : "Des l'envoi, votre classe source est consideree comme validee. La demande attendra ensuite uniquement le conducteur de la classe d'accueil."}</div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                                <button type="button" className="btn btn-ghost" onClick={closeModal}>Annuler</button>
                                <button type="button" className="btn btn-primary" onClick={submit} disabled={!canSubmit || submitting}><Send size={16} />{submitting ? "Envoi..." : "Envoyer la demande"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
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
