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

export default function ShowMember({ member, family, auth }) {
    // Formater la date complète
    const formatDate = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // Formater la date avec heure
    const formatDateTime = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Formatage du genre
    const getGenreLabel = (genre) => {
        return genre === "M" ? "Homme" : "Femme";
    };

    // Composant InfoField avec couleur subtile
    const InfoField = ({ label, value, icon: Icon, colorClass = "gray" }) => {
        return (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                    {Icon && (
                        <div className="flex-shrink-0">
                            <Icon className="w-4 h-4 text-slate-600 mt-1" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase text-slate-500 mb-1 tracking-wide">
                            {label}
                        </p>
                        <p className="text-sm text-slate-900 break-words">
                            {value || "—"}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    // Composant Section avec titre et couleur
    const SectionCard = ({ title, icon: Icon, children, colorClass = "slate" }) => {
        const colorMap = {
            slate: { bg: "bg-slate-50", icon: "text-slate-600" },
            blue: { bg: "bg-blue-50", icon: "text-blue-600" },
            emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
            rose: { bg: "bg-rose-50", icon: "text-rose-600" },
            indigo: { bg: "bg-indigo-50", icon: "text-indigo-600" },
            amber: { bg: "bg-amber-50", icon: "text-amber-600" },
            cyan: { bg: "bg-cyan-50", icon: "text-cyan-600" },
        };
        const colors = colorMap[colorClass] || colorMap.slate;

        return (
            <div className={`${colors.bg} rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
                <div className="px-6 py-3 border-b border-gray-200 flex items-center gap-3">
                    {Icon && <Icon className={`w-5 h-5 ${colors.icon}`} />}
                    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        );
    };

    // Composant Badge pour statut
    const StatusBadge = ({ label, isFilled, icon: Icon }) => (
        <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                isFilled
                    ? "bg-slate-100 text-slate-700 border border-slate-300"
                    : "bg-gray-100 text-gray-600 border border-gray-300"
            }`}
        >
            {Icon && <Icon size={16} />}
            {label}
        </div>
    );

    return (
        <div
            className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
            style={{
                background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
            }}
        >
            <div className="max-w-6xl mx-auto">
                {/* Header avec bouton retour */}
                <div className="mb-8">
                    <Link
                        href={`/responsable-famille/inscriptions`}
                        className="inline-flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all mb-6 text-sm font-medium backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux Inscriptions
                    </Link>
                </div>

                {/* Carte de profil principal */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    {/* En-tête avec gradient simple */}
                    <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-8 text-white">
                        <div className="flex flex-col sm:flex-row items-start gap-6">
                            {/* Photo de profil */}
                            <div className="flex-shrink-0">
                                {member.photo_path ? (
                                    <img
                                        src={`/storage/${member.photo_path}`}
                                        alt={`${member.prenom} ${member.nom}`}
                                        className="w-32 h-32 rounded-lg object-cover border-4 border-white shadow-sm"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-lg bg-gray-300 flex items-center justify-center border-4 border-white shadow-sm">
                                        <span className="text-gray-500 text-sm">Pas de photo</span>
                                    </div>
                                )}
                            </div>

                            {/* Informations principales */}
                            <div className="flex-1">
                                <h1 className="text-3xl font-semibold mb-2 tracking-tight">
                                    {member.prenom} {member.nom}
                                </h1>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="inline-block px-3 py-1 bg-white/20 rounded text-sm font-medium">
                                        {getGenreLabel(member.genre)}
                                    </span>
                                    {member.is_responsable && (
                                        <span className="inline-block px-3 py-1 bg-amber-400/25 text-amber-50 rounded text-sm font-medium">
                                            Responsable
                                        </span>
                                    )}
                                    {member.classe && (
                                        <span className="inline-block px-3 py-1 bg-white/15 rounded text-sm font-medium">
                                            Classe Méthodiste: {member.classe.nom}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/responsable-famille/members/${member.id}/edit`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/25 hover:bg-white/35 text-white rounded-lg transition-colors font-medium"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Modifier
                                    </Link>
                                </div>
                                <p className="text-slate-200 text-sm">
                                    Famille: <span className="font-medium">{family.nom}</span>
                                </p>
                            </div>

                            {/* Bouton modifier */}
                            <button
                                onClick={() =>
                                    router.get(
                                        `/members/${member.id}/edit`
                                    )
                                }
                                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-all shadow-sm"
                            >
                                <Edit className="w-4 h-4" />
                                Modifier
                            </button>
                        </div>
                    </div>

                    {/* Contenu principal - Grille responsive */}
                    <div className="p-8 bg-white">
                        {/* Section 1: Informations Personnelles */}
                        <div className="mb-8">
                            <SectionCard title="Informations Personnelles" icon={UserIcon} colorClass="blue">
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
                                        value={formatDate(member.date_naissance)}
                                        icon={Calendar}
                                        colorClass="blue"
                                    />
                                </div>
                            </SectionCard>
                        </div>

                        {/* Section 2: Informations Professionnelles */}
                        <div className="mb-8">
                            <SectionCard title="Informations Professionnelles" icon={Briefcase} colorClass="emerald">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField
                                        label="Profession"
                                        value={member.profession}
                                        icon={Briefcase}
                                        colorClass="emerald"
                                    />
                                    <InfoField
                                        label="Fonction dans l'Église"
                                        value={member.fonction?.nom}
                                        icon={Briefcase}
                                        colorClass="emerald"
                                    />
                                    <InfoField
                                        label="Téléphone Secondaire"
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
                        {/* Section 3: Statut Marital & Mariage */}
                        <div className="mb-8">
                            <SectionCard title="Informations de Mariage" icon={Heart} colorClass="rose">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField
                                        label="Statut Marital"
                                        value={member.statut_marital || 'Non spécifié'}
                                        icon={Heart}
                                        colorClass="rose"
                                    />

                                    {/* Afficher Date et Lieu SEULEMENT si statut marital !== Célibataire */}
                                    {member.statut_marital && member.statut_marital !== "Célibataire" && (
                                        <>
                                            {member.date_mariage && (
                                                <InfoField
                                                    label="Date de Mariage"
                                                    value={formatDate(member.date_mariage)}
                                                    icon={Calendar}
                                                    colorClass="rose"
                                                />
                                            )}
                                            {member.lieu_mariage && (
                                                <InfoField
                                                    label="Lieu de Mariage"
                                                    value={member.lieu_mariage}
                                                    icon={MapPin}
                                                    colorClass="rose"
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            </SectionCard>
                        </div>

                        {/* Section 4: Informations Spirituelles - Sacrements */}
                        {member.sacrements && (member.sacrements.baptise || member.sacrements.premiere_communion || member.sacrements.marie_religieusement) && (
                            <div className="mb-8">
                                <SectionCard title="Sacrements Religieux" icon={Church} colorClass="indigo">
                                    {/* Organiser les sacrements et statut marital */}
                                    {member.sacrements && (
                                        <>
                                            {/* Badges pour les sacrements et statut */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                                {member.sacrements.baptise && (
                                                    <StatusBadge
                                                        label="Baptême"
                                                        isFilled={true}
                                                        icon={CheckCircle2}
                                                    />
                                                )}
                                                {member.sacrements.premiere_communion && (
                                                    <StatusBadge
                                                        label="1ère Communion"
                                                        isFilled={true}
                                                        icon={CheckCircle2}
                                                    />
                                                )}
                                                {member.sacrements.marie_religieusement && (
                                                    <StatusBadge
                                                        label="Mariage Religieux"
                                                        isFilled={true}
                                                        icon={CheckCircle2}
                                                    />
                                                )}
                                                {member.sacrements.est_marie && (
                                                    <StatusBadge
                                                        label="Marié (Civil)"
                                                        isFilled={true}
                                                        icon={CheckCircle2}
                                                    />
                                                )}
                                            </div>

                                            {/* Détails des sacrements religieux */}
                                            <div className="space-y-6">
                                                {/* Baptême */}
                                                {member.sacrements.baptise && (
                                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                        <h3 className="text-sm font-semibold text-slate-900 mb-4">
                                                            Baptême
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {member.sacrements.bapteme_date && (
                                                                <InfoField
                                                                    label="Date du Baptême"
                                                                    value={formatDate(member.sacrements.bapteme_date)}
                                                                    icon={Calendar}
                                                                    colorClass="indigo"
                                                                />
                                                            )}
                                                            {member.sacrements.bapteme_lieu && (
                                                                <InfoField
                                                                    label="Lieu du Baptême"
                                                                    value={member.sacrements.bapteme_lieu}
                                                                    icon={MapPin}
                                                                    colorClass="indigo"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 1ère Communion */}
                                                {member.sacrements.premiere_communion && (
                                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                        <h3 className="text-sm font-semibold text-slate-900 mb-4">
                                                            1ère Communion
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {member.sacrements.premiere_communion_date && (
                                                                <InfoField
                                                                    label="Date de la 1ère Communion"
                                                                    value={formatDate(member.sacrements.premiere_communion_date)}
                                                                    icon={Calendar}
                                                                    colorClass="indigo"
                                                                />
                                                            )}
                                                            {member.sacrements.premiere_communion_lieu && (
                                                                <InfoField
                                                                    label="Lieu de la 1ère Communion"
                                                                    value={member.sacrements.premiere_communion_lieu}
                                                                    icon={MapPin}
                                                                    colorClass="indigo"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Mariage Religieux */}
                                                {member.sacrements.marie_religieusement && (
                                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                        <h3 className="text-sm font-semibold text-slate-900 mb-4">
                                                            Mariage Religieux
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {member.sacrements.mariage_religieux_date && (
                                                                <InfoField
                                                                    label="Date du Mariage Religieux"
                                                                    value={formatDate(member.sacrements.mariage_religieux_date)}
                                                                    icon={Calendar}
                                                                    colorClass="indigo"
                                                                />
                                                            )}
                                                            {member.sacrements.mariage_religieux_lieu && (
                                                                <InfoField
                                                                    label="Lieu du Mariage Religieux"
                                                                    value={member.sacrements.mariage_religieux_lieu}
                                                                    icon={MapPin}
                                                                    colorClass="indigo"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </SectionCard>
                            </div>
                        )}

                        {/* Section 5: Contact Familial d'Urgence */}
                        {(family.contact_urgence || family.contact_urgence_tel) && (
                            <div className="mb-8">
                                <SectionCard title="Contact Familial d'Urgence" icon={Phone} colorClass="amber">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InfoField
                                            label="Nom du Contact"
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

                        {/* Section 6: Statut Matrimonial Civil */}
                        {member.sacrements && (member.sacrements.est_marie || member.sacrements.est_divorce || member.sacrements.est_veuf || member.sacrements.dot_effectue) && (
                            <div className="mb-8">
                                <SectionCard title="Statut Matrimonial" icon={Award} colorClass="rose">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Marié */}
                                        {member.sacrements.est_marie && (
                                            <>
                                                <InfoField
                                                    label="Statut Civil"
                                                    value="Marié"
                                                    icon={Heart}
                                                    colorClass="rose"
                                                />
                                                {member.sacrements.mariage_civil_date && (
                                                    <InfoField
                                                        label="Date du Mariage"
                                                        value={formatDate(member.sacrements.mariage_civil_date)}
                                                        icon={Calendar}
                                                        colorClass="rose"
                                                    />
                                                )}
                                                {member.sacrements.mariage_civil_lieu && (
                                                    <InfoField
                                                        label="Lieu du Mariage"
                                                        value={member.sacrements.mariage_civil_lieu}
                                                        icon={MapPin}
                                                        colorClass="rose"
                                                    />
                                                )}
                                            </>
                                        )}

                                        {/* Divorcé */}
                                        {member.sacrements.est_divorce && (
                                            <>
                                                <InfoField
                                                    label="Divorce"
                                                    value="Oui"
                                                    icon={Heart}
                                                    colorClass="rose"
                                                />
                                                {member.sacrements.divorce_date && (
                                                    <InfoField
                                                        label="Date du Divorce"
                                                        value={formatDate(member.sacrements.divorce_date)}
                                                        icon={Calendar}
                                                        colorClass="rose"
                                                    />
                                                )}
                                                {member.sacrements.divorce_lieu && (
                                                    <InfoField
                                                        label="Lieu du Divorce"
                                                        value={member.sacrements.divorce_lieu}
                                                        icon={MapPin}
                                                        colorClass="rose"
                                                    />
                                                )}
                                            </>
                                        )}

                                        {/* Veuf */}
                                        {member.sacrements.est_veuf && (
                                            <>
                                                <InfoField
                                                    label="Statut"
                                                    value="Veuf"
                                                    icon={Award}
                                                    colorClass="rose"
                                                />
                                                {member.sacrements.deces_conjoint_date && (
                                                    <InfoField
                                                        label="Date du Décès du Conjoint"
                                                        value={formatDate(member.sacrements.deces_conjoint_date)}
                                                        icon={Calendar}
                                                        colorClass="rose"
                                                    />
                                                )}
                                                {member.sacrements.deces_conjoint_lieu && (
                                                    <InfoField
                                                        label="Lieu du Décès"
                                                        value={member.sacrements.deces_conjoint_lieu}
                                                        icon={MapPin}
                                                        colorClass="rose"
                                                    />
                                                )}
                                            </>
                                        )}

                                        {/* Dot */}
                                        {member.sacrements.dot_effectue && (
                                            <>
                                                <InfoField
                                                    label="Dot"
                                                    value="Oui"
                                                    icon={Gift}
                                                    colorClass="rose"
                                                />
                                                {member.sacrements.dot_date && (
                                                    <InfoField
                                                        label="Date de la Dot"
                                                        value={formatDate(member.sacrements.dot_date)}
                                                        icon={Calendar}
                                                        colorClass="rose"
                                                    />
                                                )}
                                                {member.sacrements.dot_lieu && (
                                                    <InfoField
                                                        label="Lieu de la Dot"
                                                        value={member.sacrements.dot_lieu}
                                                        icon={MapPin}
                                                        colorClass="rose"
                                                    />
                                                )}
                                            </>
                                        )}
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {/* Section 8: Informations Familiales */}
                        <div className="mb-8">
                            <SectionCard title="Informations Familiales" icon={Users} colorClass="cyan">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <InfoField
                                        label="Relation de Famille"
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

                        {/* Section 9: Historique d'Enregistrement */}
                        <div className="mb-0">
                            <SectionCard title="Historique d'Enregistrement" icon={Clock} colorClass="slate">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-start gap-3">
                                            <Calendar className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold uppercase text-slate-500 mb-1 tracking-wide">
                                                    Date de Création
                                                </p>
                                                <p className="text-sm text-slate-900">
                                                    {member.created_at ? formatDateTime(member.created_at) : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-start gap-3">
                                            <Clock className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold uppercase text-slate-500 mb-1 tracking-wide">
                                                    Dernière Modification
                                                </p>
                                                <p className="text-sm text-slate-900">
                                                    {member.updated_at ? formatDateTime(member.updated_at) : "—"}
                                                </p>
                                            </div>
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
