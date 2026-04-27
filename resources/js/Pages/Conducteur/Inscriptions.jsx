import React, { useEffect, useState, useRef } from "react";
import { Link, router, useForm, Head, usePage } from "@inertiajs/react";
import axios from "axios";
import { withBasePath } from "../../Utils/urlHelper";
import Select from "react-select";
import FormField from "@/Components/FormField";
import Select2Fonction from "../../Components/Select2Fonction";
import Select2Single from "../../Components/Select2Single";
import {
    RELATION_OPTIONS,
    EMPLOYMENT_STATUS_OPTIONS,
} from "../../Helpers/select2SingleOptions";
import { sanitizeUppercasePrenom } from "../../Helpers/nameSanitizers";
import {
    Eye,
    Edit,
    Pencil,
    Power,
    Trash2,
    User,
    Users,
    Plus,
    Check,
    X,
    Clock,
    UserCheck,
    UserX,
    CheckCircle,
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
    Briefcase,
    ArrowLeft,
    FileText,
    Ban,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";
import DeleteConfirmationModal from "../../Components/DeleteConfirmationModal";
import { normalizePhotoUrl } from "@/Helpers/PhotoUrlHelper";
import ProfilePhoto from "@/Components/ProfilePhoto";
import useToast from "../../Hooks/useToast";
import ToastContainer from "../../Components/ToastContainer";

// Mapping des icônes Lucide pour usage dans les composants
const lucideIcons = {
    user: User,
    users: Users,
    plus: Plus,
    check: Check,
    x: X,
    clock: Clock,
    eye: Eye,
    edit: Edit,
    trash: Trash2,
    "toggle-on": Power,
    "user-check": UserCheck,
};

const MEMBER_ROLE_FILTER_OPTIONS = [
    { value: "all", label: "Tous les roles" },
    { value: "responsable_famille", label: "Responsable" },
    { value: "membre_famille", label: "Membre" },
    { value: "conducteur", label: "Conducteur" },
    { value: "autre", label: "Autre" },
];

const MEMBER_STATUS_FILTER_OPTIONS = [
    { value: "all", label: "Tous les statuts" },
    { value: "actif", label: "Actif" },
    { value: "inactif", label: "Inactif" },
];

const GENDER_OPTIONS = [
    { value: "M", label: "Masculin" },
    { value: "F", label: "Feminin" },
];

const MEMBER_MARITAL_STATUS_OPTIONS = [
    { value: "Célibataire", label: "Célibataire" },
    { value: "Marié(e)", label: "Marié(e)" },
    { value: "Divorcé(e)", label: "Divorcé(e)" },
    { value: "Veuf(ve)", label: "Veuf(ve)" },
    { value: "Dote", label: "Doté(e)" },
];

function getFamilyCodeHistory(member) {
    const history = Array.isArray(member?.code_famille_historique)
        ? member.code_famille_historique.filter(Boolean)
        : [];

    if (history.length > 0) {
        return history;
    }

    return member?.code_famille ? [member.code_famille] : [];
}

function renderTransferBadge(member) {
    if (!member?.transfer_locked && !member?.transfer_history_label) {
        return null;
    }

    const archived = member.transfer_status === "completed";
    const historyOnly =
        !member?.transfer_locked && member?.transfer_history_label;

    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                historyOnly
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : archived
                      ? "bg-slate-200 text-slate-700 border border-slate-300"
                      : "bg-orange-100 text-orange-700 border border-orange-300"
            }`}
        >
            {member.transfer_history_label ||
                member.transfer_label ||
                (archived ? "Ancien membre" : "Transfert en cours")}
        </span>
    );
}

// --- Pagination Component ---
const PaginationControls = ({
    currentPage,
    totalPages,
    onPrevious,
    onNext,
    itemsCount,
    itemsPerPage,
}) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, itemsCount);

    return (
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-sm text-slate-600">
            <span>
                Affichage de {startItem} à {endItem} sur {itemsCount}{" "}
                résultat(s)
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={onPrevious}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                        currentPage === 1
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                    Precedent
                </button>
                <span className="px-3 py-2 text-slate-700 font-semibold">
                    {currentPage} / {totalPages}
                </span>
                <button
                    onClick={onNext}
                    disabled={currentPage >= totalPages}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                        currentPage >= totalPages
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                    Suivant
                </button>
            </div>
        </div>
    );
};

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

    // Ouvrir automatiquement si coché
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

export default function Inscriptions({
    inscriptions = [],
    members = [],
    families = [],
    className,
    pendingCount = 0,
    approvedCount = 0,
    rejectedCount = 0,
    userFamilyId = null,
}) {
    const formatDateDisplay = (value, fallback = "N/A") => {
        if (!value) return fallback;

        if (typeof value === "object" && value !== null) {
            if (typeof value.date === "string" && value.date.trim() !== "") {
                value = value.date;
            } else {
                return fallback;
            }
        }

        if (typeof value === "string") {
            const trimmed = value.trim();
            const alreadyFormatted =
                /^\d{2}\/\d{2}\/\d{4}( \d{2}:\d{2})?$/.test(trimmed);
            if (alreadyFormatted) {
                return trimmed.split(" ")[0];
            }
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return typeof value === "string" ? value : fallback;
        }

        return parsed.toLocaleDateString("fr-FR");
    };

    const { flash, auth } = usePage().props;
    const {
        toasts,
        removeToast,
        success: showSuccessToast,
        error: showError,
    } = useToast();
    const [showSuccessNotification, setShowSuccessNotification] =
        useState(false);
    const [successTitle, setSuccessTitle] = useState("Inscription validée !");
    const [successSubtitle, setSuccessSubtitle] = useState(
        "Connectez-vous pour commencer.",
    );
    const notificationTimeoutRef = useRef(null);

    const triggerSuccessNotification = (
        title = "Inscription validée !",
        subtitle = "Connectez-vous pour commencer.",
    ) => {
        setSuccessTitle(title);
        setSuccessSubtitle(subtitle);
        setShowSuccessNotification(true);
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
        notificationTimeoutRef.current = setTimeout(() => {
            setShowSuccessNotification(false);
        }, 5000);
    };

    useEffect(() => {
        if (flash?.success) {
            triggerSuccessNotification(flash.success, null);
        }
    }, [flash?.success]);
    // --- PAGINATION ---
    const ITEMS_PER_PAGE = 10;
    const [pagination, setPagination] = useState({
        pending: 1,
        approved: 1,
        rejected: 1,
        members: 1,
        families: 1,
    });

    const handlePaginationChange = (tab, newPage) => {
        setPagination({ ...pagination, [tab]: newPage });
    };

    // --- ÉTAT ---
    const [activeTab, setActiveTab] = useState("pending"); // Onglet actif : pending, approved, rejected, families

    // --- AJOUT DES FILTRES ---
    const [filters, setFilters] = useState({
        search: "",
        status: "all",
        role: "all",
        viewMode: "all",
        familyFilter: "", // Nouveau filtre pour les familles
    });

    // --- STATISTIQUES CALCULÉES ---
    const [calculatedStats, setCalculatedStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
    });

    // === DEBUG: Affichage des inscriptions reçues ===
    useEffect(() => {
        console.log("DEBUG - Inscriptions reçues du backend:", {
            nombre_inscriptions: (inscriptions || []).length,
            inscriptions: inscriptions || [],
            details: (inscriptions || []).map((insc) => ({
                id: insc.id,
                nom: insc.nom,
                prenom: insc.prenom,
                type: insc.type,
                status: insc.status,
                email: insc.email,
            })),
        });
    }, [inscriptions]);

    const tableHeaderClass =
        activeTab === "pending"
            ? "bg-yellow-500 text-white"
            : activeTab === "approved"
              ? "bg-green-500 text-white"
              : activeTab === "rejected"
                ? "bg-red-500 text-white"
                : "bg-slate-50 text-slate-500";

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [selectedMember, setSelectedMember] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedInscription, setSelectedInscription] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [approvingId, setApprovingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);

    // Modal famille
    const [showFamilyModal, setShowFamilyModal] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [memberToToggle, setMemberToToggle] = useState(null);
    const [toggleProcessing, setToggleProcessing] = useState(false);

    // États pour les données persistantes
    const [fonctions, setFonctions] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});
    const [emailTaken, setEmailTaken] = useState(false);
    const [emailChecking, setEmailChecking] = useState(false);
    const emailCheckTimerRef = useRef(null);

    // --- FORMULAIRE (Add / Edit) ---
    const { data, setData, post, put, processing, reset, errors } = useForm({
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
        employment_status: "",
        profession_detail: "",
        profession: "",
        fonction_ids: [],
        fonction_id: "",
        relation: "",
        // Photo
        photo: null,
        photoPreview: null,
        // Sacrements
        baptise: false,
        date_bapteme: "",
        lieu_bapteme: "",
        premiere_communion: false,
        date_premiere_communion: "",
        lieu_premiere_communion: "",
        marie_religieusement: false,
        date_mariage_religieux: "",
        lieu_mariage_religieux: "",
        role: "membre",
        status: "actif",
    });

    // Réfs pour les inputs
    const nomRef = useRef(null);
    const prenomRef = useRef(null);
    const emailRef = useRef(null);
    const autoSaveTimeoutRef = useRef(null);

    // État pour la notification de sauvegarde
    const [saveNotification, setSaveNotification] = useState({
        show: false,
        message: "",
    });

    // Fonction pour formater les dates ISO en format yyyy-MM-dd pour les inputs HTML
    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const raw = String(dateString).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

        const fr = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (fr) {
            const [, dd, mm, yyyy] = fr;
            return `${yyyy}-${mm}-${dd}`;
        }

        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) return "";

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Charger les fonctions au montage
    useEffect(() => {
        const fetchFonctions = async () => {
            try {
                const res = await axios.get(withBasePath("", "/api/fonctions"));
                setFonctions(res.data);
            } catch (error) {
                console.error(
                    "Erreur lors du chargement des fonctions:",
                    error,
                );
            }
        };
        fetchFonctions();
    }, []);

    // --- LOGIQUE DE FILTRAGE (INSCRIPTIONS + MEMBRES) ---
    // IMPORTANT: Les inscriptions et les membres sont mappés séparément
    // Les inscriptions groupent les données de type "famille" avec les statuts: pending, approved, rejected
    // Les membres sont les utilisateurs créés avec status: actif ou inactif

    const inscriptionsOnly = (inscriptions || []).map((insc) => {
        const mapped = {
            id: insc.id,
            kind: "inscription",
            inscriptionType: insc.type, // Type réel: famille, conducteur, pasteur
            nom: insc.nom,
            prenom: insc.prenom,
            email: insc.email,
            phone: insc.telephone,
            date_naissance:
                insc.date_naissance || insc.responsable_date_naissance || null,
            role: insc.role || "membre",
            // CORRECTION: Mapper les statuts d'inscription correctement
            // en_attente -> pending
            // approuve -> approved (PAS "actif" pour éviter la confusion avec les members)
            // rejete -> rejected
            status:
                insc.status === "en_attente" || insc.status === "pending"
                    ? "pending"
                    : insc.status === "approuve" || insc.status === "approved"
                      ? "approved" // Changement important
                      : insc.status === "rejete" || insc.status === "rejected"
                        ? "rejected"
                        : "pending",
            famille_id: insc.famille_id || null,
            code_membre: insc.code_membre || null,
            responsable_famille: insc.responsable_famille || false,
            admin_approved: insc.admin_approved,
            admin_name: insc.admin_name,
            conducteur_approved: insc.conducteur_approved,
            conducteur_name: insc.conducteur_name,
            raison_rejet: insc.raison_rejet,
            profile_photo_url: normalizePhotoUrl(
                insc.profile_photo_url || insc.photo_path || insc.photo || null,
            ),
            fonction_professionnelle: insc.fonction_professionnelle || null,
            created_at: insc.created_at || null,
            updated_at: insc.updated_at || insc.created_at || null,
            raw: insc,
        };

        return mapped;
    });

    const membersOnly = (members || []).map((member) => ({
        id: member.id,
        kind: "member",
        inscriptionType: null,
        nom: member.last_name,
        prenom: member.first_name,
        email: member.email,
        phone: member.phone,
        date_naissance: member.date_naissance || null,
        role: member.role || "membre",
        status: (() => {
            const rawStatus = String(
                member.status ?? member.statut ?? "",
            ).toLowerCase();
            if (rawStatus === "inactive" || rawStatus === "inactif")
                return "inactif";
            if (rawStatus === "decede" || rawStatus === "deceased")
                return "decede";
            return "actif";
        })(),
        famille_id: member.famille_id || member.family_id || null,
        code_famille: member.code_famille || null,
        ancienne_famille_code: member.ancienne_famille_code || null,
        nouvelle_famille_code: member.nouvelle_famille_code || null,
        code_famille_historique: member.code_famille_historique || [],
        code_membre: member.code_membre || null,
        responsable_famille: member.responsable_famille || false,
        transfer_status: member.transfer_status || null,
        transfer_label: member.transfer_label || null,
        transfer_history_label: member.transfer_history_label || null,
        transfer_locked: Boolean(member.transfer_locked),
        profile_photo_url: normalizePhotoUrl(
            member.profile_photo_url ||
                member.photo_path ||
                member.photo ||
                null,
        ),
        fonction_professionnelle: member.fonction_professionnelle || null,
        created_at: member.created_at || null,
        updated_at: member.updated_at || member.created_at || null,
        raw: member,
    }));

    // Utiliser les familles envoyées par le backend
    const familiesList = (families || []).map((family) => ({
        familyId: family.id,
        nom: family.nom,
        code_famille: family.code_famille || null,
        responsable: {
            id: family.responsable?.id,
            nom: family.responsable?.nom || "N/A",
            prenom: family.responsable?.prenom || "N/A",
            email: family.responsable?.email,
            phone: family.responsable?.phone,
            code_membre: family.responsable?.code_membre || null,
            transfer_status: family.responsable?.transfer_status || null,
            transfer_label: family.responsable?.transfer_label || null,
            transfer_locked: Boolean(family.responsable?.transfer_locked),
        },
        members: family.members || [],
        memberCount: family.member_count || family.members?.length || 0,
        transfer_status: family.transfer_status || null,
        transfer_label: family.transfer_label || null,
        transfer_locked: Boolean(family.transfer_locked),
    }));

    const familyFilterOptions = [
        { value: "", label: "Toutes les familles" },
        ...familiesList.map((family) => ({
            value: family.familyId,
            label: family.nom,
        })),
    ];

    const relationOptions =
        data.relation &&
        !RELATION_OPTIONS.some((option) => option.value === data.relation)
            ? [
                  {
                      value: data.relation,
                      label: String(data.relation)
                          .replace(/[_-]+/g, " ")
                          .replace(/\s+/g, " ")
                          .trim()
                          .replace(/\b\w/g, (char) => char.toUpperCase()),
                  },
                  ...RELATION_OPTIONS,
              ]
            : RELATION_OPTIONS;

    // Pour les onglets inscription (pending, approved, rejected): afficher uniquement les inscriptions
    // Pour l'onglet membres: afficher uniquement les membres
    const filteredItems = (
        activeTab === "members" ? membersOnly : inscriptionsOnly
    ).filter((item) => {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
            item.nom?.toLowerCase().includes(searchLower) ||
            item.prenom?.toLowerCase().includes(searchLower) ||
            item.email?.toLowerCase().includes(searchLower);

        // Filtres spécifiques aux membres
        if (activeTab === "members") {
            const matchesStatus =
                filters.status === "all" || item.status === filters.status;
            const matchesRole =
                filters.role === "all" || item.role === filters.role;

            // Filtre par famille
            let matchesFamily = true;
            if (
                filters.familyFilter !== "" &&
                filters.familyFilter !== "no_family"
            ) {
                const targetFamilyId = String(filters.familyFilter);
                const itemFamilyId =
                    item.famille_id ?? item.family_id ?? item.familyId ?? null;

                if (
                    itemFamilyId !== null &&
                    String(itemFamilyId) === targetFamilyId
                ) {
                    matchesFamily = true;
                } else {
                    // Fallback: retrouver la famille via la liste agrégée
                    const memberFamily = familiesList.find(
                        (f) =>
                            f.members &&
                            f.members.some((m) => m.id === item.id),
                    );
                    matchesFamily =
                        !!memberFamily &&
                        String(memberFamily.familyId) === targetFamilyId;
                }
            }

            return (
                matchesSearch && matchesStatus && matchesRole && matchesFamily
            );
        }

        // Filtre par onglet pour les inscriptions
        let matchesTab = false;
        if (activeTab === "pending") {
            matchesTab = item.status === "pending";
        } else if (activeTab === "approved") {
            matchesTab = item.status === "approved";
        } else if (activeTab === "rejected") {
            matchesTab = item.status === "rejected";
        } else if (activeTab === "families") {
            matchesTab = true; // Afficher toutes les inscriptions dans cet onglet
        }

        // Pour les onglets inscriptions, on se base uniquement sur l'onglet + recherche
        // afin d'éviter de masquer des rejets de la classe avec des filtres résiduels.
        return matchesSearch && matchesTab;
    });

    // --- CALCUL DES STATISTIQUES DEPUIS LES VRAIES DONNÉES ---
    useEffect(() => {
        const pending = inscriptionsOnly.filter(
            (item) => item.status === "pending",
        ).length;
        const approved = inscriptionsOnly.filter(
            (item) => item.status === "approved",
        ).length; // Changement
        const rejected = inscriptionsOnly.filter(
            (item) => item.status === "rejected",
        ).length;

        console.log("DEBUG - Stats calculées:", {
            pending,
            approved,
            rejected,
            total: pending + approved + rejected,
            inscriptions_total: inscriptionsOnly.length,
            members_total: membersOnly.length,
        });

        setCalculatedStats({
            pending,
            approved,
            rejected,
            total: pending + approved + rejected,
        });
    }, [inscriptions, members]); // Se recalcule quand les inscriptions/membres changent

    // === DEBUG DÉTAILLÉ ===
    useEffect(() => {
        console.log("DEBUG COMPLET - Inscriptions vs Members:", {
            inscriptions_count: inscriptionsOnly.length,
            inscriptions_par_status: {
                pending: inscriptionsOnly.filter((i) => i.status === "pending")
                    .length,
                approved: inscriptionsOnly.filter(
                    (i) => i.status === "approved",
                ).length,
                rejected: inscriptionsOnly.filter(
                    (i) => i.status === "rejected",
                ).length,
            },
            members_count: membersOnly.length,
            members_details: membersOnly.map((m) => ({
                id: m.id,
                nom: `${m.nom} ${m.prenom}`,
                status: m.status,
            })),
            filtered_items_count: filteredItems.length,
            active_tab: activeTab,
        });
    }, [inscriptionsOnly, membersOnly, filteredItems, activeTab]);
    const resetFilters = () => {
        setFilters({
            search: "",
            status: "all",
            role: "all",
            viewMode: "all",
            familyFilter: "",
            displayMode: "list",
        });
    };

    const switchTab = (tab) => {
        setActiveTab(tab);
        // Evite de masquer des éléments (ex: rejets) à cause d'une recherche précédente
        setFilters((prev) => ({ ...prev, search: "" }));
    };

    // Reset pagination to page 1 when activeTab changes
    useEffect(() => {
        setPagination({
            pending: 1,
            approved: 1,
            rejected: 1,
            members: 1,
            families: 1,
        });
    }, [activeTab]);

    // Reset pagination to page 1 when filters change within current tab
    useEffect(() => {
        const tabKey =
            activeTab === "pending"
                ? "pending"
                : activeTab === "approved"
                  ? "approved"
                  : activeTab === "rejected"
                    ? "rejected"
                    : activeTab === "members"
                      ? "members"
                      : "families";
        setPagination((prev) => ({ ...prev, [tabKey]: 1 }));
    }, [filters]);

    // --- ACTIONS ---

    // Suppression unifiée
    const handleDelete = (id, kind) => {
        const itemText =
            kind === "inscription"
                ? "cette demande d'inscription"
                : "ce membre";
        if (
            !window.confirm(
                `Êtes-vous sûr de vouloir supprimer ${itemText} ?`,
            )
        ) {
            return;
        }

        const url =
            kind === "inscription"
                ? `/conducteur/inscriptions/${id}`
                : `/conducteur/members/${id}`;

        router.delete(url, {
            onSuccess: () => {
                // Gestion succès
            },
            onError: (errors) => {
                alert("Erreur lors de la suppression.");
            },
        });
    };

    const approveInscription = async (inscriptionId) => {
        if (
            !window.confirm(
                "Êtes-vous sûr de vouloir approuver cette inscription ?",
            )
        )
            return;
        setApprovingId(inscriptionId);
        try {
            const response = await axios.post(
                `/conducteur/inscriptions/${inscriptionId}/approve`,
                { reason: "" },
                {
                    headers: {
                        "X-CSRF-TOKEN":
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute("content") || "",
                    },
                },
            );
            if (response.data.success) {
                router.reload({
                    onSuccess: () => {
                        setShowDetailModal(false);
                        triggerSuccessNotification();
                    },
                });
            }
        } catch (error) {
            alert(
                "Erreur lors de l'approbation: " +
                    (error.response?.data?.error || error.message),
            );
        } finally {
            setApprovingId(null);
        }
    };

    const rejectInscription = async (inscriptionId) => {
        const reason = prompt("Veuillez indiquer le motif du rejet:");
        if (!reason) return;
        setRejectingId(inscriptionId);
        try {
            const response = await axios.post(
                `/conducteur/inscriptions/${inscriptionId}/reject`,
                { reason },
            );
            if (response.data.success) {
                router.reload({
                    only: [
                        "inscriptions",
                        "members",
                        "pendingCount",
                        "approvedCount",
                        "rejectedCount",
                    ],
                    onSuccess: () => setShowDetailModal(false),
                });
            }
        } catch (error) {
            alert(
                "Erreur lors du rejet: " +
                    (error.response?.data?.error || error.message),
            );
        } finally {
            setRejectingId(null);
        }
    };

    const openDetailModal = (item) => {
        setSelectedInscription({
            ...(item.raw || {}),
            created_at: item.created_at || item.raw?.created_at || null,
            updated_at:
                item.updated_at ||
                item.raw?.updated_at ||
                item.created_at ||
                item.raw?.created_at ||
                null,
        });
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedInscription(null);
    };

    const normalizeMemberForModal = (item = {}) => {
        const knownMember =
            (membersOnly || []).find(
                (m) => String(m.id) === String(item?.id ?? item?.raw?.id ?? ""),
            ) || null;

        const rawBase =
            item?.raw && typeof item.raw === "object" ? item.raw : {};
        const createdAt =
            item?.created_at ??
            rawBase?.created_at ??
            knownMember?.created_at ??
            knownMember?.raw?.created_at ??
            null;
        const updatedAt =
            item?.updated_at ??
            rawBase?.updated_at ??
            knownMember?.updated_at ??
            knownMember?.raw?.updated_at ??
            createdAt ??
            null;

        return {
            ...(knownMember?.raw || {}),
            ...(knownMember || {}),
            ...rawBase,
            ...item,
            created_at: createdAt,
            updated_at: updatedAt,
            raw: {
                ...(knownMember?.raw || {}),
                ...(knownMember || {}),
                ...rawBase,
                ...item,
                created_at: createdAt,
                updated_at: updatedAt,
            },
        };
    };

    const toBool = (value) =>
        value === true ||
        value === 1 ||
        value === "1" ||
        String(value).toLowerCase() === "true";

    const normalizeStatutMarital = (rawValue, sacrements = null) => {
        const value = String(rawValue ?? "")
            .trim()
            .toLowerCase();
        if (!value && sacrements) {
            if (toBool(sacrements.est_marie)) return "Marié(e)";
            if (toBool(sacrements.est_divorce)) return "Divorcé(e)";
            if (toBool(sacrements.est_veuf)) return "Veuf(ve)";
            if (toBool(sacrements.dot_effectue)) return "Dote";
            return "";
        }

        if (["marie", "marié", "mariée", "marié(e)"].includes(value))
            return "Marié(e)";
        if (["divorce", "divorcé", "divorcée", "divorcé(e)"].includes(value))
            return "Divorcé(e)";
        if (["veuf", "veuve", "veuf(ve)"].includes(value)) return "Veuf(ve)";
        if (["dote", "doté", "dotée", "doté(e)"].includes(value))
            return "Dote";
        if (["celibataire", "célibataire"].includes(value))
            return "Célibataire";

        return rawValue || "";
    };

    const buildFormDataFromMember = (member = {}, item = {}) => {
        const sac = member.sacrements || {};
        const statutMarital = normalizeStatutMarital(
            member.statut_marital ?? member.raw?.statut_marital,
            sac,
        );

        return {
            nom: member.last_name || member.nom || "",
            prenom: member.first_name || member.prenom || "",
            email: member.email || "",
            telephone: member.phone || member.telephone || "",
            genre: member.genre || "",
            date_naissance: formatDateForInput(member.date_naissance) || "",
            employment_status:
                member.employment_status || member.raw?.employment_status || "",
            profession_detail:
                member.profession_detail ||
                member.raw?.profession_detail ||
                member.profession ||
                member.fonction_professionnelle ||
                "",
            profession:
                member.profession_detail ||
                member.profession ||
                member.fonction_professionnelle ||
                "",
            fonction_ids: Array.isArray(member.fonction_ids)
                ? member.fonction_ids.map((id) => String(id))
                : Array.isArray(member.raw?.fonction_ids)
                  ? member.raw.fonction_ids.map((id) => String(id))
                  : Array.isArray(member.fonctions)
                    ? member.fonctions
                          .map((fonction) => String(fonction?.id))
                          .filter(Boolean)
                    : Array.isArray(member.raw?.fonctions)
                      ? member.raw.fonctions
                            .map((fonction) => String(fonction?.id))
                            .filter(Boolean)
                      : member.fonction_id
                        ? [String(member.fonction_id)]
                        : member.raw?.fonction_id
                          ? [String(member.raw.fonction_id)]
                          : [],
            fonction_id: String(
                member.fonction_id ??
                    member.raw?.fonction_id ??
                    member.fonction?.id ??
                    member.raw?.fonction?.id ??
                    "",
            ),
            relation:
                member.relation ??
                member.lien_parental ??
                member.family_relation ??
                "",
            statut_marital: statutMarital,
            date_mariage: formatDateForInput(
                member.date_mariage ??
                    member.mariage_civil_date ??
                    sac.mariage_civil_date ??
                    member.date_divorce ??
                    sac.divorce_date ??
                    member.date_dot ??
                    sac.dot_date ??
                    member.date_deces_conjoint ??
                    sac.deces_conjoint_date ??
                    "",
            ),
            lieu_mariage:
                member.lieu_mariage ??
                member.mariage_civil_lieu ??
                sac.mariage_civil_lieu ??
                member.lieu_divorce ??
                sac.divorce_lieu ??
                member.lieu_dot ??
                sac.dot_lieu ??
                member.lieu_deces_conjoint ??
                sac.deces_conjoint_lieu ??
                "",
            date_divorce: formatDateForInput(
                member.date_divorce ?? sac.divorce_date ?? "",
            ),
            baptise: toBool(member.baptise) || toBool(sac.baptise),
            date_bapteme: formatDateForInput(
                member.date_bapteme ??
                    member.bapteme_date ??
                    sac.bapteme_date ??
                    "",
            ),
            lieu_bapteme:
                member.lieu_bapteme ??
                member.bapteme_lieu ??
                sac.bapteme_lieu ??
                "",
            premiere_communion:
                toBool(member.premiere_communion) ||
                toBool(sac.premiere_communion),
            date_premiere_communion: formatDateForInput(
                member.date_premiere_communion ??
                    member.premiere_communion_date ??
                    sac.premiere_communion_date ??
                    "",
            ),
            lieu_premiere_communion:
                member.lieu_premiere_communion ??
                member.premiere_communion_lieu ??
                sac.premiere_communion_lieu ??
                "",
            marie_religieusement:
                toBool(member.marie_religieusement) ||
                toBool(sac.marie_religieusement),
            date_mariage_religieux: formatDateForInput(
                member.date_mariage_religieux ??
                    member.mariage_religieux_date ??
                    sac.mariage_religieux_date ??
                    "",
            ),
            lieu_mariage_religieux:
                member.lieu_mariage_religieux ??
                member.mariage_religieux_lieu ??
                sac.mariage_religieux_lieu ??
                "",
            role:
                item.role === "inscription"
                    ? "membre"
                    : member.role || "membre",
            status: member.status || "actif",
            photo: null,
            photoPreview: member.profile_photo_url || null,
        };
    };

    const openMemberModal = (item) => {
        setSelectedMember(normalizeMemberForModal(item));
        setShowMemberModal(true);
    };

    const openCreateModal = () => {
        setModalMode("create");
        reset();
        setEmailTaken(false);
        setEmailChecking(false);
        setShowDetailModal(false);
        setShowMemberModal(false);
        setShowFamilyModal(false);
        setShowModal(true);
    };

    const openEditModal = async (item) => {
        console.log("DEBUG OPEN EDIT MODAL - item reçu:", item);
        setModalMode("edit");
        setShowDetailModal(false);
        setShowMemberModal(false);
        setShowFamilyModal(false);

        // Ouvrir immédiatement le modal avec les données déjà disponibles
        let member = normalizeMemberForModal(item);
        if (member.raw) member = { ...member, ...member.raw };
        setSelectedMember(member);
        setData(buildFormDataFromMember(member, item));
        setShowModal(true);

        // Enrichir ensuite en arrière-plan si les sacrements manquent
        if (!member.sacrements && member.id) {
            try {
                const res = await axios.get(
                    withBasePath("", `/users/${member.id}/sacrements`),
                );
                if (res.data && res.data.success) {
                    const enrichedMember = {
                        ...member,
                        sacrements: res.data.sacrements || null,
                        statut_marital:
                            member.statut_marital ||
                            res.data.statut_marital ||
                            null,
                        relation: member.relation || res.data.relation || null,
                        fonction_id:
                            member.fonction_id || res.data.fonction_id || null,
                    };
                    setSelectedMember(enrichedMember);
                    setData(buildFormDataFromMember(enrichedMember, item));
                }
            } catch (e) {
                console.error(
                    "Erreur récupération sacrements utilisateur:",
                    e,
                );
            }
        }

        console.log(
            "DEBUG OPEN EDIT MODAL - member trouvé (après fusion):",
            member,
        );
        console.log("DEBUG - Toutes les clés du member:", Object.keys(member));
        console.log(
            "DEBUG - statut_marital:",
            member.statut_marital,
            "type:",
            typeof member.statut_marital,
        );
        console.log(
            "DEBUG - relation:",
            member.relation,
            "type:",
            typeof member.relation,
        );
        console.log(
            "DEBUG - fonction_id:",
            member.fonction_id,
            "type:",
            typeof member.fonction_id,
        );
        console.log(
            "DEBUG - genre:",
            member.genre,
            "type:",
            typeof member.genre,
        );
    };

    // Fonction pour sauvegarder automatiquement en mode édition
    const autoSaveMember = async (memberId, memberData) => {
        try {
            const formData = new FormData();
            Object.entries(memberData).forEach(([key, value]) => {
                if (key === "photo" && value) {
                    // N'envoyer le champ photo que si c'est un vrai fichier.
                    if (value instanceof File || value instanceof Blob) {
                        formData.append(key, value);
                    } else if (typeof value === "string") {
                        // Cas d'une photo déjà uploadée (URL /storage/...) via un autre flux.
                        formData.append("profile_photo_url", value);
                    }
                } else if (key !== "photoPreview") {
                    if (Array.isArray(value)) {
                        value.forEach((itemValue) => {
                            formData.append(`${key}[]`, String(itemValue));
                        });
                    } else {
                        const valueToSend =
                            typeof value === "boolean"
                                ? value
                                    ? "1"
                                    : "0"
                                : (value ?? "");
                        formData.append(key, valueToSend);
                    }
                }
            });

            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content");
            if (csrfToken) {
                formData.append("_token", csrfToken);
            }

            console.log("AUTO-SAVE - Envoi des données pour membre", memberId);
            console.log(
                "AUTO-SAVE - FormData entries:",
                Array.from(formData.entries()),
            );

            const response = await axios.put(
                `/conducteur/members/${memberId}`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                },
            );

            console.log("AUTO-SAVE - Réponse du serveur:", response.data);

            // Afficher la notification de sauvegarde
            setSaveNotification({
                show: true,
                message: "Sauvegarde effectuee",
            });
            setTimeout(
                () => setSaveNotification({ show: false, message: "" }),
                2000,
            );
        } catch (err) {
            console.error(
                "AUTO-SAVE - Erreur:",
                err.response?.data || err.message,
            );
        }
    };

    // Réinitialiser la vérification email quand le modal se ferme
    useEffect(() => {
        if (!showModal) {
            setEmailTaken(false);
            setEmailChecking(false);
            if (emailCheckTimerRef.current) clearTimeout(emailCheckTimerRef.current);
        }
    }, [showModal]);

    // Vérification email en temps réel (debounce 500 ms)
    useEffect(() => {
        const email = data.email?.trim();

        // Réinitialiser si champ vide
        if (!email) {
            setEmailTaken(false);
            setEmailChecking(false);
            if (emailCheckTimerRef.current) clearTimeout(emailCheckTimerRef.current);
            return;
        }

        // En mode édition on exclut le membre actuel
        const excludeId = modalMode === "edit" && selectedMember?.id ? selectedMember.id : 0;

        setEmailChecking(true);
        if (emailCheckTimerRef.current) clearTimeout(emailCheckTimerRef.current);
        emailCheckTimerRef.current = setTimeout(() => {
            axios
                .get(`/conducteur/check-email?email=${encodeURIComponent(email)}&exclude_id=${excludeId}`)
                .then((res) => {
                    setEmailTaken(!!res.data?.taken);
                })
                .catch(() => {
                    setEmailTaken(false);
                })
                .finally(() => setEmailChecking(false));
        }, 500);

        return () => {
            if (emailCheckTimerRef.current) clearTimeout(emailCheckTimerRef.current);
        };
    }, [data.email]);

    // Auto-save avec debounce en mode édition
    useEffect(() => {
        if (modalMode === "edit" && selectedMember) {
            // Annuler le timeout précédent
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }

            // Créer un nouveau timeout de 3 secondes
            autoSaveTimeoutRef.current = setTimeout(() => {
                autoSaveMember(selectedMember.id, data);
            }, 3000);
        }

        // Cleanup au démontage
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [data, modalMode, selectedMember]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (emailTaken) {
            showError("Cette adresse email est déjà utilisée. Veuillez en saisir une autre.", 4000);
            emailRef.current?.focus();
            return;
        }

        if (modalMode === "create") {
            // Créer un nouveau membre - code existant
            const conducteur = auth?.user;
            const currentFamily = familiesList.find(
                (f) => f.familyId === userFamilyId,
            );

            console.log("Conducteur (user connecté):", conducteur);
            console.log("Famille actuelle:", currentFamily);

            if (!conducteur) {
                alert(
                    "Erreur: Conducteur non trouvé. Veuillez vous reconnecter.",
                );
                return;
            }

            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (key === "photo" && value) {
                    // N'envoyer le champ photo que si c'est un vrai fichier.
                    if (value instanceof File || value instanceof Blob) {
                        formData.append(key, value);
                    } else if (typeof value === "string") {
                        // Cas d'une photo déjà uploadée (URL /storage/...) via un autre flux.
                        formData.append("profile_photo_url", value);
                    }
                } else if (key !== "photoPreview") {
                    if (Array.isArray(value)) {
                        value.forEach((itemValue) => {
                            formData.append(`${key}[]`, String(itemValue));
                        });
                    } else {
                        const valueToSend =
                            typeof value === "boolean"
                                ? value
                                    ? "1"
                                    : "0"
                                : (value ?? "");
                        formData.append(key, valueToSend);
                    }
                }
            });

            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content");
            if (csrfToken) {
                formData.append("_token", csrfToken);
            }

            console.log(
                "FormData envoyé à /conducteur/quick-member:",
                Array.from(formData.entries()),
            );

            axios
                .post("/conducteur/quick-member", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
                .then((response) => {
                    console.log("Succès!", response.data);
                    showSuccessToast("Le membre a bien ete ajoute.", 2500);
                    setShowModal(false);
                    setTimeout(() => {
                        router.reload();
                    }, 600);
                })
                .catch((err) => {
                    console.error("Erreur complète:", err);
                    console.log("Response data:", err?.response?.data);

                    const apiErrors = err?.response?.data?.errors;
                    const message = err?.response?.data?.message;

                    console.log("Erreurs API:", apiErrors);

                    if (apiErrors && Object.keys(apiErrors).length > 0) {
                        const errorMessages = Object.entries(apiErrors)
                            .map(
                                ([field, messages]) =>
                                    `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`,
                            )
                            .join("\n");
                        showError(
                            `Erreurs de validation:\n${errorMessages}`,
                            6000,
                        );
                    } else if (message) {
                        showError(message, 5000);
                    } else {
                        showError("Vérifiez les données saisies.", 5000);
                    }
                });
        } else {
            // Mode édition: fermer le modal simplement (auto-save gère la sauvegarde)
            console.log("FERMETURE DU MODAL - Mode édition");
            setShowModal(false);
        }
    };

    const validateMember = async (id) => {
        setToggleProcessing(true);
        try {
            const response = await axios.put(
                `/conducteur/members/${id}/validate`,
                {},
            );
            if (response?.data?.success) {
                triggerSuccessNotification(
                    "Membre activé",
                    "Le statut a été mis à jour.",
                );
                router.reload({ only: ["members"] });
            } else {
                alert("Erreur lors de l'activation du membre.");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                "Erreur lors de l'activation du membre.";
            alert(message);
        } finally {
            setToggleProcessing(false);
        }
    };

    const rejectMember = async (id) => {
        setToggleProcessing(true);
        try {
            const response = await axios.put(
                `/conducteur/members/${id}/reject`,
                {},
            );
            if (response?.data?.success) {
                triggerSuccessNotification(
                    "Membre désactivé",
                    "Le statut a été mis à jour.",
                );
                router.reload({ only: ["members"] });
            } else {
                alert("Erreur lors de la désactivation du membre.");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                "Erreur lors de la désactivation du membre.";
            alert(message);
        } finally {
            setToggleProcessing(false);
            setShowDeactivateModal(false);
            setMemberToToggle(null);
        }
    };

    const openDeactivateModal = (member) => {
        setMemberToToggle(member);
        setShowDeactivateModal(true);
    };

    return (
        <>
            <Head title={`Gestion Membres - ${className}`} />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* Notification de succès */}
            <div
                className={`fixed top-6 right-6 z-50 transition-all duration-500 ease-out transform ${
                    showSuccessNotification
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
                aria-live="polite"
            >
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-400 bg-white/10 backdrop-blur-md shadow-lg">
                    <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <Check className="w-5 h-5" />
                    </span>
                    <div className="text-emerald-700 font-medium">
                        <div className="text-sm font-semibold">
                            {successTitle}
                        </div>
                        {successSubtitle ? (
                            <div className="text-xs">{successSubtitle}</div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div
                className="min-h-screen px-4 sm:px-6 lg:px-8 pb-12 font-sans"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full mx-auto py-8 px-2">
                    {/* HEADER */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4 text-white">
                            <Link
                                href={withBasePath("", "/conducteur/dashboard")}
                                className="hover:text-blue-200 transition p-2 bg-white/10 rounded-full"
                            >
                                <X className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">
                                    Membres & Inscriptions
                                </h1>
                                <p className="text-blue-100 opacity-90">
                                    Classe :{" "}
                                    <span className="font-semibold text-yellow-300">
                                        {className}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href={withBasePath(
                                    "",
                                    "/conducteur/members/create",
                                )}
                                className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition transform hover:scale-[1.02] flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" /> Inscrire un membre
                            </Link>
                            <Link
                                href={withBasePath(
                                    "",
                                    "/conducteur/transferts",
                                )}
                                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition transform hover:scale-[1.02] flex items-center gap-2"
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
                                        d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5V21M16.5 12H3"
                                    />
                                </svg>
                                Transferts
                            </Link>
                        </div>
                    </div>

                    {/* STATS RAPIDES (TRANSPARENT DESIGN) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl">
                                <Users />
                            </div>
                            <div>
                                <div className="text-sm opacity-70 uppercase tracking-wider font-medium">
                                    Total Demandes
                                </div>
                                <div className="text-2xl font-bold">
                                    {calculatedStats.total}
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl">
                                <Clock />
                            </div>
                            <div>
                                <div className="text-sm opacity-70 uppercase tracking-wider font-medium">
                                    En attente
                                </div>
                                <div className="text-2xl font-bold">
                                    {calculatedStats.pending}
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl">
                                <Check />
                            </div>
                            <div>
                                <div className="text-sm opacity-70 uppercase tracking-wider font-medium">
                                    Approuvés
                                </div>
                                <div className="text-2xl font-bold">
                                    {calculatedStats.approved}
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl">
                                <X />
                            </div>
                            <div>
                                <div className="text-sm opacity-70 uppercase tracking-wider font-medium">
                                    Rejetés
                                </div>
                                <div className="text-2xl font-bold">
                                    {calculatedStats.rejected}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ONGLETS */}
                    <div className="flex gap-3 mb-8 overflow-x-auto">
                        <button
                            onClick={() => switchTab("pending")}
                            className={`px-6 py-3 rounded-xl font-bold transition transform hover:scale-[1.02] flex items-center gap-2 whitespace-nowrap ${activeTab === "pending" ? "bg-yellow-500 text-white shadow-lg" : "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"}`}
                        >
                            <Clock className="w-5 h-5" /> En attente
                        </button>
                        <button
                            onClick={() => switchTab("approved")}
                            className={`px-6 py-3 rounded-xl font-bold transition transform hover:scale-[1.02] flex items-center gap-2 whitespace-nowrap ${activeTab === "approved" ? "bg-green-500 text-white shadow-lg" : "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"}`}
                        >
                            <Check className="w-5 h-5" /> Approuvé
                        </button>
                        <button
                            onClick={() => switchTab("rejected")}
                            className={`px-6 py-3 rounded-xl font-bold transition transform hover:scale-[1.02] flex items-center gap-2 whitespace-nowrap ${activeTab === "rejected" ? "bg-red-500 text-white shadow-lg" : "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"}`}
                        >
                            <X className="w-5 h-5" /> Refusé
                        </button>
                        <button
                            onClick={() => switchTab("families")}
                            className={`px-6 py-3 rounded-xl font-bold transition transform hover:scale-[1.02] flex items-center gap-2 whitespace-nowrap ${activeTab === "families" ? "bg-blue-500 text-white shadow-lg" : "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"}`}
                        >
                            <Users className="w-5 h-5" /> Famille
                        </button>
                        <button
                            onClick={() => switchTab("members")}
                            className={`px-6 py-3 rounded-xl font-bold transition transform hover:scale-[1.02] flex items-center gap-2 whitespace-nowrap ${activeTab === "members" ? "bg-purple-500 text-white shadow-lg" : "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"}`}
                        >
                            <UserCheck className="w-5 h-5" /> Tous les Membres
                        </button>
                    </div>
                    {/* SECTION RECHERCHE ET FILTRES */}
                    <div className="border-slate-100 mb-8">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                            <div className="relative w-full sm:max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <i className="fas fa-search"></i>
                                </div>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            search: e.target.value,
                                        })
                                    }
                                    className="block w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
                                    placeholder={
                                        activeTab === "members"
                                            ? "Rechercher par nom, prénom, email..."
                                            : "Rechercher un membre..."
                                    }
                                />
                            </div>

                            {/* Filtres pour l'onglet familles */}
                            {activeTab === "families" && (
                                <div className="flex flex-wrap gap-3 items-center">
                                    {/* Bouton ajouter un membre */}
                                    <button
                                        onClick={openCreateModal}
                                        className="px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white transition font-medium whitespace-nowrap flex items-center gap-2"
                                        title="Ajouter un nouveau membre à la famille"
                                    >
                                        <Plus size={18} /> Ajouter un membre
                                    </button>
                                </div>
                            )}

                            {/* Filtres supplémentaires pour l'onglet membres */}
                            {activeTab === "members" && (
                                <div className="flex flex-wrap gap-3 items-center">
                                    {/* Filtre par rôle */}
                                    <div className="min-w-[160px]">
                                        <Select2Single
                                            name="member_role_filter"
                                            value={filters.role}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    role: e.target.value,
                                                })
                                            }
                                            options={MEMBER_ROLE_FILTER_OPTIONS}
                                            placeholder="Tous les roles"
                                            allowClearOption={false}
                                        />
                                    </div>

                                    {/* Filtre par statut */}
                                    <div className="min-w-[160px]">
                                        <Select2Single
                                            name="member_status_filter"
                                            value={filters.status}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    status: e.target.value,
                                                })
                                            }
                                            options={
                                                MEMBER_STATUS_FILTER_OPTIONS
                                            }
                                            placeholder="Tous les statuts"
                                            allowClearOption={false}
                                        />
                                    </div>

                                    {/* Filtre par famille */}
                                    <div className="min-w-[200px]">
                                        <Select2Single
                                            name="member_family_filter"
                                            value={filters.familyFilter}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    familyFilter:
                                                        e.target.value,
                                                })
                                            }
                                            options={familyFilterOptions}
                                            placeholder="Toutes les familles"
                                            disabled={false}
                                            allowClearOption={false}
                                        />
                                    </div>

                                    {/* Bouton reset */}
                                    <button
                                        onClick={resetFilters}
                                        className="px-4 py-3 rounded-xl bg-slate-600 text-white hover:bg-slate-700 transition font-medium whitespace-nowrap"
                                    >
                                        Réinitialiser
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RENDU CONDITIONNEL : TABLEAU DES MEMBRES DE TOUTES LES FAMILLES DU CONDUCTEUR */}
                    {activeTab === "families" ? (
                        // VUE TABLEAU DES MEMBRES - Tous les membres des familles du conducteur
                        (() => {
                            // Filtrer les familles pour n'afficher que celle du conducteur si userFamilyId est disponible
                            const filteredFamiliesList = userFamilyId
                                ? familiesList.filter(
                                      (family) =>
                                          family.familyId === userFamilyId,
                                  )
                                : familiesList;

                            return (
                                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-blue-600 text-white border-b border-slate-200">
                                                <tr>
                                                    <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                        #
                                                    </th>
                                                    <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                        Nom complet
                                                    </th>
                                                    <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                        Famille
                                                    </th>
                                                    <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                        Code Famille
                                                    </th>
                                                    <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                        Code Membre
                                                    </th>
                                                    <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                        Rôle
                                                    </th>
                                                    <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                        Email
                                                    </th>
                                                    <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                        Téléphone
                                                    </th>
                                                    <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                        Statut
                                                    </th>
                                                    <th className="p-5 text-xs font-bold uppercase tracking-wider text-right">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {(() => {
                                                    // Collecter tous les membres des familles filtrées
                                                    let allMembers = [];
                                                    filteredFamiliesList.forEach(
                                                        (family) => {
                                                            // Ajouter le responsable
                                                            if (
                                                                family.responsable
                                                            ) {
                                                                const responsibleMember =
                                                                    family.members?.find(
                                                                        (
                                                                            member,
                                                                        ) =>
                                                                            member.id ===
                                                                            family
                                                                                .responsable
                                                                                ?.id,
                                                                    ) || null;

                                                                allMembers.push(
                                                                    {
                                                                        ...family.responsable,
                                                                        ...responsibleMember,
                                                                        famille_nom:
                                                                            family.nom ||
                                                                            family
                                                                                .responsable
                                                                                .nom,
                                                                        code_famille:
                                                                            family.code_famille,
                                                                        code_membre:
                                                                            family
                                                                                .responsable
                                                                                ?.code_membre ||
                                                                            responsibleMember?.code_membre ||
                                                                            null,
                                                                        is_responsable: true,
                                                                    },
                                                                );
                                                            }
                                                            // Ajouter les autres membres
                                                            if (
                                                                family.members &&
                                                                family.members
                                                                    .length > 0
                                                            ) {
                                                                family.members.forEach(
                                                                    (
                                                                        member,
                                                                    ) => {
                                                                        // Ne pas ajouter deux fois le responsable
                                                                        if (
                                                                            member.id !==
                                                                            family
                                                                                .responsable
                                                                                ?.id
                                                                        ) {
                                                                            allMembers.push(
                                                                                {
                                                                                    ...member,
                                                                                    famille_nom:
                                                                                        family.nom ||
                                                                                        family
                                                                                            .responsable
                                                                                            ?.nom ||
                                                                                        "Famille",
                                                                                    code_famille:
                                                                                        family.code_famille,
                                                                                },
                                                                            );
                                                                        }
                                                                    },
                                                                );
                                                            }
                                                        },
                                                    );

                                                    if (
                                                        allMembers.length === 0
                                                    ) {
                                                        return (
                                                            <tr>
                                                                <td
                                                                    colSpan="10"
                                                                    className="p-12 text-center text-slate-500"
                                                                >
                                                                    <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                                                    <p className="text-lg font-semibold">
                                                                        Aucun
                                                                        membre
                                                                        de
                                                                        famille
                                                                        trouvé
                                                                    </p>
                                                                    <p className="text-sm">
                                                                        Les
                                                                        membres
                                                                        des
                                                                        familles
                                                                        apparaîtront
                                                                        ici
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    // Pagination for families tab
                                                    const totalPagesFamilies =
                                                        Math.ceil(
                                                            allMembers.length /
                                                                ITEMS_PER_PAGE,
                                                        );
                                                    const currentPageFamilies =
                                                        pagination.families;
                                                    const startIndex =
                                                        (currentPageFamilies -
                                                            1) *
                                                        ITEMS_PER_PAGE;
                                                    const endIndex =
                                                        startIndex +
                                                        ITEMS_PER_PAGE;
                                                    const paginatedMembers =
                                                        allMembers.slice(
                                                            startIndex,
                                                            endIndex,
                                                        );

                                                    return paginatedMembers.map(
                                                        (member, idx) => (
                                                            <tr
                                                                key={
                                                                    member.id ||
                                                                    idx
                                                                }
                                                                className={`${member.transfer_locked ? "opacity-60" : "hover:bg-slate-50"} transition`}
                                                            >
                                                                <td className="p-5 text-slate-500 font-mono text-xs">
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="p-5">
                                                                    <div className="flex items-center gap-3">
                                                                        <ProfilePhoto
                                                                            user={{
                                                                                profile_photo_url:
                                                                                    member.profile_photo_url,
                                                                                prenom:
                                                                                    member.prenom ||
                                                                                    member.first_name ||
                                                                                    member.firstName,
                                                                                nom:
                                                                                    member.nom ||
                                                                                    member.last_name ||
                                                                                    member.lastName,
                                                                            }}
                                                                            size="md"
                                                                            rounded={
                                                                                true
                                                                            }
                                                                        />
                                                                        <div className="space-y-1">
                                                                            <div className="font-semibold text-slate-900">
                                                                                {member.prenom ||
                                                                                    member.first_name ||
                                                                                    member.firstName}{" "}
                                                                                {member.nom ||
                                                                                    member.last_name ||
                                                                                    member.lastName}
                                                                            </div>
                                                                            {renderTransferBadge(
                                                                                member,
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-5 text-slate-600">
                                                                    <div className="flex items-center gap-2">
                                                                        <Users className="w-4 h-4 text-blue-500" />
                                                                        <span>
                                                                            {member.famille_nom ||
                                                                                "Famille"}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-5 text-slate-600">
                                                                    <div className="flex flex-col gap-1">
                                                                        {getFamilyCodeHistory(
                                                                            member,
                                                                        )
                                                                            .slice(
                                                                                0,
                                                                                2,
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    code,
                                                                                    codeIndex,
                                                                                ) => (
                                                                                    <span
                                                                                        key={`${member.id}-family-code-${codeIndex}`}
                                                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700"
                                                                                    >
                                                                                        {codeIndex ===
                                                                                            0 &&
                                                                                        getFamilyCodeHistory(
                                                                                            member,
                                                                                        )
                                                                                            .length >
                                                                                            1
                                                                                            ? "Ancienne: "
                                                                                            : codeIndex ===
                                                                                                1
                                                                                              ? "Nouvelle: "
                                                                                              : ""}
                                                                                        {
                                                                                            code
                                                                                        }
                                                                                    </span>
                                                                                ),
                                                                            )}
                                                                        {getFamilyCodeHistory(
                                                                            member,
                                                                        )
                                                                            .length ===
                                                                            0 && (
                                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
                                                                                N/A
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="p-5 text-slate-600">
                                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
                                                                        {member.code_membre ||
                                                                            "N/A"}
                                                                    </span>
                                                                </td>
                                                                <td className="p-5">
                                                                    <span
                                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                            member.is_responsable ||
                                                                            member.responsable_famille ||
                                                                            member.is_family_responsible
                                                                                ? "bg-blue-100 text-blue-700"
                                                                                : member.role ===
                                                                                    "conducteur"
                                                                                  ? "bg-purple-100 text-purple-700"
                                                                                  : "bg-green-100 text-green-700"
                                                                        }`}
                                                                    >
                                                                        {member.is_responsable ||
                                                                        member.responsable_famille ||
                                                                        member.is_family_responsible
                                                                            ? "Responsable"
                                                                            : member.role ===
                                                                                "conducteur"
                                                                              ? "Conducteur"
                                                                              : member.role ||
                                                                                "Membre"}
                                                                    </span>
                                                                </td>
                                                                <td className="p-5 text-slate-600">
                                                                    {member.email ||
                                                                        "N/A"}
                                                                </td>
                                                                <td className="p-5 text-slate-600">
                                                                    {member.phone ||
                                                                        member.telephone ||
                                                                        "N/A"}
                                                                </td>
                                                                <td className="p-5">
                                                                    <span
                                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                            member.status ===
                                                                            "actif"
                                                                                ? "bg-green-100 text-green-800"
                                                                                : member.status ===
                                                                                    "inactif"
                                                                                  ? "bg-red-100 text-red-800"
                                                                                  : "bg-gray-100 text-gray-700"
                                                                        }`}
                                                                    >
                                                                        {member.status ===
                                                                        "actif"
                                                                            ? "Actif"
                                                                            : member.status ===
                                                                                "inactif"
                                                                              ? "Inactif"
                                                                              : "Actif"}
                                                                    </span>
                                                                </td>
                                                                <td className="p-5 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <button
                                                                            type="button"
                                                                            title="Voir les détails"
                                                                            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition transform hover:scale-105"
                                                                            onClick={() => {
                                                                                openMemberModal(
                                                                                    member,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Eye
                                                                                size={
                                                                                    18
                                                                                }
                                                                            />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            title="Modifier"
                                                                            disabled={
                                                                                member.transfer_locked
                                                                            }
                                                                            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                                                                            onClick={() => {
                                                                                if (
                                                                                    member.transfer_locked
                                                                                )
                                                                                    return;
                                                                                openEditModal(
                                                                                    member,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Edit
                                                                                size={
                                                                                    18
                                                                                }
                                                                            />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    );
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-sm text-slate-500">
                                        <span>
                                            {(() => {
                                                let count = 0;
                                                filteredFamiliesList.forEach(
                                                    (family) => {
                                                        count +=
                                                            (family.members
                                                                ?.length || 0) +
                                                            (family.responsable
                                                                ? 1
                                                                : 0);
                                                    },
                                                );
                                                return count;
                                            })()}{" "}
                                            membre(s) au total
                                        </span>
                                    </div>
                                    {/* Pagination for families tab */}
                                    {(() => {
                                        let count = 0;
                                        filteredFamiliesList.forEach(
                                            (family) => {
                                                count +=
                                                    (family.members?.length ||
                                                        0) +
                                                    (family.responsable
                                                        ? 1
                                                        : 0);
                                            },
                                        );
                                        const totalPagesFamilies = Math.ceil(
                                            count / ITEMS_PER_PAGE,
                                        );
                                        return (
                                            <PaginationControls
                                                currentPage={
                                                    pagination.families
                                                }
                                                totalPages={totalPagesFamilies}
                                                onPrevious={() =>
                                                    handlePaginationChange(
                                                        "families",
                                                        Math.max(
                                                            1,
                                                            pagination.families -
                                                                1,
                                                        ),
                                                    )
                                                }
                                                onNext={() =>
                                                    handlePaginationChange(
                                                        "families",
                                                        Math.min(
                                                            totalPagesFamilies,
                                                            pagination.families +
                                                                1,
                                                        ),
                                                    )
                                                }
                                                itemsCount={count}
                                                itemsPerPage={ITEMS_PER_PAGE}
                                            />
                                        );
                                    })()}
                                </div>
                            );
                        })()
                    ) : activeTab === "members" ? (
                        // TABLEAU DE TOUS LES MEMBRES CRÉÉS
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-blue-600 text-white border-b border-slate-200">
                                        <tr>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                N°
                                            </th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                Nom
                                            </th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                Famille
                                            </th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                Code Famille
                                            </th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                Téléphone
                                            </th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                Rôle
                                            </th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                Statut
                                            </th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                Date Naissance
                                            </th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                Date Création
                                            </th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider">
                                                Date Modification
                                            </th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredItems.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="12"
                                                    className="p-12 text-center text-slate-500"
                                                >
                                                    Aucun membre créé.
                                                </td>
                                            </tr>
                                        ) : (
                                            (() => {
                                                // Pagination for members tab
                                                const totalPagesMembers =
                                                    Math.ceil(
                                                        filteredItems.length /
                                                            ITEMS_PER_PAGE,
                                                    );
                                                const currentPageMembers =
                                                    pagination.members;
                                                const startIndex =
                                                    (currentPageMembers - 1) *
                                                    ITEMS_PER_PAGE;
                                                const endIndex =
                                                    startIndex + ITEMS_PER_PAGE;
                                                const paginatedItems =
                                                    filteredItems.slice(
                                                        startIndex,
                                                        endIndex,
                                                    );

                                                return paginatedItems.map(
                                                    (member, idx) => {
                                                        // Trouver la famille du membre
                                                        const memberFamily =
                                                            familiesList.find(
                                                                (f) =>
                                                                    f.members &&
                                                                    f.members.some(
                                                                        (m) =>
                                                                            m.id ===
                                                                            member.id,
                                                                    ),
                                                            );

                                                        return (
                                                            <tr
                                                                key={member.id}
                                                                className={`${member.transfer_locked ? "opacity-60" : "hover:bg-slate-50"} transition`}
                                                            >
                                                                <td className="p-5 text-slate-500 font-mono text-xs">
                                                                    {startIndex +
                                                                        idx +
                                                                        1}
                                                                </td>
                                                                <td className="p-5">
                                                                    <div className="flex items-center gap-3">
                                                                        <ProfilePhoto
                                                                            user={{
                                                                                profile_photo_url:
                                                                                    member.profile_photo_url,
                                                                                prenom: member.prenom,
                                                                                nom: member.nom,
                                                                            }}
                                                                            size="md"
                                                                            rounded={
                                                                                true
                                                                            }
                                                                        />
                                                                        <div className="space-y-1">
                                                                            <div className="font-semibold text-slate-900">
                                                                                {
                                                                                    member.prenom
                                                                                }{" "}
                                                                                {
                                                                                    member.nom
                                                                                }
                                                                            </div>
                                                                            {renderTransferBadge(
                                                                                member,
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-5 text-slate-600">
                                                                    {memberFamily
                                                                        ? memberFamily.nom
                                                                        : member.famille_id
                                                                          ? `Famille #${member.famille_id}`
                                                                          : "Aucune famille"}
                                                                </td>
                                                                <td className="p-5 text-slate-600">
                                                                    <div className="flex flex-col gap-1">
                                                                        {(getFamilyCodeHistory(
                                                                            member,
                                                                        )
                                                                            .length >
                                                                        0
                                                                            ? getFamilyCodeHistory(
                                                                                  member,
                                                                              )
                                                                            : memberFamily?.code_famille
                                                                              ? [
                                                                                    memberFamily.code_famille,
                                                                                ]
                                                                              : []
                                                                        )
                                                                            .slice(
                                                                                0,
                                                                                2,
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    code,
                                                                                    codeIndex,
                                                                                ) => (
                                                                                    <span
                                                                                        key={`${member.id}-summary-family-code-${codeIndex}`}
                                                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700"
                                                                                    >
                                                                                        {codeIndex ===
                                                                                            0 &&
                                                                                        getFamilyCodeHistory(
                                                                                            member,
                                                                                        )
                                                                                            .length >
                                                                                            1
                                                                                            ? "Ancienne: "
                                                                                            : codeIndex ===
                                                                                                1
                                                                                              ? "Nouvelle: "
                                                                                              : ""}
                                                                                        {
                                                                                            code
                                                                                        }
                                                                                    </span>
                                                                                ),
                                                                            )}
                                                                        {getFamilyCodeHistory(
                                                                            member,
                                                                        )
                                                                            .length ===
                                                                            0 &&
                                                                            !memberFamily?.code_famille && (
                                                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
                                                                                    N/A
                                                                                </span>
                                                                            )}
                                                                    </div>
                                                                </td>
                                                                <td className="p-5 text-slate-600">
                                                                    {
                                                                        member.email
                                                                    }
                                                                </td>
                                                                <td className="p-5 text-slate-600">
                                                                    {member.phone ||
                                                                        "N/A"}
                                                                </td>
                                                                <td className="p-5">
                                                                    <span
                                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                            member.role ===
                                                                            "responsable_famille"
                                                                                ? "bg-blue-100 text-blue-700"
                                                                                : member.role ===
                                                                                    "membre_famille"
                                                                                  ? "bg-green-100 text-green-700"
                                                                                  : "bg-gray-100 text-gray-700"
                                                                        }`}
                                                                    >
                                                                        {member.role ===
                                                                        "responsable_famille"
                                                                            ? "Responsable"
                                                                            : member.role ===
                                                                                "membre_famille"
                                                                              ? "Membre"
                                                                              : member.role ||
                                                                                "Membre"}
                                                                    </span>
                                                                </td>
                                                                <td className="p-5">
                                                                    <span
                                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                            member.status ===
                                                                            "actif"
                                                                                ? "bg-green-100 text-green-800"
                                                                                : member.status ===
                                                                                    "inactif"
                                                                                  ? "bg-red-100 text-red-800"
                                                                                  : "bg-gray-100 text-gray-700"
                                                                        }`}
                                                                    >
                                                                        {member.status ===
                                                                        "actif"
                                                                            ? "Actif"
                                                                            : member.status ===
                                                                                "inactif"
                                                                              ? "Inactif"
                                                                              : member.status ||
                                                                                "Actif"}
                                                                    </span>
                                                                </td>
                                                                <td className="p-5 text-slate-600 text-sm">
                                                                    {formatDateDisplay(
                                                                        member.date_naissance,
                                                                        "N/A",
                                                                    )}
                                                                </td>
                                                                <td className="p-5 text-slate-600 text-sm">
                                                                    {formatDateDisplay(
                                                                        member.created_at,
                                                                        "N/A",
                                                                    )}
                                                                </td>
                                                                <td className="p-5 text-slate-600 text-sm">
                                                                    {formatDateDisplay(
                                                                        member.updated_at ||
                                                                            member.created_at,
                                                                        "N/A",
                                                                    )}
                                                                </td>
                                                                <td className="p-5">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <button
                                                                            type="button"
                                                                            title="Voir les détails"
                                                                            className="p-2 rounded-lg transition-all"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    "rgba(37, 99, 235, 0.1)",
                                                                                border: "2px solid rgba(37, 99, 235, 0.2)",
                                                                            }}
                                                                            onClick={() => {
                                                                                openMemberModal(
                                                                                    member,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Eye className="w-5 h-5 text-blue-600" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            title="Modifier"
                                                                            className="p-2 rounded-lg transition-all"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    "rgba(37, 99, 235, 0.1)",
                                                                                border: "2px solid rgba(37, 99, 235, 0.2)",
                                                                            }}
                                                                            disabled={
                                                                                member.transfer_locked
                                                                            }
                                                                            onClick={() => {
                                                                                if (
                                                                                    member.transfer_locked
                                                                                )
                                                                                    return;
                                                                                console.log(
                                                                                    "Modifier clicked for member:",
                                                                                    member,
                                                                                );
                                                                                openEditModal(
                                                                                    member,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Edit className="w-5 h-5 text-blue-600" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            title={
                                                                                member.status ===
                                                                                "actif"
                                                                                    ? "Désactiver"
                                                                                    : "Activer"
                                                                            }
                                                                            className="p-2 rounded-lg transition-all"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    member.status ===
                                                                                    "actif"
                                                                                        ? "rgba(22, 163, 74, 0.1)"
                                                                                        : "rgba(220, 38, 38, 0.1)",
                                                                                border:
                                                                                    member.status ===
                                                                                    "actif"
                                                                                        ? "2px solid rgba(22, 163, 74, 0.2)"
                                                                                        : "2px solid rgba(220, 38, 38, 0.2)",
                                                                            }}
                                                                            disabled={
                                                                                member.transfer_locked
                                                                            }
                                                                            onClick={() => {
                                                                                if (
                                                                                    member.transfer_locked
                                                                                )
                                                                                    return;
                                                                                if (
                                                                                    member.status ===
                                                                                    "actif"
                                                                                ) {
                                                                                    openDeactivateModal(
                                                                                        member,
                                                                                    );
                                                                                } else {
                                                                                    validateMember(
                                                                                        member.id,
                                                                                    );
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Power
                                                                                className={`w-5 h-5 ${member.status === "actif" ? "text-green-600" : "text-red-600"}`}
                                                                            />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            title="Supprimer"
                                                                            className="p-2 rounded-lg transition-all"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    "rgba(220, 38, 38, 0.1)",
                                                                                border: "2px solid rgba(220, 38, 38, 0.2)",
                                                                            }}
                                                                            disabled={
                                                                                member.transfer_locked
                                                                            }
                                                                            onClick={() => {
                                                                                if (
                                                                                    member.transfer_locked
                                                                                )
                                                                                    return;

                                                                                handleDelete(
                                                                                    member.id,
                                                                                    "member",
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Trash2 className="w-5 h-5 text-red-600" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                );
                                            })()
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination for members tab */}
                            <PaginationControls
                                currentPage={pagination.members}
                                totalPages={Math.ceil(
                                    filteredItems.length / ITEMS_PER_PAGE,
                                )}
                                onPrevious={() =>
                                    handlePaginationChange(
                                        "members",
                                        Math.max(1, pagination.members - 1),
                                    )
                                }
                                onNext={() =>
                                    handlePaginationChange(
                                        "members",
                                        Math.min(
                                            Math.ceil(
                                                filteredItems.length /
                                                    ITEMS_PER_PAGE,
                                            ),
                                            pagination.members + 1,
                                        ),
                                    )
                                }
                                itemsCount={filteredItems.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />
                        </div>
                    ) : (
                        // TABLEAU DES INSCRIPTIONS (pending, approved, rejected)
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead
                                        className={`${tableHeaderClass} border-b border-slate-200`}
                                    >
                                        <tr>
                                            <th className="p-6 text-sm font-bold uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="p-6 text-sm font-bold uppercase tracking-wider">
                                                Prénom et Nom
                                            </th>
                                            <th className="p-6 text-sm font-bold uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="p-6 text-sm font-bold uppercase tracking-wider">
                                                Date Naissance
                                            </th>
                                            <th className="p-6 text-sm font-bold uppercase tracking-wider">
                                                Fonction
                                            </th>
                                            <th className="p-6 text-sm font-bold uppercase tracking-wider">
                                                Rôle
                                            </th>
                                            <th className="p-6 text-sm font-bold uppercase tracking-wider">
                                                Code Membre
                                            </th>
                                            <th className="p-6 text-sm font-bold uppercase tracking-wider">
                                                Date de création
                                            </th>
                                            <th className="p-6 text-sm font-bold uppercase tracking-wider">
                                                {activeTab === "rejected"
                                                    ? "Refusé par"
                                                    : "Approuvé par"}
                                            </th>
                                            <th className="p-6 text-sm font-bold uppercase tracking-wider text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredItems.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="10"
                                                    className="p-12 text-center text-slate-500"
                                                >
                                                    Aucun résultat.
                                                </td>
                                            </tr>
                                        ) : (
                                            (() => {
                                                // Pagination for inscriptions tab
                                                const totalPagesInscriptions =
                                                    Math.ceil(
                                                        filteredItems.length /
                                                            ITEMS_PER_PAGE,
                                                    );
                                                const currentPageInscriptions =
                                                    activeTab === "pending"
                                                        ? pagination.pending
                                                        : activeTab ===
                                                            "approved"
                                                          ? pagination.approved
                                                          : pagination.rejected;
                                                const startIndex =
                                                    (currentPageInscriptions -
                                                        1) *
                                                    ITEMS_PER_PAGE;
                                                const endIndex =
                                                    startIndex + ITEMS_PER_PAGE;
                                                const paginatedItems =
                                                    filteredItems.slice(
                                                        startIndex,
                                                        endIndex,
                                                    );

                                                return paginatedItems.map(
                                                    (item) => (
                                                        <tr
                                                            key={`${item.kind}-${item.id}`}
                                                            className="hover:bg-slate-50 transition"
                                                        >
                                                            <td className="p-6">
                                                                <span
                                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                                        item.kind ===
                                                                        "inscription"
                                                                            ? item.inscriptionType ===
                                                                              "famille"
                                                                                ? "bg-purple-100 text-purple-800"
                                                                                : "bg-blue-100 text-blue-800"
                                                                            : "bg-green-100 text-green-800"
                                                                    }`}
                                                                >
                                                                    {item.kind ===
                                                                    "inscription"
                                                                        ? item.inscriptionType ===
                                                                          "famille"
                                                                            ? "Famille"
                                                                            : "Inscription"
                                                                        : "Membre"}
                                                                </span>
                                                            </td>
                                                            <td className="p-6">
                                                                <div className="flex items-center gap-4">
                                                                    <ProfilePhoto
                                                                        user={{
                                                                            profile_photo_url:
                                                                                item.profile_photo_url,
                                                                            prenom: item.prenom,
                                                                            nom: item.nom,
                                                                        }}
                                                                        size="lg"
                                                                        rounded={
                                                                            true
                                                                        }
                                                                    />
                                                                    <div>
                                                                        <div className="font-bold text-slate-900 text-base">
                                                                            {
                                                                                item.nom
                                                                            }{" "}
                                                                            {
                                                                                item.prenom
                                                                            }
                                                                        </div>
                                                                        <div className="text-xs text-slate-500 font-medium">
                                                                            ID:
                                                                            #
                                                                            {
                                                                                item.id
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-6 text-sm text-slate-600">
                                                                <div className="font-medium text-slate-800">
                                                                    {item.email}
                                                                </div>
                                                                <div className="text-xs text-slate-500 mt-0.5">
                                                                    {item.phone}
                                                                </div>
                                                            </td>
                                                            <td className="p-6 text-sm text-slate-600">
                                                                {item.date_naissance
                                                                    ? formatDateDisplay(
                                                                          item.date_naissance,
                                                                          "N/A",
                                                                      )
                                                                    : "N/A"}
                                                            </td>
                                                            <td className="p-6 text-sm text-slate-600">
                                                                {item.fonction_professionnelle ||
                                                                    "N/A"}
                                                            </td>
                                                            <td className="p-6">
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                                    {item.type ===
                                                                    "famille"
                                                                        ? "Responsable"
                                                                        : item.type ===
                                                                            "conducteur"
                                                                          ? "Conducteur"
                                                                          : item.role}
                                                                </span>
                                                            </td>
                                                            <td className="p-6 text-slate-600">
                                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
                                                                    {item.code_membre ||
                                                                        "N/A"}
                                                                </span>
                                                            </td>
                                                            <td className="p-6 text-sm text-slate-600">
                                                                {formatDateDisplay(
                                                                    item.created_at,
                                                                    "N/A",
                                                                )}
                                                            </td>
                                                            <td className="p-6 text-sm">
                                                                {activeTab ===
                                                                "approved" ? (
                                                                    <div className="space-y-2">
                                                                        {item.conducteur_approved &&
                                                                            item.conducteur_name && (
                                                                                <div className="text-center">
                                                                                    <div className="font-bold text-slate-900 text-sm">
                                                                                        {
                                                                                            item.conducteur_name
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-xs text-blue-600">
                                                                                        Conducteur
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        {item.admin_approved &&
                                                                            item.admin_name && (
                                                                                <div className="text-center">
                                                                                    <div className="font-bold text-slate-900 text-sm">
                                                                                        {
                                                                                            item.admin_name
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-xs text-purple-600">
                                                                                        Admin
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        {!item.conducteur_approved &&
                                                                            !item.admin_approved && (
                                                                                <div className="text-slate-400 italic text-xs text-center">
                                                                                    -
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                ) : activeTab ===
                                                                  "rejected" ? (
                                                                    <div className="space-y-2">
                                                                        {item.conducteur_id &&
                                                                            item.conducteur_name && (
                                                                                <div className="text-center">
                                                                                    <div className="font-bold text-slate-900 text-sm">
                                                                                        {
                                                                                            item.conducteur_name
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-xs text-blue-600">
                                                                                        Conducteur
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        {item.admin_id &&
                                                                            item.admin_name && (
                                                                                <div className="text-center">
                                                                                    <div className="font-bold text-slate-900 text-sm">
                                                                                        {
                                                                                            item.admin_name
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-xs text-purple-600">
                                                                                        Admin
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        {!item.conducteur_id &&
                                                                            !item.admin_id && (
                                                                                <div className="text-slate-400 italic text-xs text-center">
                                                                                    -
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        {item.conducteur_approved &&
                                                                            item.conducteur_name && (
                                                                                <div className="text-center">
                                                                                    <div className="font-bold text-slate-900 text-sm">
                                                                                        {
                                                                                            item.conducteur_name
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-xs text-blue-600">
                                                                                        Conducteur
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        {item.admin_approved &&
                                                                            item.admin_name && (
                                                                                <div className="text-center">
                                                                                    <div className="font-bold text-slate-900 text-sm">
                                                                                        {
                                                                                            item.admin_name
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-xs text-purple-600">
                                                                                        Admin
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        {!item.conducteur_approved &&
                                                                            !item.admin_approved && (
                                                                                <span className="text-slate-400 italic">
                                                                                    -
                                                                                </span>
                                                                            )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="p-6 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() =>
                                                                            openDetailModal(
                                                                                item,
                                                                            )
                                                                        }
                                                                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition"
                                                                        title="Voir les détails"
                                                                    >
                                                                        Détails
                                                                    </button>
                                                                    {activeTab ===
                                                                        "pending" && (
                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                onClick={() =>
                                                                                    approveInscription(
                                                                                        item.id,
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    approvingId ===
                                                                                    item.id
                                                                                }
                                                                                className="px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition disabled:opacity-50"
                                                                                title="Approuver"
                                                                            >
                                                                                {approvingId ===
                                                                                item.id
                                                                                    ? "..."
                                                                                    : "Valider"}
                                                                            </button>
                                                                            <button
                                                                                onClick={() =>
                                                                                    rejectInscription(
                                                                                        item.id,
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    rejectingId ===
                                                                                    item.id
                                                                                }
                                                                                className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition disabled:opacity-50"
                                                                                title="Rejeter"
                                                                            >
                                                                                {rejectingId ===
                                                                                item.id
                                                                                    ? "..."
                                                                                    : "Refuser"}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ),
                                                );
                                            })()
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination for inscriptions tab */}
                            {(() => {
                                const totalPagesInscriptions = Math.ceil(
                                    filteredItems.length / ITEMS_PER_PAGE,
                                );
                                const currentPageInscriptions =
                                    activeTab === "pending"
                                        ? pagination.pending
                                        : activeTab === "approved"
                                          ? pagination.approved
                                          : pagination.rejected;
                                const tabKey =
                                    activeTab === "pending"
                                        ? "pending"
                                        : activeTab === "approved"
                                          ? "approved"
                                          : "rejected";
                                return (
                                    <PaginationControls
                                        currentPage={currentPageInscriptions}
                                        totalPages={totalPagesInscriptions}
                                        onPrevious={() =>
                                            handlePaginationChange(
                                                tabKey,
                                                Math.max(
                                                    1,
                                                    currentPageInscriptions - 1,
                                                ),
                                            )
                                        }
                                        onNext={() =>
                                            handlePaginationChange(
                                                tabKey,
                                                Math.min(
                                                    totalPagesInscriptions,
                                                    currentPageInscriptions + 1,
                                                ),
                                            )
                                        }
                                        itemsCount={filteredItems.length}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                    />
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* MODAL AJOUT / EDITION */}
                {console.log("showModal state:", showModal) ||
                    (showModal && (
                        <div
                            className="fixed inset-0 z-[60] flex items-center justify-center"
                            aria-labelledby="modal-title"
                            role="dialog"
                            aria-modal="true"
                        >
                            <div
                                className="fixed inset-0 bg-slate-900/90 transition-opacity"
                                onClick={() => setShowModal(false)}
                            ></div>
                            <div className="relative z-50 max-h-[90vh] overflow-y-auto bg-white rounded-3xl text-left shadow-2xl transform transition-all w-full max-w-7xl mx-2">
                                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <h2
                                            className="text-2xl font-bold text-slate-900"
                                            id="modal-title"
                                        >
                                            {modalMode === "create"
                                                ? "Nouveau Membre"
                                                : "Modifier le Membre"}
                                        </h2>
                                        {/* Toast notification de sauvegarde */}
                                        {saveNotification.show && (
                                            <div className="px-4 py-2 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm font-semibold flex items-center gap-2 animate-pulse">
                                                <Check className="w-4 h-4" />
                                                {saveNotification.message}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-slate-400 hover:text-red-500 transition p-2 rounded-full hover:bg-red-50"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="p-8">
                                    <form
                                        onSubmit={handleSubmit}
                                        encType="multipart/form-data"
                                        className="space-y-8"
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
                                                                            data.photoPreview
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
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const file =
                                                                        e.target
                                                                            .files &&
                                                                        e.target
                                                                            .files[0];
                                                                    if (file) {
                                                                        const preview =
                                                                            URL.createObjectURL(
                                                                                file,
                                                                            );
                                                                        if (
                                                                            data.photoPreview
                                                                        ) {
                                                                            URL.revokeObjectURL(
                                                                                data.photoPreview,
                                                                            );
                                                                        }
                                                                        setData(
                                                                            {
                                                                                ...data,
                                                                                photo: file,
                                                                                photoPreview:
                                                                                    preview,
                                                                            },
                                                                        );
                                                                    }
                                                                }}
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
                                                                ref={nomRef}
                                                                className={`w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 uppercase ${
                                                                    fieldErrors.nom
                                                                        ? "border-red-500 focus:border-red-500"
                                                                        : "border-gray-300 focus:border-blue-500"
                                                                }`}
                                                                value={data.nom}
                                                                onChange={(e) =>
                                                                    setData({
                                                                        ...data,
                                                                        nom: e.target.value.toUpperCase(),
                                                                    })
                                                                }
                                                                placeholder="ex: DUPONT"
                                                            />
                                                            {(fieldErrors.nom ||
                                                                errors.nom) && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {fieldErrors.nom ||
                                                                        errors.nom}
                                                                </p>
                                                            )}
                                                        </FormField>
                                                        <FormField
                                                            label="Prénom"
                                                            icon={User}
                                                            required
                                                        >
                                                            <input
                                                                ref={prenomRef}
                                                                className={`w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 capitalize ${
                                                                    fieldErrors.prenom
                                                                        ? "border-red-500 focus:border-red-500"
                                                                        : "border-gray-300 focus:border-blue-500"
                                                                }`}
                                                                value={
                                                                    data.prenom
                                                                }
                                                                onChange={(e) =>
                                                                    setData({
                                                                        ...data,
                                                                        prenom: sanitizeUppercasePrenom(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                    })
                                                                }
                                                                placeholder="ex: Jean"
                                                            />
                                                            {(fieldErrors.prenom ||
                                                                errors.prenom) && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {fieldErrors.prenom ||
                                                                        errors.prenom}
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
                                                                value={
                                                                    data.genre
                                                                }
                                                                onChange={(e) =>
                                                                    setData({
                                                                        ...data,
                                                                        genre: e
                                                                            .target
                                                                            .value,
                                                                    })
                                                                }
                                                                options={
                                                                    GENDER_OPTIONS
                                                                }
                                                                placeholder="Selectionner..."
                                                                hasError={
                                                                    !!fieldErrors.genre
                                                                }
                                                                allowClearOption={
                                                                    false
                                                                }
                                                            />
                                                            {fieldErrors.genre && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {
                                                                        fieldErrors.genre
                                                                    }
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
                                                                value={
                                                                    data.date_naissance
                                                                }
                                                                onChange={(e) =>
                                                                    setData({
                                                                        ...data,
                                                                        date_naissance:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                }
                                                            />
                                                            {(fieldErrors.date_naissance ||
                                                                errors.date_naissance) && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {fieldErrors.date_naissance ||
                                                                        errors.date_naissance}
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
                                                        <FormField
                                                            label="Email"
                                                            icon={Mail}
                                                        >
                                                            <div className="relative">
                                                                <input
                                                                    ref={emailRef}
                                                                    type="email"
                                                                    className={`w-full h-12 border rounded-lg px-4 pr-10 outline-none focus:shadow-md transition-all duration-300 ${
                                                                        emailTaken
                                                                            ? "border-red-500 focus:border-red-500 bg-red-50"
                                                                            : fieldErrors.email
                                                                            ? "border-red-500 focus:border-red-500"
                                                                            : "border-gray-300 focus:border-blue-500 focus:shadow-blue-200"
                                                                    }`}
                                                                    value={data.email}
                                                                    onChange={(e) =>
                                                                        setData({
                                                                            ...data,
                                                                            email: e.target.value,
                                                                        })
                                                                    }
                                                                    placeholder="ex: jean.dupont@gmail.com"
                                                                />
                                                                {emailChecking && (
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs animate-pulse">
                                                                        ⏳
                                                                    </span>
                                                                )}
                                                                {!emailChecking && data.email?.trim() && !emailTaken && (
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">✓</span>
                                                                )}
                                                                {!emailChecking && emailTaken && (
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm font-bold">✗</span>
                                                                )}
                                                            </div>
                                                            {emailTaken && (
                                                                <p className="text-red-600 text-xs mt-1 font-medium">
                                                                    ⚠ Cette adresse email est déjà utilisée. Veuillez en saisir une autre.
                                                                </p>
                                                            )}
                                                            {!emailTaken && (fieldErrors.email || errors.email) && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {fieldErrors.email || errors.email}
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
                                                                    value={
                                                                        data.telephone
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setData(
                                                                            {
                                                                                ...data,
                                                                                telephone:
                                                                                    e.target.value
                                                                                        .replace(
                                                                                            /\D/g,
                                                                                            "",
                                                                                        )
                                                                                        .substring(
                                                                                            0,
                                                                                            10,
                                                                                        ),
                                                                            },
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
                                                            label="Statut d'emploi"
                                                            icon={Briefcase}
                                                        >
                                                            <select
                                                                className="w-full h-12 border border-gray-300 rounded-lg px-4 outline-none focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300 bg-white"
                                                                value={
                                                                    data.employment_status ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    setData({
                                                                        ...data,
                                                                        employment_status:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                }
                                                            >
                                                                <option value="">
                                                                    Non
                                                                    renseigné
                                                                </option>
                                                                {EMPLOYMENT_STATUS_OPTIONS.map(
                                                                    (
                                                                        option,
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                option.value
                                                                            }
                                                                            value={
                                                                                option.value
                                                                            }
                                                                        >
                                                                            {
                                                                                option.label
                                                                            }
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                            {(fieldErrors.employment_status ||
                                                                errors.employment_status) && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {fieldErrors.employment_status ||
                                                                        errors.employment_status}
                                                                </p>
                                                            )}
                                                        </FormField>
                                                        <FormField
                                                            label="Profession"
                                                            icon={Briefcase}
                                                            required
                                                        >
                                                            <input
                                                                className={`w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 ${
                                                                    fieldErrors.profession_detail ||
                                                                    fieldErrors.profession
                                                                        ? "border-red-500 focus:border-red-500"
                                                                        : "border-gray-300 focus:border-blue-500"
                                                                }`}
                                                                value={
                                                                    data.profession_detail
                                                                }
                                                                onChange={(e) =>
                                                                    setData({
                                                                        ...data,
                                                                        profession_detail:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        profession:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                }
                                                                placeholder="ex: Enseignant, Commerçant"
                                                            />
                                                            {(fieldErrors.profession_detail ||
                                                                errors.profession_detail ||
                                                                fieldErrors.profession ||
                                                                errors.profession) && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {fieldErrors.profession_detail ||
                                                                        errors.profession_detail ||
                                                                        fieldErrors.profession ||
                                                                        errors.profession}
                                                                </p>
                                                            )}
                                                        </FormField>
                                                        <FormField
                                                            label="Fonctions dans l'eglise (max 2)"
                                                            icon={Users}
                                                            required
                                                        >
                                                            <Select2Fonction
                                                                value={
                                                                    Array.isArray(
                                                                        data.fonction_ids,
                                                                    ) &&
                                                                    data
                                                                        .fonction_ids
                                                                        .length >
                                                                        0
                                                                        ? data.fonction_ids
                                                                        : data.fonction_id
                                                                          ? [
                                                                                data.fonction_id,
                                                                            ]
                                                                          : []
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const values =
                                                                        Array.isArray(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                            ? e
                                                                                  .target
                                                                                  .value
                                                                            : [];
                                                                    setData({
                                                                        ...data,
                                                                        fonction_ids:
                                                                            values.map(
                                                                                (
                                                                                    value,
                                                                                ) =>
                                                                                    String(
                                                                                        value,
                                                                                    ),
                                                                            ),
                                                                        fonction_id:
                                                                            values.length >
                                                                            0
                                                                                ? String(
                                                                                      values[0],
                                                                                  )
                                                                                : "",
                                                                    });
                                                                }}
                                                                maxSelections={
                                                                    10
                                                                }
                                                                name="fonction_ids"
                                                                options={
                                                                    fonctions
                                                                }
                                                                placeholder="Selectionner 1 ou 2 fonctions"
                                                            />
                                                            {(fieldErrors.fonction_ids ||
                                                                errors.fonction_ids ||
                                                                fieldErrors.fonction_id ||
                                                                errors.fonction_id) && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {fieldErrors.fonction_ids ||
                                                                        errors.fonction_ids ||
                                                                        fieldErrors.fonction_id ||
                                                                        errors.fonction_id}
                                                                </p>
                                                            )}
                                                        </FormField>
                                                        <FormField
                                                            label="Relation de Famille"
                                                            icon={Users}
                                                        >
                                                            <Select2Single
                                                                name="relation"
                                                                value={
                                                                    data.relation
                                                                }
                                                                onChange={(e) =>
                                                                    setData({
                                                                        ...data,
                                                                        relation:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                }
                                                                options={
                                                                    relationOptions
                                                                }
                                                                placeholder="Non renseigné"
                                                            />
                                                            {errors.relation && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {
                                                                        errors.relation
                                                                    }
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
                                                                value={
                                                                    data.statut_marital
                                                                }
                                                                onChange={(e) =>
                                                                    setData({
                                                                        ...data,
                                                                        statut_marital:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                }
                                                                options={
                                                                    MEMBER_MARITAL_STATUS_OPTIONS
                                                                }
                                                                placeholder="Non renseigné"
                                                            />
                                                            {errors.statut_marital && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {
                                                                        errors.statut_marital
                                                                    }
                                                                </p>
                                                            )}
                                                        </FormField>

                                                        {data.statut_marital &&
                                                            data.statut_marital !==
                                                                "Célibataire" && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                                    <FormField
                                                                        label={
                                                                            data.statut_marital ===
                                                                            "Dote"
                                                                                ? "Date Dot"
                                                                                : data.statut_marital ===
                                                                                    "Divorcé(e)"
                                                                                  ? "Date du Divorce"
                                                                                  : data.statut_marital ===
                                                                                      "Veuf(ve)"
                                                                                    ? "Date du Décès"
                                                                                    : "Date Mariage"
                                                                        }
                                                                        icon={
                                                                            Calendar
                                                                        }
                                                                        required
                                                                    >
                                                                        <input
                                                                            type="date"
                                                                            className="w-full h-10 border border-gray-300 rounded px-2 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                                            value={
                                                                                data.date_mariage
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                setData(
                                                                                    {
                                                                                        ...data,
                                                                                        date_mariage:
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                    },
                                                                                )
                                                                            }
                                                                        />
                                                                        {errors.date_mariage && (
                                                                            <p className="text-red-500 text-xs mt-1">
                                                                                {
                                                                                    errors.date_mariage
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </FormField>
                                                                    <FormField
                                                                        label={
                                                                            data.statut_marital ===
                                                                            "Dote"
                                                                                ? "Lieu Dot"
                                                                                : data.statut_marital ===
                                                                                    "Divorcé(e)"
                                                                                  ? "Lieu du Divorce"
                                                                                  : data.statut_marital ===
                                                                                      "Veuf(ve)"
                                                                                    ? "Lieu du Décès"
                                                                                    : "Lieu Mariage"
                                                                        }
                                                                        icon={
                                                                            MapPin
                                                                        }
                                                                        required
                                                                    >
                                                                        <input
                                                                            className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                                            value={
                                                                                data.lieu_mariage
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                setData(
                                                                                    {
                                                                                        ...data,
                                                                                        lieu_mariage:
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                    },
                                                                                )
                                                                            }
                                                                            placeholder="ex: Paris, Yaoundé"
                                                                        />
                                                                        {errors.lieu_mariage && (
                                                                            <p className="text-red-500 text-xs mt-1">
                                                                                {
                                                                                    errors.lieu_mariage
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </FormField>
                                                                </div>
                                                            )}
                                                    </div>
                                                </section>

                                                <section>
                                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                                        <BookOpen className="w-5 h-5 text-indigo-600" />
                                                        Sacrements & Vie
                                                        Chrétienne
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <SacrementSection
                                                            title="Baptême"
                                                            icon={BookOpen}
                                                            color="purple"
                                                            checked={
                                                                data.baptise
                                                            }
                                                            onChange={(val) =>
                                                                setData({
                                                                    ...data,
                                                                    baptise:
                                                                        val,
                                                                })
                                                            }
                                                        >
                                                            <FormField label="Date du baptême">
                                                                <input
                                                                    type="date"
                                                                    className="w-full h-10 border border-gray-300 rounded px-2 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                                    value={
                                                                        data.date_bapteme
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setData(
                                                                            {
                                                                                ...data,
                                                                                date_bapteme:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
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
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setData(
                                                                            {
                                                                                ...data,
                                                                                lieu_bapteme:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                        )
                                                                    }
                                                                    placeholder="ex: Église Saint-Paul"
                                                                />
                                                            </FormField>
                                                        </SacrementSection>

                                                        <SacrementSection
                                                            title="Première Communion"
                                                            icon={Gift}
                                                            color="yellow"
                                                            checked={
                                                                data.premiere_communion
                                                            }
                                                            onChange={(val) =>
                                                                setData({
                                                                    ...data,
                                                                    premiere_communion:
                                                                        val,
                                                                })
                                                            }
                                                        >
                                                            <FormField label="Date de première communion">
                                                                <input
                                                                    type="date"
                                                                    className="w-full h-10 border border-gray-300 rounded px-2 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                                    value={
                                                                        data.date_premiere_communion
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setData(
                                                                            {
                                                                                ...data,
                                                                                date_premiere_communion:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
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
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setData(
                                                                            {
                                                                                ...data,
                                                                                lieu_premiere_communion:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                        )
                                                                    }
                                                                    placeholder="ex: Église Saint-Paul"
                                                                />
                                                            </FormField>
                                                        </SacrementSection>

                                                        <SacrementSection
                                                            title="Mariage Religieux"
                                                            icon={Heart}
                                                            color="rose"
                                                            checked={
                                                                data.marie_religieusement
                                                            }
                                                            onChange={(val) =>
                                                                setData({
                                                                    ...data,
                                                                    marie_religieusement:
                                                                        val,
                                                                })
                                                            }
                                                        >
                                                            <FormField label="Date du mariage religieux">
                                                                <input
                                                                    type="date"
                                                                    className="w-full h-10 border border-gray-300 rounded px-2 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                                    value={
                                                                        data.date_mariage_religieux
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setData(
                                                                            {
                                                                                ...data,
                                                                                date_mariage_religieux:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
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
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setData(
                                                                            {
                                                                                ...data,
                                                                                lieu_mariage_religieux:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                        )
                                                                    }
                                                                    placeholder="ex: Église Saint-Paul"
                                                                />
                                                            </FormField>
                                                        </SacrementSection>
                                                    </div>
                                                </section>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowModal(false)
                                                }
                                                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                                            >
                                                <X className="w-4 h-4" />{" "}
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={processing || emailTaken || emailChecking}
                                                title={emailTaken ? "Corrigez l'adresse email avant de continuer" : undefined}
                                                className="px-8 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform disabled:hover:scale-100 flex items-center gap-2"
                                            >
                                                {processing ? (
                                                    <>Enregistrement...</>
                                                ) : emailChecking ? (
                                                    <>Vérification email...</>
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4" />{" "}
                                                        {modalMode === "create"
                                                            ? "Enregistrer le Membre"
                                                            : "Mettre à jour"}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ))}

                {/* MODAL DÉTAILS INSCRIPTION (Design Cartes) */}
                {showDetailModal && selectedInscription && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        aria-labelledby="modal-title"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div
                            className="fixed inset-0 bg-slate-900/90 transition-opacity"
                            onClick={closeDetailModal}
                        ></div>
                        <div className="relative z-50 max-h-[90vh] overflow-y-auto bg-white rounded-3xl text-left shadow-2xl transform transition-all w-full max-w-2xl mx-4">
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2
                                    className="text-2xl font-bold text-slate-900"
                                    id="modal-title"
                                >
                                    Fiche – {selectedInscription.nom}{" "}
                                    {selectedInscription.prenom}
                                </h2>
                                <button
                                    onClick={closeDetailModal}
                                    className="text-slate-400 hover:text-red-500 transition p-2 rounded-full hover:bg-red-50"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold uppercase text-xs tracking-wider">
                                        <User className="w-4 h-4" />
                                        <span>Identité</span>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 flex-shrink-0 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                                            {selectedInscription.prenom?.[0]}
                                            {selectedInscription.nom?.[0]}
                                        </div>
                                        <div className="flex-grow space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                        Nom & Prénoms
                                                    </label>
                                                    <p className="text-slate-800 font-medium">
                                                        {
                                                            selectedInscription.nom
                                                        }{" "}
                                                        {
                                                            selectedInscription.prenom
                                                        }
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                        Genre
                                                    </label>
                                                    <p className="text-slate-800 font-medium">
                                                        {
                                                            selectedInscription.genre
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                        Date Naissance
                                                    </label>
                                                    <p className="text-slate-800 font-medium">
                                                        {selectedInscription.date_naissance ||
                                                            selectedInscription.responsable_date_naissance ||
                                                            "N/A"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                        Statut Marital
                                                    </label>
                                                    <p className="text-slate-800 font-medium">
                                                        {selectedInscription.statut_marital ||
                                                            "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 text-purple-600 font-bold uppercase text-xs tracking-wider">
                                        <i className="fas fa-dove"></i>
                                        <span>Détails de la demande</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                Profession
                                            </label>
                                            <p className="text-slate-800 font-medium">
                                                {selectedInscription.fonction_professionnelle ||
                                                    "Non renseignée"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                Date Inscription
                                            </label>
                                            <p className="text-slate-800 font-medium">
                                                {selectedInscription.created_at
                                                    ? new Date(
                                                          selectedInscription.created_at,
                                                      ).toLocaleDateString(
                                                          "fr-FR",
                                                      )
                                                    : "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                Adresse
                                            </label>
                                            <p className="text-slate-800 font-medium">
                                                {selectedInscription.adresse ||
                                                    "Non renseignée"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                Téléphone 2
                                            </label>
                                            <p className="text-slate-800 font-medium">
                                                {selectedInscription.telephone2 ||
                                                    "Non renseigné"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                Statut Marital
                                            </label>
                                            <p className="text-slate-800 font-medium">
                                                {selectedInscription.statut_marital ||
                                                    "Non renseigné"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                Baptisé
                                            </label>
                                            <p className="text-slate-800 font-medium">
                                                {selectedInscription.baptise
                                                    ? "Oui"
                                                    : "Non"}
                                            </p>
                                        </div>
                                        {selectedInscription.date_mariage && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Date Mariage
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedInscription.date_mariage
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedInscription.lieu_mariage && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Lieu Mariage
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedInscription.lieu_mariage
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedInscription.date_bapteme && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Date Baptême
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedInscription.date_bapteme
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedInscription.lieu_bapteme && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Lieu Baptême
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedInscription.lieu_bapteme
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedInscription.premiere_communion && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Première Communion
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {selectedInscription.premiere_communion
                                                        ? "Oui"
                                                        : "Non"}
                                                </p>
                                            </div>
                                        )}
                                        {selectedInscription.date_premiere_communion && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Date Première Communion
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedInscription.date_premiere_communion
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedInscription.mariage_religieux && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Mariage Religieux
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {selectedInscription.mariage_religieux
                                                        ? "Oui"
                                                        : "Non"}
                                                </p>
                                            </div>
                                        )}
                                        {selectedInscription.date_mariage_religieux && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Date Mariage Religieux
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedInscription.date_mariage_religieux
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedInscription.lieu_mariage_religieux && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Lieu Mariage Religieux
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedInscription.lieu_mariage_religieux
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section Statut Approbation */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 text-amber-600 font-bold uppercase text-xs tracking-wider">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Statut Approbation</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                                                Admin
                                            </label>
                                            <div className="flex items-center gap-2">
                                                {selectedInscription.admin_approved ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                                        <span className="text-slate-800 font-medium">
                                                            Approuvé
                                                        </span>
                                                        {selectedInscription.admin_name && (
                                                            <span className="text-xs text-slate-600">
                                                                par{" "}
                                                                {
                                                                    selectedInscription.admin_name
                                                                }
                                                            </span>
                                                        )}
                                                        {selectedInscription.admin_approved_at && (
                                                            <span className="text-xs text-slate-600">
                                                                le{" "}
                                                                {formatDateDisplay(
                                                                    selectedInscription.admin_approved_at,
                                                                    "N/A",
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                                        <span className="text-slate-800 font-medium">
                                                            En attente
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                                                Conducteur
                                            </label>
                                            <div className="flex items-center gap-2">
                                                {selectedInscription.conducteur_approved ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                                        <span className="text-slate-800 font-medium">
                                                            Approuvé
                                                        </span>
                                                        {selectedInscription.conducteur_name && (
                                                            <span className="text-xs text-slate-600">
                                                                par{" "}
                                                                {
                                                                    selectedInscription.conducteur_name
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                                        <span className="text-slate-800 font-medium">
                                                            En attente
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {selectedInscription.raison_rejet && (
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                                                    Motif Rejet
                                                </label>
                                                <p className="text-slate-800 font-medium bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                                                    {
                                                        selectedInscription.raison_rejet
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold uppercase text-xs tracking-wider">
                                        <Users className="w-4 h-4" />
                                        <span>Contact</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mt-0.5">
                                                    <i className="fas fa-envelope text-sm"></i>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                        Email
                                                    </label>
                                                    <p className="text-slate-800 font-medium">
                                                        {
                                                            selectedInscription.email
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mt-0.5">
                                                    <i className="fas fa-phone-alt text-sm"></i>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                        Téléphone
                                                    </label>
                                                    <p className="text-slate-800 font-medium">
                                                        {
                                                            selectedInscription.telephone
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section Informations Supplémentaires pour les inscriptions */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 text-green-600 font-bold uppercase text-xs tracking-wider">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>
                                            Informations supplémentaires
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(selectedInscription.created_at ||
                                            selectedInscription.raw
                                                ?.created_at) && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Date d'inscription
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {formatDateDisplay(
                                                        selectedInscription.created_at ||
                                                            selectedInscription
                                                                .raw
                                                                ?.created_at,
                                                        "N/A",
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                        {(selectedInscription.updated_at ||
                                            selectedInscription.raw
                                                ?.updated_at ||
                                            selectedInscription.created_at ||
                                            selectedInscription.raw
                                                ?.created_at) && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Dernière modification
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {formatDateDisplay(
                                                        selectedInscription.updated_at ||
                                                            selectedInscription
                                                                .raw
                                                                ?.updated_at ||
                                                            selectedInscription.created_at ||
                                                            selectedInscription
                                                                .raw
                                                                ?.created_at,
                                                        "N/A",
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section membres de la famille (si c'est une inscription familiale) */}
                                {selectedInscription.type === "famille" &&
                                    selectedInscription.membres &&
                                    selectedInscription.membres.length > 0 && (
                                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                            <div className="flex items-center gap-2 mb-4 text-purple-600 font-bold uppercase text-xs tracking-wider">
                                                <Users className="w-4 h-4" />
                                                <span>
                                                    Membres de la famille (
                                                    {
                                                        selectedInscription
                                                            .membres.length
                                                    }
                                                    )
                                                </span>
                                            </div>
                                            <div className="space-y-3">
                                                {selectedInscription.membres.map(
                                                    (membre, index) => (
                                                        <div
                                                            key={index}
                                                            className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4"
                                                        >
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-300 to-indigo-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                                {
                                                                    membre
                                                                        .prenom?.[0]
                                                                }
                                                                {
                                                                    membre
                                                                        .nom?.[0]
                                                                }
                                                            </div>
                                                            <div className="flex-grow">
                                                                <div className="font-semibold text-slate-800">
                                                                    {
                                                                        membre.prenom
                                                                    }{" "}
                                                                    {membre.nom}
                                                                </div>
                                                                <div className="text-sm text-slate-600">
                                                                    {membre.email ||
                                                                        "Email non renseigné"}
                                                                </div>
                                                                {membre.telephone && (
                                                                    <div className="text-xs text-slate-500">
                                                                        {
                                                                            membre.telephone
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {membre.relation && (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                                                                    {
                                                                        membre.relation
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>
                            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={closeDetailModal}
                                    className="px-6 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-200 transition"
                                >
                                    Fermer
                                </button>
                                <button
                                    onClick={() =>
                                        rejectInscription(
                                            selectedInscription.id,
                                        )
                                    }
                                    disabled={
                                        rejectingId === selectedInscription.id
                                    }
                                    className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition shadow-md disabled:opacity-50"
                                >
                                    {rejectingId === selectedInscription.id
                                        ? "Rejet..."
                                        : "Rejeter"}
                                </button>
                                <button
                                    onClick={() =>
                                        approveInscription(
                                            selectedInscription.id,
                                        )
                                    }
                                    disabled={
                                        approvingId === selectedInscription.id
                                    }
                                    className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition shadow-md disabled:opacity-50"
                                >
                                    {approvingId === selectedInscription.id
                                        ? "Approbation..."
                                        : "Approuver"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL MEMBRE */}
                {showMemberModal && selectedMember && (
                    <div
                        className="fixed inset-0 z-[50] flex items-center justify-center"
                        aria-labelledby="modal-title"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div
                            className="fixed inset-0 bg-slate-900/90 transition-opacity"
                            onClick={() => setShowMemberModal(false)}
                        ></div>
                        <div className="relative z-50 max-h-[90vh] overflow-y-auto bg-white rounded-3xl text-left shadow-2xl transform transition-all w-full max-w-2xl mx-4">
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2
                                    className="text-2xl font-bold text-slate-900"
                                    id="modal-title"
                                >
                                    Détails – {selectedMember.prenom}{" "}
                                    {selectedMember.nom}
                                </h2>
                                <button
                                    onClick={() => setShowMemberModal(false)}
                                    className="text-slate-400 hover:text-red-500 transition p-2 rounded-full hover:bg-red-50"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold uppercase text-xs tracking-wider">
                                        <User className="w-4 h-4" />
                                        <span>Informations personnelles</span>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center text-white text-3xl font-bold shadow-md overflow-hidden">
                                            {selectedMember.profile_photo_url ? (
                                                <img
                                                    src={
                                                        selectedMember.profile_photo_url
                                                    }
                                                    alt={`${selectedMember.prenom} ${selectedMember.nom}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <>
                                                    {selectedMember.prenom?.[0]}
                                                    {selectedMember.nom?.[0]}
                                                </>
                                            )}
                                        </div>
                                        <div className="flex-grow space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                        Nom
                                                    </label>
                                                    <p className="text-slate-800 font-medium">
                                                        {selectedMember.nom}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                        Prénom
                                                    </label>
                                                    <p className="text-slate-800 font-medium">
                                                        {selectedMember.prenom}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                        Rôle
                                                    </label>
                                                    <p className="text-slate-800 font-medium">
                                                        {selectedMember.role ===
                                                        "responsable_famille"
                                                            ? "Responsable de famille"
                                                            : selectedMember.role ===
                                                                "membre_famille"
                                                              ? "Membre de famille"
                                                              : selectedMember.role ||
                                                                "Membre"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                        Statut
                                                    </label>
                                                    <p className="text-slate-800 font-medium">
                                                        {selectedMember.status ===
                                                        "actif"
                                                            ? "Actif"
                                                            : "Inactif"}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedMember.raw
                                                ?.date_naissance && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                        Date de naissance
                                                    </label>
                                                    <p className="text-slate-800 font-medium">
                                                        {formatDateDisplay(
                                                            selectedMember.raw
                                                                .date_naissance,
                                                            "N/A",
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold uppercase text-xs tracking-wider">
                                        <Users className="w-4 h-4" />
                                        <span>Contact & Famille</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mt-0.5">
                                                    <i className="fas fa-envelope text-sm"></i>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                        Email
                                                    </label>
                                                    <p className="text-slate-800 font-medium">
                                                        {selectedMember.email ||
                                                            "Non renseigné"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mt-0.5">
                                                    <i className="fas fa-phone-alt text-sm"></i>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                        Téléphone
                                                    </label>
                                                    <p className="text-slate-800 font-medium">
                                                        {selectedMember.phone ||
                                                            "Non renseigné"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedMember.famille_id && (
                                            <div className="pt-4 border-t border-slate-100">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mt-0.5">
                                                        <Users className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-400 uppercase">
                                                            Famille
                                                        </label>
                                                        <p className="text-slate-800 font-medium">
                                                            {(() => {
                                                                const memberFamily =
                                                                    familiesList.find(
                                                                        (f) =>
                                                                            f.members &&
                                                                            f.members.some(
                                                                                (
                                                                                    m,
                                                                                ) =>
                                                                                    m.id ===
                                                                                    selectedMember.id,
                                                                            ),
                                                                    );
                                                                return memberFamily
                                                                    ? memberFamily.nom
                                                                    : `Famille #${selectedMember.famille_id}`;
                                                            })()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 text-green-600 font-bold uppercase text-xs tracking-wider">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>
                                            Informations supplémentaires
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                Date d'inscription
                                            </label>
                                            <p className="text-slate-800 font-medium">
                                                {formatDateDisplay(
                                                    selectedMember.raw
                                                        ?.created_at ||
                                                        selectedMember.created_at ||
                                                        null,
                                                    "Non disponible",
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                Dernière modification
                                            </label>
                                            <p className="text-slate-800 font-medium">
                                                {formatDateDisplay(
                                                    selectedMember.raw
                                                        ?.updated_at ||
                                                        selectedMember.updated_at ||
                                                        selectedMember.raw
                                                            ?.created_at ||
                                                        selectedMember.created_at ||
                                                        null,
                                                    "Non disponible",
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section Informations Religieuses pour les membres */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 text-purple-600 font-bold uppercase text-xs tracking-wider">
                                        <i className="fas fa-dove"></i>
                                        <span>Détails religieux</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                Baptisé
                                            </label>
                                            <p className="text-slate-800 font-medium">
                                                {selectedMember.raw?.baptise
                                                    ? "Oui"
                                                    : "Non"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                Première Communion
                                            </label>
                                            <p className="text-slate-800 font-medium">
                                                {selectedMember.raw
                                                    ?.premiere_communion
                                                    ? "Oui"
                                                    : "Non"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                Mariage Religieux
                                            </label>
                                            <p className="text-slate-800 font-medium">
                                                {selectedMember.raw
                                                    ?.mariage_religieux
                                                    ? "Oui"
                                                    : "Non"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                Statut Marital
                                            </label>
                                            <p className="text-slate-800 font-medium">
                                                {selectedMember.raw
                                                    ?.statut_marital ||
                                                    "Non renseigné"}
                                            </p>
                                        </div>
                                        {selectedMember.raw?.date_bapteme && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Date Baptême
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedMember.raw
                                                            .date_bapteme
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedMember.raw?.lieu_bapteme && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Lieu Baptême
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedMember.raw
                                                            .lieu_bapteme
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedMember.raw
                                            ?.date_premiere_communion && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Date Première Communion
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedMember.raw
                                                            .date_premiere_communion
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedMember.raw
                                            ?.date_mariage_religieux && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Date Mariage Religieux
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedMember.raw
                                                            .date_mariage_religieux
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedMember.raw
                                            ?.lieu_mariage_religieux && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Lieu Mariage Religieux
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedMember.raw
                                                            .lieu_mariage_religieux
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedMember.raw?.date_mariage && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Date Mariage
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedMember.raw
                                                            .date_mariage
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedMember.raw?.lieu_mariage && (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                                    Lieu Mariage
                                                </label>
                                                <p className="text-slate-800 font-medium">
                                                    {
                                                        selectedMember.raw
                                                            .lieu_mariage
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowMemberModal(false)}
                                    className="px-6 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-200 transition"
                                >
                                    Fermer
                                </button>
                                <button
                                    onClick={() => {
                                        openEditModal(selectedMember);
                                        setShowMemberModal(false);
                                    }}
                                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-md"
                                >
                                    Modifier
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL FAMILLE */}

                {showFamilyModal && selectedFamily && (
                    <div
                        className="fixed inset-0 z-[30] overflow-y-auto"
                        aria-labelledby="modal-title"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div
                                className="fixed inset-0 bg-slate-900/40 transition-opacity"
                                onClick={() => setShowFamilyModal(false)}
                            ></div>
                            <span
                                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                                aria-hidden="true"
                            >
                                &#8203;
                            </span>
                            <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                                {/* Header */}
                                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                                    <div>
                                        <h2
                                            className="text-2xl font-bold"
                                            id="modal-title"
                                        >
                                            Famille{" "}
                                            {selectedFamily.nom ||
                                                selectedFamily.responsable
                                                    .nom ||
                                                "N/A"}
                                        </h2>
                                        {/* <p className="text-blue-100 text-sm">
                                            Responsable:{" "}
                                            {selectedFamily.responsable
                                                .prenom || "N/A"}{" "}
                                            {selectedFamily.responsable.nom ||
                                                ""}
                                        </p> */}
                                    </div>
                                    <button
                                        onClick={() =>
                                            setShowFamilyModal(false)
                                        }
                                        className="text-white hover:text-red-300 transition p-2 rounded-full hover:bg-white/20"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Contenu */}
                                <div className="overflow-y-auto p-8 space-y-4 max-h-[70vh]">
                                    <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold uppercase text-xs tracking-wider">
                                        <Users className="w-4 h-4" />
                                        <span>
                                            Membres de la famille (
                                            {selectedFamily.memberCount})
                                        </span>
                                    </div>

                                    {/* Responsable */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                                            {
                                                selectedFamily.responsable
                                                    ?.prenom?.[0]
                                            }
                                            {
                                                selectedFamily.responsable
                                                    ?.nom?.[0]
                                            }
                                        </div>
                                        <div className="flex-grow">
                                            <div className="font-semibold text-slate-800">
                                                {selectedFamily.responsable
                                                    ?.prenom || "N/A"}{" "}
                                                {selectedFamily.responsable
                                                    ?.nom || ""}
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                {selectedFamily.responsable
                                                    ?.email ||
                                                    "Email non renseigné"}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {selectedFamily.responsable
                                                    ?.phone ||
                                                    "Téléphone non renseigné"}
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                            Responsable
                                        </span>
                                    </div>

                                    {/* Liste des membres */}
                                    <div className="space-y-3">
                                        {selectedFamily.members &&
                                        selectedFamily.members.length > 0 ? (
                                            selectedFamily.members
                                                .filter((member) => {
                                                    if (
                                                        member.responsable_famille
                                                    )
                                                        return false;
                                                    if (
                                                        selectedFamily
                                                            .responsable?.id &&
                                                        member.id ===
                                                            selectedFamily
                                                                .responsable.id
                                                    )
                                                        return false;
                                                    return true;
                                                })
                                                .map((member, index) => (
                                                    <div
                                                        key={`${member.kind}-${member.id}`}
                                                        className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition flex items-center gap-4"
                                                    >
                                                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-300 to-amber-400 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                                                            {member.prenom?.[0]}
                                                            {member.nom?.[0]}
                                                        </div>
                                                        <div className="flex-grow">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="font-bold text-slate-900 text-base">
                                                                    {member.nom ||
                                                                        member.last_name ||
                                                                        member.lastName}{" "}
                                                                    {member.prenom ||
                                                                        member.first_name ||
                                                                        member.firstName}
                                                                </div>
                                                                {member.responsable_famille && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                                        Responsable
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-slate-600">
                                                                {member.email}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {member.phone}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                                {member.role}
                                                            </span>
                                                            {member.status ===
                                                                "actif" && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{" "}
                                                                    Actif
                                                                </span>
                                                            )}
                                                            {member.status ===
                                                                "pending" && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>{" "}
                                                                    En attente
                                                                </span>
                                                            )}
                                                            {member.status ===
                                                                "rejected" && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                                    Refusé
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                        ) : (
                                            <div className="text-center py-8 text-slate-500">
                                                <p>
                                                    Aucun membre dans cette
                                                    famille
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                    <button
                                        onClick={() =>
                                            setShowFamilyModal(false)
                                        }
                                        className="px-6 py-2.5 rounded-xl bg-slate-600 text-white font-semibold hover:bg-slate-700 transition"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal confirmation désactivation membre */}
                {showDeactivateModal && memberToToggle && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/50"
                            onClick={() => {
                                if (!toggleProcessing) {
                                    setShowDeactivateModal(false);
                                    setMemberToToggle(null);
                                }
                            }}
                        />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                Confirmer la désactivation
                            </h3>
                            <p className="text-sm text-slate-600 mb-6">
                                Voulez-vous vraiment désactiver{" "}
                                <span className="font-semibold">
                                    {memberToToggle.prenom} {memberToToggle.nom}
                                </span>{" "}
                                ?
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={toggleProcessing}
                                    onClick={() => {
                                        setShowDeactivateModal(false);
                                        setMemberToToggle(null);
                                    }}
                                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    disabled={toggleProcessing}
                                    onClick={() =>
                                        rejectMember(memberToToggle.id)
                                    }
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                                >
                                    {toggleProcessing
                                        ? "Désactivation..."
                                        : "Désactiver"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
