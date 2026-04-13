import React, { useState, useEffect, useRef } from "react";
import { router, useForm } from "@inertiajs/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import FormField from "@/Components/FormField";
import {
    User,
    UsersRound,
    Mail,
    Phone,
    Heart,
    Calendar,
    MapPin,
    Award,
    Gift,
    BookOpen,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    Users,
    Briefcase,
    Search,
    SlidersHorizontal,
    ShieldCheck,
    ShieldX,
    ScanLine,
    GraduationCap,
    UserCog,
    RotateCcw,
    FileDown,
    UserPlus,
    Eye,
    Pencil,
    Lock,
    LockOpen,
} from "lucide-react";
import Select2Fonction from "../../../Components/Select2Fonction";
import { withBasePath } from "../../../Utils/urlHelper";
import Select2Single from "../../../Components/Select2Single";
import ProfilePhoto from "../../../Components/ProfilePhoto";
import { resolveMemberPhotoUrl } from "../../../Helpers/PhotoHelper";
import { sanitizeUppercasePrenom } from "../../../Helpers/nameSanitizers";
import {
    GENDER_OPTIONS,
    MEMBER_MARITAL_STATUS_OPTIONS,
    RELATION_OPTIONS,
} from "../../../Helpers/select2SingleOptions";

const STATUS_FILTER_OPTIONS = [
    { value: "all", label: "Tous statuts" },
    { value: "actif", label: "Actifs" },
    { value: "inactif", label: "Inactifs" },
];

const ROLE_FILTER_OPTIONS = [
    { value: "", label: "Tous roles" },
    { value: "membre_famille", label: "Membre de famille" },
    { value: "responsable_famille", label: "Responsable de famille" },
    { value: "conducteur", label: "Conducteur" },
    { value: "pasteur", label: "Pasteur" },
];

// ------------------------------------------------------------------
// Fonction d'export PDF Professionnelle
// ------------------------------------------------------------------
const exportToPDF = (membres, filters = {}) => {
    const doc = new jsPDF({ orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const logoPath = "/images/image.png";
    const margin = 15;

    // 1. WATERMARK (FILIGRANE)
    doc.setGState(new doc.GState({ opacity: 0.05 }));
    try {
        doc.addImage(
            logoPath,
            "PNG",
            (pageWidth - 250) / 2,
            (pageHeight - 250) / 2,
            250,
            250,
        );
    } catch (e) {
        console.warn("Logo filigrane introuvable");
    }
    doc.setGState(new doc.GState({ opacity: 1.0 }));

    // 2. HEADER PRO (CORPORATE)
    // Logo à droite
    try {
        doc.addImage(logoPath, "PNG", pageWidth - margin - 30, 10, 25, 25);
    } catch (e) {}

    // Titres à gauche
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(23, 37, 84); // Bleu marine foncé
    doc.text("ÉGLISE MÉTHODISTE DU JUBILE DE COCODY", margin, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235); // Bleu primaire
    doc.text("Rapport des Membres", margin, 30);

    // Info sous-titre et date
    doc.setFontSize(10);
    doc.setTextColor(100);
    const today = new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    const dateWidth = doc.getTextWidth(`Imprimé le ${today}`);
    doc.text(`Imprimé le ${today}`, pageWidth - margin - dateWidth, 30);

    // Ligne de séparation bleue
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1.5);
    doc.line(margin, 38, pageWidth - margin, 38);

    // 3. TABLEAU STYLE "STRIPED" (LIGNES ZÉBRÉES)
    const startYTable = 48;

    const columns = [
        { header: "Nom & Prénom", dataKey: "nom" },
        { header: "Téléphone", dataKey: "tel" },
        { header: "Genre", dataKey: "genre" },
        { header: "Fonction", dataKey: "fonction" },
        { header: "Famille", dataKey: "famille" },
        { header: "Code Famille", dataKey: "code_famille" },
        { header: "Code Membre", dataKey: "code_membre" },
        { header: "Date Naiss.", dataKey: "naissance" },
        { header: "Statut", dataKey: "statut" },
    ];

    const data = membres.map((m) => ({
        nom: `${m.prenom || ""} ${m.nom || ""}`.toUpperCase(),
        tel: m.telephone || "-",
        genre: m.genre === "M" ? "H." : m.genre === "F" ? "F." : "-",
        fonction: m.fonction || "-",
        famille: m.famille || "-",
        code_famille: m.code_famille || "-",
        code_membre: m.code_membre || "-",
        naissance: m.date_naissance || "-",
        statut: m.is_active ? "Actif" : "Inactif",
    }));

    autoTable(doc, {
        columns: columns,
        body: data,
        startY: startYTable,
        styles: {
            fontSize: 9,
            cellPadding: 4,
            font: "helvetica",
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
        },
        headStyles: {
            fillColor: [23, 37, 84],
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
            lineWidth: 0.2,
            lineColor: [255, 255, 255],
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250],
        },
        columnStyles: {
            nom: { fontStyle: "bold", cellWidth: "auto" },
            statut: { cellWidth: 25, halign: "center" },
            genre: { cellWidth: 20, halign: "center" },
        },
        margin: { top: startYTable, left: margin, right: margin },
        theme: "striped",
        didDrawPage: function (data) {
            const footerY = pageHeight - 10;
            doc.setFontSize(9);
            doc.setTextColor(150);

            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

            doc.text(
                `Page ${doc.internal.getNumberOfPages()}`,
                margin,
                footerY,
            );

            const confText = "Document confidentiel - Église Méthodiste";
            const confWidth = doc.getTextWidth(confText);
            doc.text(confText, (pageWidth - confWidth) / 2, footerY);
        },
    });

    doc.save("rapport_membres_pro.pdf");
};

// ------------------------------------------------------------------
// Composant AlertModal
// ------------------------------------------------------------------
const AlertModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText = "Annuler",
    type = "warning",
}) => {
    if (!isOpen) return null;

    const typeConfig = {
        warning: {
            icon: (
                <svg
                    className="w-12 h-12 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                </svg>
            ),
            btnClass: "btn-warning",
        },
        danger: {
            icon: (
                <svg
                    className="w-12 h-12 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            btnClass: "btn-danger",
        },
        success: {
            icon: (
                <svg
                    className="w-12 h-12 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            btnClass: "btn-success",
        },
    };

    const config = typeConfig[type];

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        >
            <div
                className={`bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-t-4 ${type === "warning" ? "border-yellow-500" : type === "danger" ? "border-red-500" : "border-green-500"} transform transition-transform duration-300 ${isOpen ? "translate-y-0" : "translate-y-5"}`}
            >
                <div className="p-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 rounded-full bg-white shadow-sm">
                            {config.icon}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {title}
                            </h3>
                            <p className="text-gray-700">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary w-full sm:w-auto"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`btn w-full sm:w-auto ${config.btnClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// Composants Helpers
// ------------------------------------------------------------------
const StatusBadge = ({ isActive }) => (
    <span
        className={`px-2.5 py-1 rounded-md text-xs font-bold ${isActive ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-700 border border-gray-200"}`}
    >
        {isActive ? "Actif" : "Inactif"}
    </span>
);

const InfoItem = ({ label, value, icon, className = "" }) => {
    const hasValue =
        value && value !== "-" && value !== null && value !== undefined;

    return (
        <div className={className}>
            <div className="flex items-center gap-1.5 mb-1">
                {icon && <span className="text-gray-400">{icon}</span>}
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {label}
                </p>
            </div>
            <p
                className={`text-sm font-medium ${hasValue ? "text-gray-900" : "text-gray-400 italic"}`}
            >
                {value && value !== "-" ? value : "-"}
            </p>
        </div>
    );
};

const DetailCard = ({ children, title, icon }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
        {(title || icon) && (
            <div className="px-5 py-3 border-b border-blue-100 bg-blue-50 flex items-center gap-2">
                {icon && <span className="text-blue-500">{icon}</span>}
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {title}
                </h3>
            </div>
        )}
        <div className="p-5">{children}</div>
    </div>
);

// ------------------------------------------------------------------
// Modal Détails du Membre (Side Panel)
// ------------------------------------------------------------------
// Helper pour formater les dates - gère tous les formats
const formatDate = (dateString) => {
    if (
        !dateString ||
        dateString === "null" ||
        dateString === "" ||
        dateString === null ||
        dateString === undefined
    )
        return "-";

    try {
        // Créer un objet Date à partir de la string
        let date = new Date(dateString);

        // Si la date est invalide, essayer d'ajouter l'heure
        if (
            isNaN(date.getTime()) &&
            typeof dateString === "string" &&
            dateString.length === 10
        ) {
            date = new Date(dateString + "T00:00:00Z");
        }

        // Vérifier si la date est valide
        if (isNaN(date.getTime())) return "-";

        // Formater en jj/MM/YYYY
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (e) {
        return "-";
    }
};

// Helper pour afficher les valeurs avec fallback
const displayValue = (value) => {
    return value && value !== "null" && value !== "" ? value : "-";
};

const resolvePhotoUrl = (member) => {
    return resolveMemberPhotoUrl(member);
};

// Badge statut coloré
const StatusBadgeValue = ({ value, type = "boolean" }) => {
    const isTrue =
        type === "boolean"
            ? value === true || value === "oui"
            : value !== "-" && value !== "" && value !== null;
    return (
        <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                isTrue
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-gray-100 text-gray-600 border border-gray-300"
            }`}
        >
            {isTrue ? "Oui" : "Non"}
        </span>
    );
};

const MemberDetailsModal = ({ isOpen, onClose, member }) => {
    if (!isOpen || !member) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity opacity-100"
                onClick={onClose}
            ></div>
            <div className="relative w-full md:w-[650px] h-full bg-gradient-to-b from-gray-50 to-gray-100 shadow-2xl flex flex-col animate-slide-in-right">
                {/* HEADER PROFESSIONNEL */}
                <div className="shrink-0 h-16 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 border-b border-white/20 flex items-center justify-between px-6 z-20">
                    <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-white" />
                        <h2 className="text-lg font-bold text-white">
                            Détails du Profil
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-white/80 hover:text-white hover:bg-black/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* PROFIL HEADER AMÉLIORÉ */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-start gap-6">
                        <div className="relative shrink-0">
                            <ProfilePhoto
                                user={member}
                                size="3xl"
                                className="w-36 h-36 border-4 border-white shadow-lg ring-2 ring-blue-100"
                            />
                            <div
                                className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-3 border-white flex items-center justify-center ${
                                    member.is_active
                                        ? "bg-emerald-500"
                                        : "bg-gray-400"
                                }`}
                            >
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {member.prenom} {member.nom}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                    {member.role || "Membre"}
                                </span>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                        member.is_active
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-gray-100 text-gray-600 border-gray-200"
                                    }`}
                                >
                                    {member.is_active ? "● Actif" : "● Inactif"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CONTACT */}
                    <DetailCard
                        title="Contact"
                        icon={<Mail className="w-5 h-5" />}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InfoItem
                                label="Email"
                                value={displayValue(member.email)}
                                icon={
                                    <Mail className="w-4 h-4 text-blue-500" />
                                }
                            />
                            <InfoItem
                                label="Téléphone"
                                value={displayValue(member.telephone)}
                                icon={
                                    <Phone className="w-4 h-4 text-blue-500" />
                                }
                            />
                            <InfoItem
                                label="Code membre"
                                value={displayValue(member.code_membre)}
                                icon={
                                    <Award className="w-4 h-4 text-blue-500" />
                                }
                            />
                            <InfoItem
                                label="Téléphone 2"
                                value={displayValue(member.telephone2)}
                                icon={
                                    <Phone className="w-4 h-4 text-blue-500" />
                                }
                            />
                            <InfoItem
                                label="Adresse"
                                value={displayValue(member.adresse)}
                                icon={
                                    <MapPin className="w-4 h-4 text-blue-500" />
                                }
                                className="md:col-span-2"
                            />
                        </div>
                    </DetailCard>

                    {/* INFORMATIONS PERSONNELLES */}
                    <DetailCard
                        title="Informations Personnelles"
                        icon={<User className="w-5 h-5" />}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InfoItem
                                label="Profession"
                                value={displayValue(member.profession)}
                            />
                            <InfoItem
                                label="Genre"
                                value={
                                    member.genre === "M"
                                        ? "👨 Masculin"
                                        : member.genre === "F"
                                          ? "👩 Féminin"
                                          : "-"
                                }
                            />
                            <InfoItem
                                label="Date de naissance"
                                value={formatDate(member.date_naissance)}
                                icon={
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                }
                            />
                            <InfoItem
                                label="Ville"
                                value={displayValue(member.ville)}
                                icon={
                                    <MapPin className="w-4 h-4 text-blue-500" />
                                }
                            />
                            <InfoItem
                                label="Quartier"
                                value={displayValue(member.quartier)}
                            />
                        </div>
                    </DetailCard>

                    {/* SITUATION FAMILIALE */}
                    <DetailCard
                        title="Situation Familiale"
                        icon={<Users className="w-5 h-5" />}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InfoItem
                                label="Statut marital"
                                value={displayValue(member.statut_marital)}
                            />
                            <InfoItem
                                label="Relation"
                                value={displayValue(member.relation)}
                            />
                            <InfoItem
                                label="Nom de famille"
                                value={displayValue(member.famille_nom)}
                                className="md:col-span-2"
                            />
                        </div>
                    </DetailCard>

                    {/* PAROISSE & SACREMENTS */}
                    <DetailCard
                        title="Paroisse & Sacrements"
                        icon={<BookOpen className="w-5 h-5" />}
                    >
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <InfoItem
                                    label="Fonction"
                                    value={displayValue(member.fonction)}
                                />
                                <InfoItem
                                    label="Classe"
                                    value={displayValue(member.classe)}
                                />
                            </div>
                            <div className="border-t border-gray-200 pt-5">
                                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                                    Sacrements
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <span className="font-medium text-gray-700">
                                            Baptisé(e)
                                        </span>
                                        <StatusBadgeValue
                                            value={member.baptise}
                                        />
                                    </div>
                                    {(member.baptise === "oui" ||
                                        member.baptise === true) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3 border-l-2 border-blue-300">
                                            <InfoItem
                                                label="Date"
                                                value={formatDate(
                                                    member.date_bapteme,
                                                )}
                                                icon={
                                                    <Calendar className="w-4 h-4 text-blue-500" />
                                                }
                                            />
                                            <InfoItem
                                                label="Lieu"
                                                value={displayValue(
                                                    member.lieu_bapteme,
                                                )}
                                                icon={
                                                    <MapPin className="w-4 h-4 text-blue-500" />
                                                }
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <span className="font-medium text-gray-700">
                                            Première Communion
                                        </span>
                                        <StatusBadgeValue
                                            value={member.premiere_communion}
                                        />
                                    </div>
                                    {(member.premiere_communion === "oui" ||
                                        member.premiere_communion === true) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3 border-l-2 border-yellow-300">
                                            <InfoItem
                                                label="Date"
                                                value={formatDate(
                                                    member.date_premiere_communion,
                                                )}
                                                icon={
                                                    <Calendar className="w-4 h-4 text-yellow-600" />
                                                }
                                            />
                                            <InfoItem
                                                label="Lieu"
                                                value={displayValue(
                                                    member.lieu_premiere_communion,
                                                )}
                                                icon={
                                                    <MapPin className="w-4 h-4 text-yellow-600" />
                                                }
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-200">
                                        <span className="font-medium text-gray-700">
                                            Marié(e) religieusement
                                        </span>
                                        <StatusBadgeValue
                                            value={member.marie_religieusement}
                                        />
                                    </div>
                                    {(member.marie_religieusement === "oui" ||
                                        member.marie_religieusement ===
                                            true) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3 border-l-2 border-rose-300">
                                            <InfoItem
                                                label="Date"
                                                value={formatDate(
                                                    member.date_mariage_religieux,
                                                )}
                                                icon={
                                                    <Calendar className="w-4 h-4 text-rose-600" />
                                                }
                                            />
                                            <InfoItem
                                                label="Lieu"
                                                value={displayValue(
                                                    member.lieu_mariage_religieux,
                                                )}
                                                icon={
                                                    <MapPin className="w-4 h-4 text-rose-600" />
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DetailCard>

                    {/* INFORMATIONS ADMINISTRATIVES */}
                    <DetailCard
                        title="Informations Administratives"
                        icon={<Briefcase className="w-5 h-5" />}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InfoItem
                                label="Mariage civil"
                                value={formatDate(member.date_mariage)}
                                icon={
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                }
                            />
                            <InfoItem
                                label="Lieu"
                                value={displayValue(member.lieu_mariage)}
                            />
                            <div className="md:col-span-2 flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <span className="font-medium text-gray-700">
                                    Dote effectuée
                                </span>
                                <StatusBadgeValue
                                    value={member.statut_marital === "Dote"}
                                />
                            </div>
                            <InfoItem
                                label="Créé le"
                                value={member.created_at || "-"}
                                icon={
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                }
                            />
                            {member.updated_at ? (
                                <InfoItem
                                    label="Modifié le"
                                    value={member.updated_at}
                                    icon={
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                    }
                                />
                            ) : (
                                member.created_at && (
                                    <InfoItem
                                        label="Modifié le"
                                        value={member.created_at}
                                        icon={
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                        }
                                    />
                                )
                            )}
                        </div>
                    </DetailCard>
                </div>

                {/* FOOTER */}
                <div className="shrink-0 px-6 py-4 bg-white border-t border-gray-200 flex justify-end shadow-lg">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg shadow-md transition-all active:scale-95"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// --- Form Field Component ---
// Sous-composant pour les sections de Sacrements (Accordéon)
const SacrementSection = ({
    title,
    icon: Icon,
    color,
    checked,
    onChange,
    children,
}) => {
    const [isOpen, setIsOpen] = useState(checked);

    useEffect(() => {
        setIsOpen(checked);
    }, [checked]);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
            <div
                className="flex items-center justify-between p-3 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                            onChange(e.target.checked);
                            setIsOpen(e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-5 h-5 rounded border-gray-300 text-${color}-600 focus:ring-${color}-500 cursor-pointer`}
                    />
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                    <span className="font-semibold text-gray-700 select-none">
                        {title}
                    </span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </div>

            {isOpen && (
                <div className="p-4 bg-white border-t border-gray-100 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

// Modal d'édition d'un membre
// ------------------------------------------------------------------
const EditMemberModal = ({ isOpen, onClose, memberData, onUpdate }) => {
    const [fonctions, setFonctions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [data, setData] = useState({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        telephone2: "",
        genre: "M",
        date_naissance: "",
        statut_marital: "",
        date_mariage: "",
        lieu_mariage: "",
        profession: "",
        fonction_id: "",
        relation: "",
        photo: null,
        photoPreview: null,
        baptise: false,
        date_bapteme: "",
        lieu_bapteme: "",
        premiere_communion: false,
        date_premiere_communion: "",
        lieu_premiere_communion: "",
        marie_religieusement: false,
        date_mariage_religieux: "",
        lieu_mariage_religieux: "",
    });

    // Fetch fonctions
    useEffect(() => {
        const fetchData = async () => {
            try {
                const fonctionsRes = await axios.get(
                    withBasePath("", "/api/fonctions"),
                );
                setFonctions(fonctionsRes.data);
            } catch (error) {
                console.error("Erreur:", error);
            }
        };
        fetchData();
    }, []);

    // Init form data from memberData
    useEffect(() => {
        if (isOpen && memberData) {
            setData({
                nom: memberData?.nom || "",
                prenom: memberData?.prenom || "",
                email: memberData?.email || "",
                telephone: memberData?.telephone || "",
                telephone2: memberData?.telephone2 || "",
                genre: memberData?.genre || "M",
                date_naissance: memberData?.date_naissance || "",
                statut_marital: memberData?.statut_marital || "",
                date_mariage: memberData?.date_mariage || "",
                lieu_mariage: memberData?.lieu_mariage || "",
                profession: memberData?.profession || "",
                fonction_id: memberData?.fonction_id || "",
                relation: memberData?.relation || "",
                photo: null,
                photoPreview: resolvePhotoUrl(memberData) || null,
                baptise: memberData?.baptise || false,
                date_bapteme: memberData?.date_bapteme || "",
                lieu_bapteme: memberData?.lieu_bapteme || "",
                premiere_communion: memberData?.premiere_communion || false,
                date_premiere_communion:
                    memberData?.date_premiere_communion || "",
                lieu_premiere_communion:
                    memberData?.lieu_premiere_communion || "",
                marie_religieusement: memberData?.marie_religieusement || false,
                date_mariage_religieux:
                    memberData?.date_mariage_religieux || "",
                lieu_mariage_religieux:
                    memberData?.lieu_mariage_religieux || "",
            });
            setFieldErrors({});
        }
    }, [isOpen, memberData]);

    // Charger les données fraîches du serveur quand le formulaire ouvre
    useEffect(() => {
        if (isOpen && memberData?.id) {
            const loadMemberData = async () => {
                try {
                    const response = await axios.get(
                        `/admin/membres/${memberData.id}`,
                    );
                    const freshData = response.data;
                    setData({
                        nom: freshData?.nom || "",
                        prenom: freshData?.prenom || "",
                        email: freshData?.email || "",
                        telephone: freshData?.telephone || "",
                        telephone2: freshData?.telephone2 || "",
                        genre: freshData?.genre || "M",
                        date_naissance: freshData?.date_naissance || "",
                        statut_marital: freshData?.statut_marital || "",
                        date_mariage: freshData?.date_mariage || "",
                        lieu_mariage: freshData?.lieu_mariage || "",
                        profession: freshData?.profession || "",
                        fonction_id: freshData?.fonction_id || "",
                        relation: freshData?.relation || "",
                        photo: null,
                        photoPreview:
                            freshData?.profile_photo_url ||
                            (freshData?.photo_path
                                ? String(freshData.photo_path).startsWith(
                                      "http",
                                  ) ||
                                  String(freshData.photo_path).startsWith("/")
                                    ? freshData.photo_path
                                    : `/storage/${freshData.photo_path}`
                                : null),
                        baptise: freshData?.baptise || false,
                        date_bapteme: freshData?.date_bapteme || "",
                        lieu_bapteme: freshData?.lieu_bapteme || "",
                        premiere_communion:
                            freshData?.premiere_communion || false,
                        date_premiere_communion:
                            freshData?.date_premiere_communion || "",
                        lieu_premiere_communion:
                            freshData?.lieu_premiere_communion || "",
                        marie_religieusement:
                            freshData?.marie_religieusement || false,
                        date_mariage_religieux:
                            freshData?.date_mariage_religieux || "",
                        lieu_mariage_religieux:
                            freshData?.lieu_mariage_religieux || "",
                    });
                } catch (error) {
                    console.error(
                        "Erreur lors du chargement des données:",
                        error,
                    );
                    // Les données restent les mêmes initialisées par le premier useEffect
                }
            };
            loadMemberData();
        }
    }, [isOpen, memberData?.id]);

    const formatName = (text) => text.toUpperCase().replace(/\s+/g, " ").trim();
    const formatPrenom = (text) => sanitizeUppercasePrenom(text);

    const formatPhoneNumber = (text) => {
        const cleaned = text.replace(/\D/g, "");
        return cleaned.substring(0, 10);
    };

    const validateField = (fieldName, value) => {
        let error = "";
        switch (fieldName) {
            case "nom":
                if (!value) error = "Le nom est obligatoire";
                break;
            case "prenom":
                if (!value) error = "Le prénom est obligatoire";
                break;
            case "email":
                if (!value) error = "L'email est obligatoire";
                else if (!/^\S+@\S+\.\S+$/.test(value))
                    error = "Email invalide";
                break;
            case "genre":
                if (!value) error = "Le genre est obligatoire";
                break;
            case "date_naissance":
                if (!value) error = "La date de naissance est obligatoire";
                break;
            case "statut_marital":
                if (!value) error = "Le statut marital est obligatoire";
                break;
            case "profession":
                if (!value) error = "La profession est obligatoire";
                break;
            case "relation":
                if (!value) error = "La relation de famille est obligatoire";
                break;
            case "date_mariage":
                if (
                    (data.statut_marital === "Marié(e)" ||
                        data.statut_marital === "Dote" ||
                        data.statut_marital === "Divorcé(e)" ||
                        data.statut_marital === "Veuf(ve)") &&
                    !value
                )
                    error = "Date requise";
                break;
            case "lieu_mariage":
                if (
                    (data.statut_marital === "Marié(e)" ||
                        data.statut_marital === "Dote" ||
                        data.statut_marital === "Divorcé(e)" ||
                        data.statut_marital === "Veuf(ve)") &&
                    !value
                )
                    error = "Lieu requis";
                break;
            default:
                break;
        }
        return error;
    };

    const handleFieldChange = (fieldName, value) => {
        setData({ ...data, [fieldName]: value });
        const error = validateField(fieldName, value);
        setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: error,
        }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Le fichier est trop volumineux (max 5MB).");
                return;
            }
            const preview = URL.createObjectURL(file);
            if (
                data.photoPreview &&
                typeof data.photoPreview === "string" &&
                data.photoPreview.startsWith("blob:")
            ) {
                URL.revokeObjectURL(data.photoPreview);
            }
            setData({
                ...data,
                photo: file,
                photoPreview: preview,
            });
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        const newErrors = {};
        if (!data.nom) newErrors.nom = "Le nom est obligatoire";
        if (!data.prenom) newErrors.prenom = "Le prénom est obligatoire";
        if (!data.email) newErrors.email = "L'email est obligatoire";
        else if (!/^\S+@\S+\.\S+$/.test(data.email))
            newErrors.email = "Email invalide";
        if (!data.genre) newErrors.genre = "Le genre est obligatoire";
        if (!data.date_naissance)
            newErrors.date_naissance = "La date de naissance est obligatoire";
        if (!data.statut_marital)
            newErrors.statut_marital = "Le statut marital est obligatoire";
        if (!data.profession)
            newErrors.profession = "La profession est obligatoire";
        if (!data.relation)
            newErrors.relation = "La relation de famille est obligatoire";

        if (
            data.statut_marital === "Marié(e)" ||
            data.statut_marital === "Dote"
        ) {
            if (!data.date_mariage) newErrors.date_mariage = "Date requise";
            if (!data.lieu_mariage) newErrors.lieu_mariage = "Lieu requis";
        }
        if (data.statut_marital === "Divorcé(e)") {
            if (!data.date_mariage) newErrors.date_mariage = "Date requise";
            if (!data.lieu_mariage) newErrors.lieu_mariage = "Lieu requis";
        }
        if (data.statut_marital === "Veuf(ve)") {
            if (!data.date_mariage) newErrors.date_mariage = "Date requise";
            if (!data.lieu_mariage) newErrors.lieu_mariage = "Lieu requis";
        }

        if (Object.keys(newErrors).length > 0) {
            alert(`Erreurs:\n${Object.values(newErrors).join("\n")}`);
            return;
        }

        // AUTO-SYNC: Synchroniser automatiquement statut_marital avec les données de mariage
        // Vérifier à la fois dans data ET memberData pour date_mariage
        const dateMarriageFromForm =
            data.date_mariage && data.date_mariage.trim() !== "";
        const dateMarriageFromMember =
            memberData?.date_mariage && memberData.date_mariage.trim() !== "";
        const hasMarriageDate = dateMarriageFromForm || dateMarriageFromMember;

        // S'assurer que date_mariage et lieu_mariage sont préservés s'ils existent dans memberData
        if (dateMarriageFromMember && !dateMarriageFromForm) {
            data.date_mariage = memberData.date_mariage;
            data.lieu_mariage = memberData.lieu_mariage;
        }

        if (hasMarriageDate && data.statut_marital === "Célibataire") {
            // S'il y a une date de mariage civil, le statut doit être "Marié(e)"
            data.statut_marital = "Marié(e)";
        } else if (!hasMarriageDate && data.statut_marital === "Marié(e)") {
            // S'il n'y a pas de date de mariage civil mais le statut est "Marié(e)", on met "Célibataire"
            // (Mais c'est rare car normalement la validation l'empêcherait)
            data.statut_marital = "Célibataire";
        }

        setLoading(true);

        const formData = new FormData();

        // Champs à exclure (seulement photoPreview qui est une preview locale)
        const excludedFields = ["photoPreview"];

        Object.entries(data).forEach(([k, v]) => {
            if (excludedFields.includes(k)) {
                return; // Skip photoPreview
            }

            // Handle photo separately - only if it's a new File
            if (k === "photo") {
                if (v && v instanceof File) {
                    formData.append("photo", v);
                }
                return;
            }

            // Skip empty values except for nullable fields
            if (v === null || v === undefined || v === "") {
                return;
            }

            let valueToSend = v;
            if (k === "telephone" && valueToSend) {
                valueToSend = valueToSend.toString().replace(/^225/, "");
            }
            if (typeof v === "boolean") {
                valueToSend = v ? "1" : "0";
            }

            formData.append(k, valueToSend);
        });

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");
        if (csrfToken) {
            formData.append("_token", csrfToken);
        }

        // Log les données envoyées pour déboguer
        console.log("Données envoyées au serveur:");
        for (let [key, value] of formData.entries()) {
            console.log(
                `${key}:`,
                value instanceof File ? `File: ${value.name}` : value,
            );
        }

        try {
            const res = await axios.post(
                `/admin/membres/${memberData.id}?_method=PUT`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                },
            );

            alert("✅ Membre mis à jour avec succès !");
            onClose();
            // Eviter un second update cote parent (appel sans payload) qui declenche une fausse erreur apres succes.
            router.reload({ only: ["membres", "dataByType"] });
        } catch (err) {
            console.error("Erreur complète:", err);
            console.error("Response status:", err?.response?.status);
            console.error("Response data:", err?.response?.data);

            const apiErrors = err?.response?.data?.errors;
            if (apiErrors) {
                const errorMessages = Object.entries(apiErrors)
                    .map(
                        ([field, messages]) =>
                            `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`,
                    )
                    .join("\n");
                alert(`Erreurs:\n${errorMessages}`);
            } else {
                const message =
                    err?.response?.data?.message ||
                    "Une erreur est survenue lors de la mise à jour.";
                alert(`Erreur: ${message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up overflow-y-auto">
            <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-white/50 my-8">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <User className="w-5 h-5" />
                        </span>
                        Modifier le Membre
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div
                    className="overflow-y-auto p-6 bg-white"
                    style={{ maxHeight: "calc(90vh - 140px)" }}
                >
                    <form
                        onSubmit={handleSubmit}
                        encType="multipart/form-data"
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* GAUCHE : Identité & Contact */}
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                        <User className="w-5 h-5 text-blue-600" />
                                        Identité
                                    </h3>

                                    {/* Photo Upload */}
                                    <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 mb-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <h3 className="text-xs font-bold text-gray-800">
                                                Photo
                                            </h3>
                                            <div className="w-14 h-14 rounded-full bg-white overflow-hidden border-2 border-blue-400 shadow-md">
                                                {data.photoPreview ? (
                                                    <img
                                                        src={
                                                            typeof data.photoPreview ===
                                                            "string"
                                                                ? data.photoPreview
                                                                : URL.createObjectURL(
                                                                      data.photoPreview,
                                                                  )
                                                        }
                                                        alt="profil"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                        <User className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="file:py-0.5 file:px-2 file:rounded file:bg-blue-600 file:text-white file:cursor-pointer file:font-semibold file:border-0 file:hover:bg-blue-700 file:transition-colors file:text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            label="Nom"
                                            icon={User}
                                            required
                                        >
                                            <input
                                                className={`w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 uppercase ${
                                                    fieldErrors.nom
                                                        ? "border-red-500 focus:border-red-500"
                                                        : "border-gray-300 focus:border-blue-500"
                                                }`}
                                                value={data.nom}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "nom",
                                                        formatPrenom(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                placeholder="ex: DUPONT"
                                            />
                                            {fieldErrors.nom && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {fieldErrors.nom}
                                                </p>
                                            )}
                                        </FormField>
                                        <FormField
                                            label="Prénom"
                                            icon={User}
                                            required
                                        >
                                            <input
                                                className={`w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 capitalize ${
                                                    fieldErrors.prenom
                                                        ? "border-red-500 focus:border-red-500"
                                                        : "border-gray-300 focus:border-blue-500"
                                                }`}
                                                value={data.prenom}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "prenom",
                                                        formatName(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                placeholder="ex: Jean"
                                            />
                                            {fieldErrors.prenom && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {fieldErrors.prenom}
                                                </p>
                                            )}
                                        </FormField>
                                        <FormField
                                            label="Genre"
                                            icon={Users}
                                            required
                                        >
                                            <Select2Single
                                                name="genre"
                                                value={data.genre}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "genre",
                                                        e.target.value,
                                                    )
                                                }
                                                options={GENDER_OPTIONS}
                                                placeholder="Sélectionner..."
                                                hasError={Boolean(fieldErrors.genre)}
                                            />
                                            {fieldErrors.genre && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {fieldErrors.genre}
                                                </p>
                                            )}
                                        </FormField>
                                        <FormField
                                            label="Date de naissance"
                                            icon={Calendar}
                                            required
                                        >
                                            <input
                                                type="date"
                                                className={`w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 ${
                                                    fieldErrors.date_naissance
                                                        ? "border-red-500 focus:border-red-500"
                                                        : "border-gray-300 focus:border-blue-500"
                                                }`}
                                                value={data.date_naissance}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "date_naissance",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {fieldErrors.date_naissance && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {fieldErrors.date_naissance}
                                                </p>
                                            )}
                                        </FormField>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                        <Mail className="w-5 h-5 text-green-600" />
                                        Contact & Coordonnées
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField label="Email" icon={Mail}>
                                            <input
                                                type="email"
                                                className={`w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 ${
                                                    fieldErrors.email
                                                        ? "border-red-500 focus:border-red-500"
                                                        : "border-gray-300 focus:border-blue-500"
                                                }`}
                                                value={data.email}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "email",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="ex: jean.dupont@gmail.com"
                                            />
                                            {fieldErrors.email && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {fieldErrors.email}
                                                </p>
                                            )}
                                        </FormField>
                                        <FormField
                                            label="Téléphone"
                                            icon={Phone}
                                        >
                                            <div className="flex">
                                                <span className="bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg px-3 flex items-center text-gray-600">
                                                    +225
                                                </span>
                                                <input
                                                    type="tel"
                                                    className="flex-1 h-12 border border-gray-300 rounded-r-lg px-4 outline-none focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                    value={data.telephone}
                                                    onChange={(e) =>
                                                        handleFieldChange(
                                                            "telephone",
                                                            formatPhoneNumber(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    placeholder="ex: 0102030405"
                                                    maxLength="10"
                                                />
                                            </div>
                                        </FormField>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                        <Award className="w-5 h-5 text-purple-600" />
                                        Statut Professionnel
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            label="Profession"
                                            icon={Briefcase}
                                            required
                                        >
                                            <input
                                                className={`w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 ${
                                                    fieldErrors.profession
                                                        ? "border-red-500 focus:border-red-500"
                                                        : "border-gray-300 focus:border-blue-500"
                                                }`}
                                                value={data.profession}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "profession",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="ex: Enseignant, Commerçant"
                                            />
                                            {fieldErrors.profession && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {fieldErrors.profession}
                                                </p>
                                            )}
                                        </FormField>
                                        <FormField
                                            label="Fonction dans l'église"
                                            icon={Users}
                                        >
                                            <Select2Fonction
                                                value={
                                                    data.fonction_id
                                                        ? [data.fonction_id]
                                                        : []
                                                }
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value &&
                                                        e.target.value.length >
                                                            0
                                                            ? e.target.value[0]
                                                            : "";
                                                    handleFieldChange(
                                                        "fonction_id",
                                                        value,
                                                    );
                                                }}
                                                options={fonctions}
                                                placeholder="Sélectionner une fonction..."
                                            />
                                            {fieldErrors.fonction_id && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {fieldErrors.fonction_id}
                                                </p>
                                            )}
                                        </FormField>
                                        <FormField
                                            label="Relation de Famille"
                                            icon={Users}
                                            required
                                        >
                                            <Select2Single
                                                name="relation"
                                                value={data.relation}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "relation",
                                                        e.target.value,
                                                    )
                                                }
                                                options={RELATION_OPTIONS}
                                                placeholder="Sélectionner une relation..."
                                            />
                                            {fieldErrors.relation && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {fieldErrors.relation}
                                                </p>
                                            )}
                                        </FormField>
                                    </div>
                                </section>
                            </div>

                            {/* DROITE : Situation & Sacrements */}
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                        <Heart className="w-5 h-5 text-pink-600" />
                                        Situation Matrimoniale
                                    </h3>
                                    <div className="space-y-4">
                                        <FormField
                                            label="Statut Marital"
                                            icon={Heart}
                                            required
                                        >
                                            <Select2Single
                                                name="statut_marital"
                                                value={data.statut_marital}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "statut_marital",
                                                        e.target.value,
                                                    )
                                                }
                                                options={MEMBER_MARITAL_STATUS_OPTIONS}
                                                placeholder="Sélectionner..."
                                                hasError={Boolean(fieldErrors.statut_marital)}
                                            />
                                        </FormField>

                                        {data.statut_marital &&
                                            data.statut_marital !==
                                                "Célibataire" && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                                                    <FormField
                                                        label={
                                                            data.statut_marital ===
                                                            "Dote"
                                                                ? "Date Dot"
                                                                : "Date Mariage"
                                                        }
                                                        icon={Calendar}
                                                        required
                                                    >
                                                        <input
                                                            type="date"
                                                            className="w-full h-10 border border-gray-300 rounded px-2 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                            value={
                                                                data.date_mariage
                                                            }
                                                            onChange={(e) =>
                                                                handleFieldChange(
                                                                    "date_mariage",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </FormField>
                                                    <FormField
                                                        label={
                                                            data.statut_marital ===
                                                            "Dote"
                                                                ? "Lieu Dot"
                                                                : "Lieu Mariage"
                                                        }
                                                        icon={MapPin}
                                                        required
                                                    >
                                                        <input
                                                            className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                            value={
                                                                data.lieu_mariage
                                                            }
                                                            onChange={(e) =>
                                                                handleFieldChange(
                                                                    "lieu_mariage",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="ex: Paris, Yaoundé"
                                                        />
                                                    </FormField>
                                                </div>
                                            )}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                        <BookOpen className="w-5 h-5 text-indigo-600" />
                                        Sacrements & Vie Chrétienne
                                    </h3>
                                    <div className="space-y-3">
                                        <SacrementSection
                                            title="Baptême"
                                            icon={BookOpen}
                                            color="purple"
                                            checked={data.baptise}
                                            onChange={(val) =>
                                                handleFieldChange(
                                                    "baptise",
                                                    val,
                                                )
                                            }
                                        >
                                            {data.baptise && (
                                                <>
                                                    <FormField label="Date du baptême">
                                                        <input
                                                            type="date"
                                                            className="w-full h-10 border border-gray-300 rounded px-2 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                            value={
                                                                data.date_bapteme
                                                            }
                                                            onChange={(e) =>
                                                                handleFieldChange(
                                                                    "date_bapteme",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </FormField>
                                                    <FormField label="Lieu du baptême">
                                                        <input
                                                            className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                            value={
                                                                data.lieu_bapteme
                                                            }
                                                            onChange={(e) =>
                                                                handleFieldChange(
                                                                    "lieu_bapteme",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="ex: Église Saint-Paul"
                                                        />
                                                    </FormField>
                                                </>
                                            )}
                                        </SacrementSection>

                                        <SacrementSection
                                            title="Première Communion"
                                            icon={Gift}
                                            color="yellow"
                                            checked={data.premiere_communion}
                                            onChange={(val) =>
                                                handleFieldChange(
                                                    "premiere_communion",
                                                    val,
                                                )
                                            }
                                        >
                                            {data.premiere_communion && (
                                                <>
                                                    <FormField label="Date de première communion">
                                                        <input
                                                            type="date"
                                                            className="w-full h-10 border border-gray-300 rounded px-2 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                            value={
                                                                data.date_premiere_communion
                                                            }
                                                            onChange={(e) =>
                                                                handleFieldChange(
                                                                    "date_premiere_communion",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </FormField>
                                                    <FormField label="Lieu de première communion">
                                                        <input
                                                            className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                            value={
                                                                data.lieu_premiere_communion
                                                            }
                                                            onChange={(e) =>
                                                                handleFieldChange(
                                                                    "lieu_premiere_communion",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="ex: Église Saint-Paul"
                                                        />
                                                    </FormField>
                                                </>
                                            )}
                                        </SacrementSection>

                                        <SacrementSection
                                            title="Mariage Religieux"
                                            icon={Heart}
                                            color="rose"
                                            checked={data.marie_religieusement}
                                            onChange={(val) =>
                                                handleFieldChange(
                                                    "marie_religieusement",
                                                    val,
                                                )
                                            }
                                        >
                                            {data.marie_religieusement && (
                                                <>
                                                    <FormField label="Date du mariage religieux">
                                                        <input
                                                            type="date"
                                                            className="w-full h-10 border border-gray-300 rounded px-2 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                            value={
                                                                data.date_mariage_religieux
                                                            }
                                                            onChange={(e) =>
                                                                handleFieldChange(
                                                                    "date_mariage_religieux",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </FormField>
                                                    <FormField label="Lieu du mariage religieux">
                                                        <input
                                                            className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                            value={
                                                                data.lieu_mariage_religieux
                                                            }
                                                            onChange={(e) =>
                                                                handleFieldChange(
                                                                    "lieu_mariage_religieux",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="ex: Église Saint-Paul"
                                                        />
                                                    </FormField>
                                                </>
                                            )}
                                        </SacrementSection>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 bg-gray-50/80 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 justify-center"
                    >
                        <X className="w-4 h-4" /> Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
                    >
                        {loading ? (
                            <>Enregistrement...</>
                        ) : (
                            <>
                                <Check className="w-4 h-4" /> Mettre à jour
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style jsx="true" global="true">{`
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

// ------------------------------------------------------------------
// Composant Pagination
// ------------------------------------------------------------------
const Pagination = ({ currentPage, totalPages, paginate }) => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="pagination">
            <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-btn"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>

            {pageNumbers.map((number) => (
                <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`page-btn ${currentPage === number ? "active" : ""}`}
                >
                    {number}
                </button>
            ))}

            <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-btn"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </button>
        </div>
    );
};

// ------------------------------------------------------------------
// Composant Principal : TabUtilisateurs
// ------------------------------------------------------------------
const TabUtilisateurs = ({
    rawData = {},
    membres = [],
    availableClasses = [],
    availableFonctions = [],
    onEditMember,
    onDeleteMember,
    onToggleMember,
    onAddMember,
}) => {
    const [search, setSearch] = useState("");
    const [barcodeFilter, setBarcodeFilter] = useState("");
    const [statutFilter, setStatutFilter] = useState("all");
    const [classeFilter, setClasseFilter] = useState("");
    const [fonctionFilter, setFonctionFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [genreFilter, setGenreFilter] = useState("");
    const [editingMember, setEditingMember] = useState(null);
    const [viewingMember, setViewingMember] = useState(null);
    const [showToggleAlert, setShowToggleAlert] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [classesList, setClassesList] = useState(availableClasses);
    const [fonctionsList, setFonctionsList] = useState(availableFonctions);

    const classeFilterOptions = [
        { value: "", label: "Toutes classes" },
        ...classesList
            .filter((classe) => classe.value !== null && classe.value !== "")
            .map((classe) => ({
                value: classe.value,
                label: classe.label || classe.nom,
            })),
    ];

    const genreFilterOptions = [
        { value: "", label: "Tous genres" },
        ...GENDER_OPTIONS,
    ];

    const fonctionFilterOptions = [
        { value: "", label: "Toutes fonctions" },
        ...fonctionsList.map((fonction) => ({
            value: fonction.id,
            label: fonction.label,
        })),
    ];

    // --- Pagination : 10 éléments par page ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- Charger les classes et fonctions au montage ou quand les props changent ---
    useEffect(() => {
        if (availableClasses && availableClasses.length > 0) {
            setClassesList(availableClasses);
            console.log("ClassesList chargées:", availableClasses);
        }
        if (availableFonctions && availableFonctions.length > 0) {
            setFonctionsList(availableFonctions);
        }
    }, [availableClasses, availableFonctions]);

    // Afficher une ligne exemple des données membres
    useEffect(() => {
        if (membres && membres.length > 0) {
            console.log("Structure d'un membre exemple:", {
                id: membres[0].id,
                classe_id: membres[0].classe_id,
                classe: membres[0].classe,
                fonction_id: membres[0].fonction_id,
                fonction_nom: membres[0].fonction,
            });
        }
    }, [membres]);

    // ✅ Recharger les données si elles sont vides
    useEffect(() => {
        if (!membres || membres.length === 0) {
            console.log("Membres vides - rechargement des données...");
            router.reload({ only: ["membres", "dataByType"] });
        }
    }, [membres.length]);

    // --- Exclure les admins de tous les calculs statistiques ---
    const membresNonAdmin = membres.filter(
        (m) =>
            m.role !== "admin" &&
            m.role !== "administrator" &&
            m.role !== "super_admin",
    );

    // --- Statistiques des membres (sans les admins) ---
    const totalMembres = membresNonAdmin.length;
    const actifs = membresNonAdmin.filter(
        (m) => m.is_active === true || m.is_active === 1,
    ).length;
    const inactifs = membresNonAdmin.filter(
        (m) => !(m.is_active === true || m.is_active === 1),
    ).length;

    const hommes = membresNonAdmin.filter((m) => m.genre === "M").length;
    const femmes = membresNonAdmin.filter((m) => m.genre === "F").length;
    let ratioHF = "-";
    if (totalMembres > 0) {
        const pourcentageHommes = ((hommes / totalMembres) * 100).toFixed(0);
        const pourcentageFemmes = ((femmes / totalMembres) * 100).toFixed(0);
        ratioHF = `${pourcentageHommes}% H / ${pourcentageFemmes}% F`;
    }

    const memberStats = {
        total: totalMembres,
        actifs: actifs,
        inactifs: inactifs,
        ratio: ratioHF,
    };

    // --- Filtrage des membres (basé sur membresNonAdmin) ---
    const filteredMembres = membresNonAdmin.filter((membre) => {
        const s = search.toLowerCase();
        const matchSearch =
            membre.nom?.toLowerCase().includes(s) ||
            membre.prenom?.toLowerCase().includes(s) ||
            membre.email?.toLowerCase().includes(s) ||
            membre.identifiant?.toLowerCase().includes(s) ||
            membre.telephone?.includes(s) ||
            membre.code_famille?.toLowerCase().includes(s) ||
            membre.code_membre?.toLowerCase().includes(s);

        const normalizedBarcode = String(barcodeFilter || "")
            .trim()
            .toLowerCase();
        const memberCode = String(membre.code_famille || "").toLowerCase();
        const matchBarcode =
            !normalizedBarcode || memberCode.includes(normalizedBarcode);

        let matchStatut = true;
        if (statutFilter !== "all") {
            const isActif = membre.is_active === true || membre.is_active === 1;
            matchStatut =
                (statutFilter === "actif" && isActif) ||
                (statutFilter === "inactif" && !isActif);
        }

        let matchClasse = true;
        if (classeFilter) {
            // Utiliser value qui existe dans les données (value: 1)
            matchClasse = String(membre.classe_id) === String(classeFilter);
        }

        let matchFonction = true;
        if (fonctionFilter) {
            // Comparer avec l'ID de la fonction (convertir les deux en nombres pour comparaison fiable)
            matchFonction =
                parseInt(membre.fonction_id) === parseInt(fonctionFilter) ||
                membre.fonction === fonctionFilter;
        }

        let matchRole = true;
        if (roleFilter) {
            matchRole = membre.role === roleFilter;
        }

        let matchGenre = true;
        if (genreFilter) {
            matchGenre = membre.genre === genreFilter;
        }

        return (
            matchSearch &&
            matchBarcode &&
            matchStatut &&
            matchClasse &&
            matchFonction &&
            matchRole &&
            matchGenre
        );
    });

    // --- Pagination : découpage des résultats filtrés ---
    const totalPages = Math.ceil(filteredMembres.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredMembres.slice(
        indexOfFirstItem,
        indexOfLastItem,
    );

    // Réinitialiser la page courante à 1 quand les filtres changent
    useEffect(() => {
        setCurrentPage(1);
    }, [
        search,
        barcodeFilter,
        statutFilter,
        classeFilter,
        fonctionFilter,
        roleFilter,
        genreFilter,
    ]);

    // --- Gestion des alertes ---
    const openToggleAlert = (member) => {
        setSelectedMember(member);
        setShowToggleAlert(true);
    };

    const openDeleteAlert = (member) => {
        setSelectedMember(member);
        setShowDeleteAlert(true);
    };

    const handleToggleConfirm = () => {
        if (!selectedMember) return;
        onToggleMember(selectedMember);
        setShowToggleAlert(false);
        setSelectedMember(null);
    };

    const handleDeleteConfirm = () => {
        if (!selectedMember) return;
        onDeleteMember(selectedMember);
        setShowDeleteAlert(false);
        setSelectedMember(null);
    };

    const resetFilters = () => {
        setSearch("");
        setBarcodeFilter("");
        setStatutFilter("all");
        setClasseFilter("");
        setFonctionFilter("");
        setRoleFilter("");
        setGenreFilter("");
    };

    // Fonction pour formater les rôles avec emojis
    const formatRole = (role) => {
        const roleMap = {
            membre: { emoji: "👤", label: "Membre" },
            membre_famille: { emoji: "👨‍👩‍👧", label: "Membre de famille" },
            membre_de_famille: { emoji: "👨‍👩‍👧", label: "Membre de famille" },
            responsable_famille: {
                emoji: "👨‍👩‍👧",
                label: "Responsable de famille",
            },
            conducteur: { emoji: "👤", label: "Conducteur" },
            pasteur: { emoji: "✝️", label: "Pasteur" },
        };
        const mapped = roleMap[role] || { emoji: "❓", label: role || "-" };
        return `${mapped.emoji} ${mapped.label}`;
    };

    return (
        <>
            <style>{`
                :root {
                    --primary: #2563eb;
                    --primary-hover: #1d4ed8;
                    --success: #16a34a;
                    --danger: #dc2626;
                    --warning: #ca8a04;
                    --glass-bg: rgba(255, 255, 255, 0.7);
                    --glass-border: rgba(255, 255, 255, 0.5);
                }
                .glass-panel {
                    background: var(--glass-bg);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid var(--glass-border);
                }
                .btn {
                    display: inline-flex; align-items: center; justify-content: center;
                    padding: 0.5rem 1rem; border-radius: 0.75rem; font-weight: 600; font-size: 0.875rem;
                    cursor: pointer; transition: all 0.2s; border: 1px solid transparent; gap: 0.5rem;
                }
                .btn-primary { background-color: var(--primary); color: white; }
                .btn-primary:hover { background-color: var(--primary-hover); }
                .btn-success { background-color: var(--success); color: white; }
                .btn-danger { background-color: var(--danger); color: white; }
                .btn-secondary { background-color: white; border-color: #d1d5db; color: #111827; }
                .btn-warning { background-color: var(--warning); color: white; }
                .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }

                /* Select2 Custom Styles */
                .select2__control {
                    border-radius: 0.75rem !important;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .select2__control:hover {
                    border-color: #2563eb !important;
                    background-color: white !important;
                }
                .select2__control--is-focused {
                    border-color: #2563eb !important;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
                }
                .select2__menu {
                    border-radius: 0.75rem !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                    border: 1px solid #e5e7eb !important;
                    margin-top: 4px !important;
                }
                .select2__option--is-focused {
                    background-color: #dbeafe !important;
                    color: #111827 !important;
                }
                .select2__option--is-selected {
                    background-color: #2563eb !important;
                    color: white !important;
                    font-weight: 600 !important;
                }
                .select2__option--is-selected:hover {
                    background-color: #1d4ed8 !important;
                }
                .select2__input {
                    color: #111827 !important;
                    font-size: 0.875rem !important;
                }
                .select2__placeholder {
                    color: #9ca3af !important;
                    font-size: 0.875rem !important;
                }
                .select2__single-value {
                    color: #111827 !important;
                    font-weight: 500 !important;
                }

                /* Pagination styles */
                .pagination { display: flex; gap: 0.25rem; justify-content: center; align-items: center; padding-top: 1rem; padding-bottom: 0.5rem; }
                .page-btn { width: 2.25rem; height: 2.25rem; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem; border: 1px solid #e5e7eb; background: white; cursor: pointer; transition: all 0.2s; color: #374151; font-weight: 600; font-size: 0.875rem; user-select: none; }
                .page-btn:hover:not(:disabled):not(.active) { background-color: #f3f4f6; border-color: #d1d5db; }
                .page-btn.active { background-color: #2563eb; color: white; border-color: #2563eb; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
                .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>

            <div className="flex flex-col h-full animate-fade-in-up">
                {/* --- STATISTIQUES DES MEMBRES (4 cartes) --- */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 w-full mb-6">
                    {/* Total membres */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center text-center border border-gray-100">
                        <div className="text-purple-500 mb-2">
                            <svg
                                className="w-12 h-12"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                            </svg>
                        </div>
                        <span className="text-3xl font-extrabold mb-1">
                            {memberStats.total}
                        </span>
                        <span className="text-sm font-semibold text-gray-500">
                            Total Membres
                        </span>
                    </div>
                    {/* Membres actifs */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center text-center border border-gray-100">
                        <div className="mb-2 rounded-2xl bg-emerald-50 p-3 text-emerald-600 ring-1 ring-emerald-100">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <span className="text-3xl font-extrabold mb-1">
                            {memberStats.actifs}
                        </span>
                        <span className="text-sm font-semibold text-gray-500">
                            Membres actifs
                        </span>
                    </div>
                    {/* Membres inactifs */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center text-center border border-gray-100">
                        <div className="mb-2 rounded-2xl bg-slate-100 p-3 text-slate-600 ring-1 ring-slate-200">
                            <ShieldX className="h-8 w-8" />
                        </div>
                        <span className="text-3xl font-extrabold mb-1">
                            {memberStats.inactifs}
                        </span>
                        <span className="text-sm font-semibold text-gray-500">
                            Membres inactifs
                        </span>
                    </div>
                    {/* Ratio H/F */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center text-center border border-gray-100">
                        <div className="mb-2 rounded-2xl bg-indigo-50 p-3 text-indigo-600 ring-1 ring-indigo-100">
                            <UsersRound className="h-8 w-8" />
                        </div>
                        <span className="text-2xl font-extrabold mb-1 px-2 text-center break-words">
                            {memberStats.ratio}
                        </span>
                        <span className="text-sm font-semibold text-gray-500">
                            Ratio H/F
                        </span>
                    </div>
                </div>

                {/* --- FILTRES AVANCÉS --- */}
                <div className="glass-panel w-full rounded-2xl p-6 shadow-lg mb-6 border-l-4 border-blue-500">
                    {/* Titre des filtres */}
                    <div className="mb-5">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                            <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                            Filtres avancés
                        </h3>
                    </div>

                    {/* Grille de filtres - 2x3 ou responsive */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                        {/* Colonne 1: Recherche textuelle */}
                        <div>
                            <label className="text-xs font-bold text-gray-600 mb-2 block">
                                <span className="inline-flex items-center gap-2">
                                    <Search className="h-3.5 w-3.5 text-slate-500" />
                                    Recherche
                                </span>
                            </label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-3.5 w-4 h-4 pointer-events-none text-gray-400" />
                                <input
                                    placeholder="Nom, email, tél, ID..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 outline-none text-gray-800 text-sm transition group-hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Colonne 2: Statut */}
                        <div>
                            <label className="text-xs font-bold text-gray-600 mb-2 block">
                                <span className="inline-flex items-center gap-2">
                                    <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                                    Statut
                                </span>
                            </label>
                            <Select2Single
                                name="statut_filter"
                                value={statutFilter}
                                onChange={(e) => setStatutFilter(e.target.value)}
                                options={STATUS_FILTER_OPTIONS}
                                placeholder="Tous statuts"
                                allowClearOption={false}
                            />
                        </div>

                        {/* Colonne 3: Genre */}
                        <div>
                            <label className="text-xs font-bold text-gray-600 mb-2 block">
                                <span className="inline-flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-slate-500" />
                                    Genre
                                </span>
                            </label>
                            <Select2Single
                                name="genre_filter"
                                value={genreFilter}
                                onChange={(e) => setGenreFilter(e.target.value)}
                                options={genreFilterOptions}
                                placeholder="Tous genres"
                                allowClearOption={false}
                            />
                        </div>

                        {/* Colonne 4: Classe */}
                        <div>
                            <label className="text-xs font-bold text-gray-600 mb-2 block">
                                <span className="inline-flex items-center gap-2">
                                    <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
                                    Classe
                                </span>
                            </label>
                            <Select2Single
                                name="classe_filter"
                                value={classeFilter}
                                onChange={(e) => setClasseFilter(e.target.value)}
                                options={classeFilterOptions}
                                placeholder="Toutes classes"
                                noOptionsMessage="Aucune classe trouvee"
                                allowClearOption={false}
                            />
                        </div>

                        {/* Colonne 5: Fonction */}
                        <div>
                            <label className="text-xs font-bold text-gray-600 mb-2 block">
                                <span className="inline-flex items-center gap-2">
                                    <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                                    Fonction
                                </span>
                            </label>
                            <Select2Single
                                name="fonction_filter"
                                value={fonctionFilter}
                                onChange={(e) =>
                                    setFonctionFilter(e.target.value)
                                }
                                options={fonctionFilterOptions}
                                placeholder="Toutes fonctions"
                                noOptionsMessage="Aucune fonction trouvee"
                                allowClearOption={false}
                            />
                        </div>

                        {/* Colonne 6: Rôle */}
                        <div>
                            <label className="text-xs font-bold text-gray-600 mb-2 block">
                                <span className="inline-flex items-center gap-2">
                                    <UserCog className="h-3.5 w-3.5 text-slate-500" />
                                    Rôle
                                </span>
                            </label>
                            <Select2Single
                                name="role_filter"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                options={ROLE_FILTER_OPTIONS}
                                placeholder="Tous roles"
                                allowClearOption={false}
                            />
                        </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Réinitialiser filtres
                        </button>
                        <button
                            onClick={() => {
                                const filters = {};
                                if (statutFilter !== "all")
                                    filters.Statut = statutFilter;
                                if (classeFilter) filters.Classe = classeFilter;
                                if (fonctionFilter)
                                    filters.Fonction = fonctionFilter;
                                if (roleFilter) filters.Role = roleFilter;
                                if (genreFilter) filters.Genre = genreFilter;
                                if (search) filters.Recherche = search;
                                exportToPDF(filteredMembres, filters);
                            }}
                            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm shadow-md"
                        >
                            <FileDown className="w-4 h-4" />
                            Exporter PDF
                        </button>
                        <button
                            onClick={() =>
                                router.visit(
                                    "/admin/inscriptions/type-selection",
                                )
                            }
                            className="ml-auto px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm shadow-md"
                        >
                            <UserPlus className="w-4 h-4" />
                            Nouveau membre
                        </button>
                    </div>

                    {/* Afficher les filtres actifs */}
                    {(statutFilter !== "all" ||
                        barcodeFilter !== "" ||
                        classeFilter !== "" ||
                        fonctionFilter !== "" ||
                        roleFilter !== "" ||
                        genreFilter !== "") && (
                        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                            {statutFilter !== "all" && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 font-semibold">
                                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                                    {statutFilter === "actif"
                                        ? "Actifs"
                                        : "Inactifs"}
                                    <button
                                        onClick={() => setStatutFilter("all")}
                                        className="ml-2 text-green-600 hover:text-green-800 font-bold"
                                    >
                                        &times;
                                    </button>
                                </span>
                            )}
                            {genreFilter !== "" && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-pink-100 text-pink-800 font-semibold">
                                    <User className="mr-1 h-3.5 w-3.5" />
                                    {genreFilter === "M"
                                        ? "Masculin"
                                        : "Féminin"}
                                    <button
                                        onClick={() => setGenreFilter("")}
                                        className="ml-2 text-pink-600 hover:text-pink-800 font-bold"
                                    >
                                        &times;
                                    </button>
                                </span>
                            )}
                            {barcodeFilter !== "" && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 font-semibold">
                                    <ScanLine className="mr-1 h-3.5 w-3.5" />
                                    Code famille: {barcodeFilter}
                                    <button
                                        onClick={() => setBarcodeFilter("")}
                                        className="ml-2 text-indigo-600 hover:text-indigo-800 font-bold"
                                    >
                                        &times;
                                    </button>
                                </span>
                            )}
                            {classeFilter !== "" && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100  text-purple-800 font-semibold">
                                    <GraduationCap className="mr-1 h-3.5 w-3.5" />
                                    {classesList.find(
                                        (c) => c.id == classeFilter,
                                    )?.label || classeFilter}
                                    <button
                                        onClick={() => setClasseFilter("")}
                                        className="ml-2 text-purple-600 hover:text-purple-800 font-bold"
                                    >
                                        &times;
                                    </button>
                                </span>
                            )}
                            {fonctionFilter !== "" && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-semibold">
                                    <Briefcase className="mr-1 h-3.5 w-3.5" />
                                    {fonctionsList.find(
                                        (f) => f.id == fonctionFilter,
                                    )?.label || fonctionFilter}
                                    <button
                                        onClick={() => setFonctionFilter("")}
                                        className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                                    >
                                        &times;
                                    </button>
                                </span>
                            )}
                            {roleFilter !== "" && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 font-semibold">
                                    <UserCog className="mr-1 h-3.5 w-3.5" />
                                    {roleFilter === "membre"
                                        ? "Membre"
                                        : roleFilter === "membre_famille"
                                          ? "Membre de famille"
                                          : roleFilter === "membre_de_famille"
                                            ? "Membre de famille"
                                            : roleFilter ===
                                                "responsable_famille"
                                              ? "Responsable de famille"
                                              : roleFilter === "conducteur"
                                                ? "Conducteur"
                                                : roleFilter === "pasteur"
                                                  ? "Pasteur"
                                                  : roleFilter}
                                    <button
                                        onClick={() => setRoleFilter("")}
                                        className="ml-2 text-yellow-600 hover:text-yellow-800 font-bold"
                                    >
                                        &times;
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* --- TABLEAU DES MEMBRES (DESIGN PRO) --- */}
                <div
                    className="flex-1 overflow-hidden rounded-2xl shadow-2xl glass-panel flex flex-col"
                    style={{
                        backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800"><defs><pattern id="diag" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse" patternTransform="translate(0,0) rotate(45)"><line x1="0" y1="0" x2="0" y2="50" stroke="%23f3f4f6" stroke-width="1"/></pattern></defs><rect width="1400" height="800" fill="white"/><rect width="1400" height="800" fill="url(%23diag)" opacity="0.03"/></svg>')`,
                        backgroundAttachment: "fixed",
                    }}
                >
                    <div className="overflow-auto h-full table-scroll">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead
                                className="sticky top-0 z-10"
                                style={{
                                    background:
                                        "linear-gradient(to right, rgb(23, 37, 84), rgb(20, 28, 70))",
                                }}
                            >
                                <tr>
                                    {[
                                        "N°",
                                        "Photo",
                                        "Code Famille",
                                        "Code Membre",
                                        "Nom",
                                        "Prénom",
                                        "Email",
                                        "Téléphone",
                                        "Genre",
                                        "Rôle",
                                        "Fonction",
                                        "Baptisé",
                                        "1ère Communion",
                                        "Marié Civil",
                                        "Marié Religieux",
                                        "Doté",
                                        "Veuf",
                                        "Date création",
                                        "Date modification",
                                        "Classe",
                                        "Famille",
                                        "Relation",
                                        "Statut",
                                        "Actions",
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap"
                                            style={{
                                                color: "#ffffff",
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white/60 backdrop-blur-sm">
                                {currentItems.length > 0 ? (
                                    currentItems.map((m, idx) => (
                                        <tr
                                            key={m.id}
                                            className="hover:bg-white/90 transition-all duration-200"
                                            style={{
                                                backgroundColor:
                                                    idx % 2 === 0
                                                        ? "#ffffff"
                                                        : "#f5f7fa",
                                            }}
                                        >
                                            <td className="px-3 py-3 text-sm font-semibold text-gray-900 text-center whitespace-nowrap">
                                                {idx + 1}
                                            </td>
                                            <td className="px-3 py-3 text-center whitespace-nowrap">
                                                <ProfilePhoto
                                                    user={m}
                                                    size="md"
                                                    className="mx-auto border-2 border-white shadow-sm"
                                                />
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-700 text-center whitespace-nowrap font-semibold">
                                                {m.code_famille || "-"}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-700 text-center whitespace-nowrap font-semibold">
                                                {m.code_membre || "-"}
                                            </td>
                                            <td className="px-3 py-3 text-sm font-semibold text-gray-900 text-center whitespace-nowrap">
                                                {m.nom}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-700 text-center whitespace-nowrap">
                                                {m.prenom}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-600 text-center whitespace-nowrap">
                                                {m.email || "-"}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-600 text-center whitespace-nowrap">
                                                {m.telephone || "-"}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-700 text-center whitespace-nowrap">
                                                {m.genre === "M"
                                                    ? "Masculin"
                                                    : m.genre === "F"
                                                      ? "Féminin"
                                                      : "-"}
                                            </td>
                                            <td className="px-3 py-3 text-sm font-semibold text-gray-900 text-center whitespace-nowrap">
                                                {formatRole(m.role)}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-700 text-center whitespace-nowrap">
                                                {m.fonction ||
                                                    m.fonction_nom ||
                                                    "Non renseigné"}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-center whitespace-nowrap">
                                                {m.baptise ? (
                                                    <span className="text-green-600 font-bold">
                                                        Oui
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Non
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-center whitespace-nowrap">
                                                {m.premiere_communion ? (
                                                    <span className="text-green-600 font-bold">
                                                        Oui
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Non
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-center whitespace-nowrap">
                                                {m.statut_marital ===
                                                "Marié(e)" ? (
                                                    <span className="text-green-600 font-bold">
                                                        Oui
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Non
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-center whitespace-nowrap">
                                                {m.marie_religieusement ? (
                                                    <span className="text-green-600 font-bold">
                                                        Oui
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Non
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-center whitespace-nowrap">
                                                {m.statut_marital === "Dote" ? (
                                                    <span className="text-green-600 font-bold">
                                                        Oui
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Non
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-center whitespace-nowrap">
                                                {m.statut_marital ===
                                                "Veuf(ve)" ? (
                                                    <span className="text-green-600 font-bold">
                                                        Oui
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Non
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-600 text-center whitespace-nowrap">
                                                {m.created_at || "-"}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-600 text-center whitespace-nowrap">
                                                {m.updated_at || "-"}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-700 text-center whitespace-nowrap">
                                                {m.classe || "-"}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-700 text-center whitespace-nowrap">
                                                {m.famille || "-"}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-700 text-center whitespace-nowrap">
                                                {m.relation ||
                                                    m.lien_parente ||
                                                    "Non renseigné"}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-center whitespace-nowrap">
                                                <span
                                                    className={`px-3 py-1 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm border ${m.is_active ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}
                                                >
                                                    {m.is_active
                                                        ? "Actif"
                                                        : "Inactif"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            setViewingMember(m)
                                                        }
                                                        className="p-2 rounded-lg transition-all"
                                                        style={{
                                                            backgroundColor:
                                                                "rgba(37, 99, 235, 0.1)",
                                                            border: "2px solid rgba(37, 99, 235, 0.2)",
                                                        }}
                                                        title="Voir détails"
                                                    >
                                                        <Eye className="w-5 h-5 text-blue-600" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setEditingMember(m)
                                                        }
                                                        className="p-2 rounded-lg transition-all"
                                                        style={{
                                                            backgroundColor:
                                                                "rgba(37, 99, 235, 0.1)",
                                                            border: "2px solid rgba(37, 99, 235, 0.2)",
                                                        }}
                                                        title="Modifier"
                                                    >
                                                        <Pencil className="w-5 h-5 text-blue-600" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            openToggleAlert(m)
                                                        }
                                                        className="p-2 rounded-lg transition-all"
                                                        style={{
                                                            backgroundColor:
                                                                m.is_active
                                                                    ? "rgba(22, 163, 74, 0.1)"
                                                                    : "rgba(220, 38, 38, 0.1)",
                                                            border: m.is_active
                                                                ? "2px solid rgba(22, 163, 74, 0.2)"
                                                                : "2px solid rgba(220, 38, 38, 0.2)",
                                                        }}
                                                        title={
                                                            m.is_active
                                                                ? "Désactiver"
                                                                : "Activer"
                                                        }
                                                    >
                                                        {m.is_active ? (
                                                            <Lock className="w-5 h-5 text-green-600" />
                                                        ) : (
                                                            <LockOpen className="w-5 h-5 text-red-600" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            openDeleteAlert(m)
                                                        }
                                                        className="p-2 rounded-lg transition-all"
                                                        style={{
                                                            backgroundColor:
                                                                "rgba(220, 38, 38, 0.1)",
                                                            border: "2px solid rgba(220, 38, 38, 0.2)",
                                                        }}
                                                        title="Supprimer"
                                                    >
                                                        <svg
                                                            className="w-5 h-5 text-red-600"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={25}
                                            className="px-6 py-12 text-center text-gray-400 italic"
                                        >
                                            Aucun utilisateur trouvé.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- PAGINATION (visible uniquement si plusieurs pages) --- */}
                    {totalPages > 1 && (
                        <div className="mt-4 pb-2">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                paginate={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                {/* --- MODALS --- */}
                <EditMemberModal
                    isOpen={!!editingMember}
                    onClose={() => setEditingMember(null)}
                    memberData={editingMember}
                    onUpdate={onEditMember}
                />
                <MemberDetailsModal
                    isOpen={!!viewingMember}
                    onClose={() => setViewingMember(null)}
                    member={viewingMember}
                />

                <AlertModal
                    isOpen={showToggleAlert}
                    onClose={() => setShowToggleAlert(false)}
                    onConfirm={handleToggleConfirm}
                    title={
                        selectedMember?.is_active
                            ? "Désactiver le membre"
                            : "Activer le membre"
                    }
                    message={`Voulez-vous vraiment ${selectedMember?.is_active ? "désactiver" : "activer"} le compte de "${selectedMember?.prenom} ${selectedMember?.nom}" ?`}
                    confirmText={
                        selectedMember?.is_active ? "Désactiver" : "Activer"
                    }
                    type={selectedMember?.is_active ? "warning" : "success"}
                />
                <AlertModal
                    isOpen={showDeleteAlert}
                    onClose={() => setShowDeleteAlert(false)}
                    onConfirm={handleDeleteConfirm}
                    title="Supprimer le membre"
                    message={`Êtes-vous sûr de vouloir supprimer définitivement "${selectedMember?.prenom} ${selectedMember?.nom}" ?`}
                    confirmText="Supprimer définitivement"
                    type="danger"
                />
            </div>
        </>
    );
};

export default TabUtilisateurs;
