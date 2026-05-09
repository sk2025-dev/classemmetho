import React from "react";
import { Link, router } from "@inertiajs/react";
import {
    Users,
    Mail,
    Phone,
    Calendar,
    MapPin,
    ArrowLeft,
    Heart,
    Award,
    Church,
    Home,
    Edit,
    User as UserIcon,
    Briefcase,
    Clock,
    CheckCircle2,
    Gift,
} from "lucide-react";
import { resolveMemberPhotoUrl } from "../../../Helpers/PhotoHelper";
import { withBasePath } from "../../../Utils/urlHelper";

export default function ShowMember({ member, family, auth }) {
    const memberPhotoUrl = resolveMemberPhotoUrl(member);
    // --- Logique inchangée ---
    const formatDate = (date) => {
        if (!date) return "—";
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
            return typeof date === "string" ? date : "—";
        }
        return parsedDate.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatDateTime = (date) => {
        if (!date) return "—";
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
            return typeof date === "string" ? date : "—";
        }
        return parsedDate.toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getGenreLabel = (genre) => {
        return genre === "M" ? "Homme" : "Femme";
    };

    // --- Composants UI Améliorés ---

    // Composant InfoField moderne (Style "Data Card")
    const InfoField = ({ label, value, icon: Icon, colorClass = "slate" }) => {
        const colorMap = {
            slate: "text-slate-500 bg-slate-50",
            blue: "text-blue-600 bg-blue-50",
            emerald: "text-emerald-600 bg-emerald-50",
            rose: "text-rose-600 bg-rose-50",
            indigo: "text-indigo-600 bg-indigo-50",
            amber: "text-amber-600 bg-amber-50",
            cyan: "text-cyan-600 bg-cyan-50",
        };
        const theme = colorMap[colorClass] || colorMap.slate;

        return (
            <div className="group relative bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-4">
                    {Icon && (
                        <div
                            className={`p-2.5 rounded-lg ${theme} flex-shrink-0 group-hover:scale-110 transition-transform`}
                        >
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                            {label}
                        </p>
                        <p className="text-sm font-semibold text-slate-800 leading-snug break-words">
                            {value || (
                                <span className="text-gray-300 font-normal">
                                    Non renseigné
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    // Composant Section Card (Style propre avec bordure subtile)
    const SectionCard = ({
        title,
        icon: Icon,
        children,
        colorClass = "slate",
    }) => {
        const colorMap = {
            slate: "text-slate-600 bg-slate-50",
            blue: "text-blue-600 bg-blue-50",
            emerald: "text-emerald-600 bg-emerald-50",
            rose: "text-rose-600 bg-rose-50",
            indigo: "text-indigo-600 bg-indigo-50",
            amber: "text-amber-600 bg-amber-50",
            cyan: "text-cyan-600 bg-cyan-50",
        };
        const theme = colorMap[colorClass] || colorMap.slate;

        return (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3 bg-white/50">
                    <div className={`p-2 rounded-lg ${theme}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                        {title}
                    </h2>
                </div>
                <div className="p-6">{children}</div>
            </div>
        );
    };

    // Composant Badge moderne
    const StatusBadge = ({ label, isFilled, icon: Icon }) => (
        <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm border
                ${
                    isFilled
                        ? "bg-white text-slate-700 border-slate-200"
                        : "bg-gray-50 text-gray-400 border-gray-100"
                }`}
        >
            <Icon
                size={16}
                className={isFilled ? "text-emerald-500" : "text-gray-300"}
            />
            {label}
        </div>
    );

    return (
        <div
            className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
            style={{
                background:
                    "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
            }}
        >
            <div className="max-w-6xl mx-auto">
                {/* Header avec bouton retour */}
                <div className="mb-8 flex justify-between items-center">
                    <Link
                        href={withBasePath(
                            "",
                            "/responsable-famille/inscriptions",
                        )}
                        className="inline-flex items-center gap-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full transition-all text-sm font-semibold border border-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux Inscriptions
                    </Link>
                </div>

                {/* Carte de profil principal (Hero) */}
                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden mb-10 border border-white/20 ring-1 ring-black/5">
                    <div className="p-8 md:p-12">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10">
                            {/* Photo de profil */}
                            <div className="flex-shrink-0 relative group">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                                <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-[1.8rem] bg-gray-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                                    {memberPhotoUrl ? (
                                        <img
                                            src={memberPhotoUrl}
                                            alt={`${member.prenom} ${member.nom}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon className="w-20 h-20 text-gray-300" />
                                    )}
                                </div>
                            </div>

                            {/* Informations principales */}
                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                                        {member.prenom}{" "}
                                        <span className="text-slate-300 font-light">
                                            {member.nom}
                                        </span>
                                    </h1>
                                    <p className="text-slate-500 font-medium text-lg">
                                        Famille{" "}
                                        <span className="text-indigo-500">
                                            {family.nom}
                                        </span>
                                    </p>
                                </div>

                                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                    <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-bold border border-slate-200">
                                        {getGenreLabel(member.genre)}
                                    </span>
                                    {member.is_responsable && (
                                        <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-bold border border-amber-200 flex items-center gap-1">
                                            <Award size={14} /> Responsable
                                        </span>
                                    )}
                                    {member.classe && (
                                        <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">
                                            {member.classe.nom}
                                        </span>
                                    )}
                                </div>

                                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                    <Link
                                        href={withBasePath(
                                            "",
                                            `/responsable-famille/inscriptions?family_id=${family.id}`,
                                        )}
                                        className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white/20 hover:bg-white/30 text-white border border-white/30 font-bold rounded-xl transition-all backdrop-blur-sm"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Retour
                                    </Link>
                                    <button
                                        onClick={() =>
                                            router.get(
                                                `/responsable-famille/members/${member.id}/edit`,
                                            )
                                        }
                                        className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Modifier le Profil
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contenu principal - Grille responsive */}
                    <div className="bg-gray-50/50 p-8 md:p-12 space-y-10">
                        {/* Section 1: Informations Personnelles */}
                        <div>
                            <SectionCard
                                title="Informations Personnelles"
                                icon={UserIcon}
                                colorClass="blue"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <InfoField
                                        label="Prénom"
                                        value={member.prenom}
                                        icon={UserIcon}
                                        colorClass="blue"
                                    />
                                    <InfoField
                                        label="Nom"
                                        value={member.nom}
                                        icon={UserIcon}
                                        colorClass="blue"
                                    />
                                    <InfoField
                                        label="Genre"
                                        value={getGenreLabel(member.genre)}
                                        icon={Heart}
                                        colorClass="blue"
                                    />
                                    <InfoField
                                        label="Email"
                                        value={member.email}
                                        icon={Mail}
                                        colorClass="blue"
                                    />
                                    <InfoField
                                        label="Téléphone"
                                        value={member.telephone}
                                        icon={Phone}
                                        colorClass="blue"
                                    />
                                    <InfoField
                                        label="Date de Naissance"
                                        value={formatDate(
                                            member.date_naissance,
                                        )}
                                        icon={Calendar}
                                        colorClass="blue"
                                    />
                                </div>
                            </SectionCard>
                        </div>

                        {/* Section 2: Informations Professionnelles */}
                        <div>
                            <SectionCard
                                title="Informations Professionnelles"
                                icon={Briefcase}
                                colorClass="emerald"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField
                                        label="Profession"
                                        value={member.profession}
                                        icon={Briefcase}
                                        colorClass="emerald"
                                    />
                                    <InfoField
                                        label="Fonction Église"
                                        value={member.fonction?.nom}
                                        icon={Briefcase}
                                        colorClass="emerald"
                                    />
                                    <InfoField
                                        label="Téléphone Sec."
                                        value={member.telephone2}
                                        icon={Phone}
                                        colorClass="emerald"
                                    />
                                    {member.ville && (
                                        <InfoField
                                            label="Ville"
                                            value={member.ville.nom}
                                            icon={Home}
                                            colorClass="emerald"
                                        />
                                    )}
                                </div>
                            </SectionCard>
                        </div>

                        {/* Section 3: Statut Marital */}
                        <div>
                            <SectionCard
                                title="Statut Marital"
                                icon={Heart}
                                colorClass="rose"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField
                                        label="Statut"
                                        value={
                                            member.statut_marital ||
                                            "Non spécifié"
                                        }
                                        icon={Heart}
                                        colorClass="rose"
                                    />

                                    {member.statut_marital &&
                                        member.statut_marital !==
                                            "Célibataire" && (
                                            <>
                                                {member.date_mariage && (
                                                    <InfoField
                                                        label="Date"
                                                        value={formatDate(
                                                            member.date_mariage,
                                                        )}
                                                        icon={Calendar}
                                                        colorClass="rose"
                                                    />
                                                )}
                                                {member.lieu_mariage && (
                                                    <InfoField
                                                        label="Lieu"
                                                        value={
                                                            member.lieu_mariage
                                                        }
                                                        icon={MapPin}
                                                        colorClass="rose"
                                                    />
                                                )}
                                            </>
                                        )}
                                </div>
                            </SectionCard>
                        </div>

                        {/* Section: Infos complémentaires */}
                        {(member.lieu_naissance || member.numero_cni || member.hors_communaute || member.retrait) && (
                            <div>
                                <SectionCard
                                    title="Informations Complémentaires"
                                    icon={UserIcon}
                                    colorClass="gray"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {member.lieu_naissance && (
                                            <InfoField
                                                label="Lieu de naissance"
                                                value={member.lieu_naissance}
                                                icon={MapPin}
                                                colorClass="gray"
                                            />
                                        )}
                                        {member.numero_cni && (
                                            <InfoField
                                                label="N° CNI"
                                                value={member.numero_cni}
                                                icon={UserIcon}
                                                colorClass="gray"
                                            />
                                        )}
                                        <InfoField
                                            label="Hors communauté"
                                            value={member.hors_communaute ? "Oui" : "Non"}
                                            colorClass="gray"
                                        />
                                        <InfoField
                                            label="Retrait"
                                            value={member.retrait ? "Oui" : "Non"}
                                            colorClass="gray"
                                        />
                                        {member.retrait && member.date_retrait && (
                                            <InfoField
                                                label="Date de retrait"
                                                value={formatDate(member.date_retrait)}
                                                icon={Calendar}
                                                colorClass="gray"
                                            />
                                        )}
                                        {member.retrait && member.commentaire_retrait && (
                                            <InfoField
                                                label="Commentaire retrait"
                                                value={member.commentaire_retrait}
                                                colorClass="gray"
                                            />
                                        )}
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {/* Section 4: Sacrements */}
                        {member.sacrements &&
                            (member.sacrements.baptise ||
                                member.sacrements.premiere_communion ||
                                member.sacrements.marie_religieusement) && (
                                <div>
                                    <SectionCard
                                        title="Vie Spirituelle & Sacrements"
                                        icon={Church}
                                        colorClass="indigo"
                                    >
                                        {/* Badges */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                            {member.sacrements.baptise && (
                                                <StatusBadge
                                                    label="Baptisé(e)"
                                                    isFilled={true}
                                                    icon={CheckCircle2}
                                                />
                                            )}
                                            {member.sacrements
                                                .premiere_communion && (
                                                <StatusBadge
                                                    label="1ère Communion"
                                                    isFilled={true}
                                                    icon={CheckCircle2}
                                                />
                                            )}
                                            {member.sacrements
                                                .marie_religieusement && (
                                                <StatusBadge
                                                    label="Mariage Religieux"
                                                    isFilled={true}
                                                    icon={CheckCircle2}
                                                />
                                            )}
                                            {member.sacrements.est_marie && (
                                                <StatusBadge
                                                    label="Marié(e) Civil"
                                                    isFilled={true}
                                                    icon={CheckCircle2}
                                                />
                                            )}
                                        </div>

                                        {/* Sous-sections détaillées */}
                                        <div className="space-y-6">
                                            {/* Baptême */}
                                            {member.sacrements.baptise && (
                                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>{" "}
                                                        Détails du Baptême
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {member.sacrements
                                                            .bapteme_date && (
                                                            <InfoField
                                                                label="Date"
                                                                value={formatDate(
                                                                    member
                                                                        .sacrements
                                                                        .bapteme_date,
                                                                )}
                                                                icon={Calendar}
                                                                colorClass="indigo"
                                                            />
                                                        )}
                                                        {member.sacrements
                                                            .bapteme_lieu && (
                                                            <InfoField
                                                                label="Lieu"
                                                                value={
                                                                    member
                                                                        .sacrements
                                                                        .bapteme_lieu
                                                                }
                                                                icon={MapPin}
                                                                colorClass="indigo"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Communion */}
                                            {member.sacrements
                                                .premiere_communion && (
                                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>{" "}
                                                        Détails de la Communion
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {member.sacrements
                                                            .premiere_communion_date && (
                                                            <InfoField
                                                                label="Date"
                                                                value={formatDate(
                                                                    member
                                                                        .sacrements
                                                                        .premiere_communion_date,
                                                                )}
                                                                icon={Calendar}
                                                                colorClass="indigo"
                                                            />
                                                        )}
                                                        {member.sacrements
                                                            .premiere_communion_lieu && (
                                                            <InfoField
                                                                label="Lieu"
                                                                value={
                                                                    member
                                                                        .sacrements
                                                                        .premiere_communion_lieu
                                                                }
                                                                icon={MapPin}
                                                                colorClass="indigo"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Mariage Religieux */}
                                            {member.sacrements
                                                .marie_religieusement && (
                                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>{" "}
                                                        Détails du Mariage
                                                        Religieux
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {member.sacrements
                                                            .mariage_religieux_date && (
                                                            <InfoField
                                                                label="Date"
                                                                value={formatDate(
                                                                    member
                                                                        .sacrements
                                                                        .mariage_religieux_date,
                                                                )}
                                                                icon={Calendar}
                                                                colorClass="indigo"
                                                            />
                                                        )}
                                                        {member.sacrements
                                                            .mariage_religieux_lieu && (
                                                            <InfoField
                                                                label="Lieu"
                                                                value={
                                                                    member
                                                                        .sacrements
                                                                        .mariage_religieux_lieu
                                                                }
                                                                icon={MapPin}
                                                                colorClass="indigo"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </SectionCard>
                                </div>
                            )}

                        {/* Section 5: Contact Urgence */}
                        {(family.contact_urgence ||
                            family.contact_urgence_tel) && (
                            <div>
                                <SectionCard
                                    title="Contact Familial d'Urgence"
                                    icon={Phone}
                                    colorClass="amber"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InfoField
                                            label="Nom"
                                            value={family.contact_urgence}
                                            icon={UserIcon}
                                            colorClass="amber"
                                        />
                                        <InfoField
                                            label="Téléphone"
                                            value={family.contact_urgence_tel}
                                            icon={Phone}
                                            colorClass="amber"
                                        />
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {/* Section 6: Statut Matrimonial Civil (Détails) */}
                        {member.sacrements &&
                            (member.sacrements.est_marie ||
                                member.sacrements.est_divorce ||
                                member.sacrements.est_veuf ||
                                member.sacrements.dot_effectue) && (
                                <div>
                                    <SectionCard
                                        title="Détails de l'État Civil"
                                        icon={Award}
                                        colorClass="rose"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Marié */}
                                            {member.sacrements.est_marie && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-rose-600 font-bold mb-2">
                                                        <Heart size={18} />{" "}
                                                        Mariage Civil
                                                    </div>
                                                    {member.sacrements
                                                        .mariage_civil_date && (
                                                        <InfoField
                                                            label="Date"
                                                            value={formatDate(
                                                                member
                                                                    .sacrements
                                                                    .mariage_civil_date,
                                                            )}
                                                            icon={Calendar}
                                                            colorClass="rose"
                                                        />
                                                    )}
                                                    {member.sacrements
                                                        .mariage_civil_lieu && (
                                                        <InfoField
                                                            label="Lieu"
                                                            value={
                                                                member
                                                                    .sacrements
                                                                    .mariage_civil_lieu
                                                            }
                                                            icon={MapPin}
                                                            colorClass="rose"
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {/* Divorcé */}
                                            {member.sacrements.est_divorce && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-rose-600 font-bold mb-2">
                                                        <Heart size={18} />{" "}
                                                        Divorce
                                                    </div>
                                                    {member.sacrements
                                                        .divorce_date && (
                                                        <InfoField
                                                            label="Date"
                                                            value={formatDate(
                                                                member
                                                                    .sacrements
                                                                    .divorce_date,
                                                            )}
                                                            icon={Calendar}
                                                            colorClass="rose"
                                                        />
                                                    )}
                                                    {member.sacrements
                                                        .divorce_lieu && (
                                                        <InfoField
                                                            label="Lieu"
                                                            value={
                                                                member
                                                                    .sacrements
                                                                    .divorce_lieu
                                                            }
                                                            icon={MapPin}
                                                            colorClass="rose"
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {/* Veuf */}
                                            {member.sacrements.est_veuf && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-rose-600 font-bold mb-2">
                                                        <Award size={18} />{" "}
                                                        Veuvage
                                                    </div>
                                                    {member.sacrements
                                                        .deces_conjoint_date && (
                                                        <InfoField
                                                            label="Date Décès"
                                                            value={formatDate(
                                                                member
                                                                    .sacrements
                                                                    .deces_conjoint_date,
                                                            )}
                                                            icon={Calendar}
                                                            colorClass="rose"
                                                        />
                                                    )}
                                                    {member.sacrements
                                                        .deces_conjoint_lieu && (
                                                        <InfoField
                                                            label="Lieu"
                                                            value={
                                                                member
                                                                    .sacrements
                                                                    .deces_conjoint_lieu
                                                            }
                                                            icon={MapPin}
                                                            colorClass="rose"
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {/* Dot */}
                                            {member.sacrements.dot_effectue && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-rose-600 font-bold mb-2">
                                                        <Gift size={18} /> Dot
                                                    </div>
                                                    {member.sacrements
                                                        .dot_date && (
                                                        <InfoField
                                                            label="Date"
                                                            value={formatDate(
                                                                member
                                                                    .sacrements
                                                                    .dot_date,
                                                            )}
                                                            icon={Calendar}
                                                            colorClass="rose"
                                                        />
                                                    )}
                                                    {member.sacrements
                                                        .dot_lieu && (
                                                        <InfoField
                                                            label="Lieu"
                                                            value={
                                                                member
                                                                    .sacrements
                                                                    .dot_lieu
                                                            }
                                                            icon={MapPin}
                                                            colorClass="rose"
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </SectionCard>
                                </div>
                            )}

                        {/* Section 8: Informations Familiales */}
                        <div>
                            <SectionCard
                                title="Informations Familiales"
                                icon={Users}
                                colorClass="cyan"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <InfoField
                                        label="Relation"
                                        value={member.relation || "—"}
                                        icon={Users}
                                        colorClass="cyan"
                                    />
                                    {member.classe && (
                                        <InfoField
                                            label="Classe Méthodiste"
                                            value={member.classe.nom}
                                            icon={Award}
                                            colorClass="cyan"
                                        />
                                    )}
                                    <InfoField
                                        label="Statut"
                                        value={member.statut || "Actif"}
                                        icon={Award}
                                        colorClass="cyan"
                                    />
                                    <InfoField
                                        label="Rôle"
                                        value={
                                            member.is_responsable
                                                ? "Responsable"
                                                : "Membre"
                                        }
                                        icon={Award}
                                        colorClass="cyan"
                                    />
                                </div>
                            </SectionCard>
                        </div>

                        {/* Section 9: Historique */}
                        <div>
                            <SectionCard
                                title="Historique d'Enregistrement"
                                icon={Clock}
                                colorClass="slate"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">
                                                Création
                                            </p>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {member.created_at
                                                    ? formatDateTime(
                                                          member.created_at,
                                                      )
                                                    : "—"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">
                                                Modification
                                            </p>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {member.updated_at
                                                    ? formatDateTime(
                                                          member.updated_at,
                                                      )
                                                    : "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
