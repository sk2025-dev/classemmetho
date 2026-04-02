import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import AddressAutocomplete from "../../Components/AddressAutocomplete";
import PhotoUploadInput from "../../Components/PhotoUploadInput";
import { useDebounce } from "../../Hooks/useDebounce";
import {
    usePersistentState,
    clearFormPersistedData,
} from "../../Hooks/usePersistentState";
import { useFormErrors } from "../../Hooks/useFormErrors";
import Select2Classe from "../../Components/Select2Classe";
import Select2Fonction from "../../Components/Select2Fonction";
import Select2Relation from "../../Components/Select2Relation";
import CitySelect from "../../Components/CitySelect";
import { useToastWithErrorHandling } from "../../Hooks/useToastWithErrorHandling";
import ToastContainer from "../../Components/ToastContainer";
import { sanitizeUppercasePrenom } from "../../Helpers/nameSanitizers";
import {
    Home,
    User,
    BookOpen,
    Users,
    CheckCircle,
    MapPin,
    Phone,
    Building,
    Globe,
    Mail,
    Calendar,
    Briefcase,
    Heart,
    Package,
    Megaphone,
    Car,
    GraduationCap,
    UserPlus,
    Trash2,
    Edit,
    ShieldCheck,
    ArrowLeft,
    ArrowRight,
    Send,
    Search,
    X,
    Check,
    ChevronDown,
    Gift,
    AlertCircle,
} from "lucide-react";

// --- Style Constants ---
const STYLES = {
    button: {
        primary:
            "px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 active:scale-95",
        secondary:
            "px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:shadow-md hover:bg-gray-300 transition-all duration-300",
        danger: "px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium",
        small: "px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:shadow-md hover:bg-blue-700 transition-all duration-300",
    },
    input: "w-full h-12 border border-gray-300 rounded-lg px-4 outline-none focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300",
    photoContainer:
        "w-24 h-24 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden border-2 border-blue-300 flex items-center justify-center flex-shrink-0 shadow-md",
    photoLargeContainer:
        "w-28 h-28 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden border-2 border-blue-300 flex items-center justify-center flex-shrink-0 shadow-md",
    photoExtraLarge:
        "w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden border-3 border-blue-300 flex items-center justify-center shadow-lg",
};

const FormStepper = ({ currentStep, totalSteps, labels, onStepClick }) => {
    const icons = [Home, User, Users, CheckCircle];
    return (
        <div className="w-full px-6 py-8">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
                {labels.map((label, idx) => {
                    const stepNum = idx + 1;
                    const isActive = stepNum === currentStep;
                    const isCompleted = stepNum < currentStep;
                    const Icon = icons[idx] || CheckCircle;
                    const isClickable = stepNum <= currentStep;

                    return (
                        <React.Fragment key={stepNum}>
                            <div className="flex flex-col items-center group">
                                <button
                                    type="button"
                                    disabled={!isClickable}
                                    onClick={() =>
                                        isClickable && onStepClick(stepNum)
                                    }
                                    className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold transition-all duration-300 shadow-lg focus:outline-none ${
                                        isActive
                                            ? "bg-blue-600 text-white scale-110 shadow-blue-300"
                                            : isCompleted
                                              ? "bg-green-500 text-white"
                                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    }`}
                                    style={{
                                        cursor: isClickable
                                            ? "pointer"
                                            : "not-allowed",
                                    }}
                                >
                                    {isCompleted ? (
                                        <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                                    ) : (
                                        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                                    )}
                                </button>
                                <span
                                    className={`mt-3 text-xs sm:text-sm font-semibold text-center transition-colors duration-300 hidden sm:block ${
                                        isActive
                                            ? "text-blue-600"
                                            : isCompleted
                                              ? "text-green-600"
                                              : "text-gray-500"
                                    }`}
                                >
                                    {label}
                                </span>
                            </div>
                            {stepNum < totalSteps && (
                                <div
                                    className={`flex-1 h-1 mx-2 sm:mx-3 rounded-full transition-all duration-300 ${
                                        isCompleted
                                            ? "bg-green-500"
                                            : "bg-gray-300"
                                    }`}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

// --- Form Field Component ---
const FormField = ({ label, children, icon: Icon, required }) => (
    <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            {Icon && <Icon className="w-4 h-4 text-blue-500" />}
            {label}
            {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

// --- MultiSelectDropdown Component ---
const MultiSelectDropdown = ({
    items,
    selected,
    onChange,
    placeholder = "Sélectionner...",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = (item) => {
        if (selected.some((s) => s.id === item.id)) {
            onChange(selected.filter((s) => s.id !== item.id));
        } else {
            onChange([...selected, item]);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-12 border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-between focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white hover:border-gray-400"
            >
                <div className="flex flex-col items-start">
                    <span
                        className={
                            selected.length === 0
                                ? "text-gray-500 text-sm"
                                : "text-gray-700 text-xs font-semibold"
                        }
                    >
                        {selected.length === 0
                            ? placeholder
                            : selected.map((s) => s.nom).join(", ")}
                    </span>
                </div>
                <ChevronDown
                    className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                        <label
                            key={item.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                        >
                            <input
                                type="checkbox"
                                checked={selected.some((s) => s.id === item.id)}
                                onChange={() => handleToggle(item)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="flex-1 text-sm text-gray-900">
                                {item.nom}
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main Component ---
export default function RegisterConducteur({
    labels = ["Conducteur", "Responsable", "Membres", "Vérification"],
}) {
    // --- États ---
    const [step, setStep] = usePersistentState("registerConducteur_step", 1);
    const {
        errors,
        setErrors,
        serverErrors,
        setServerErrors,
        getFieldError,
        handleServerErrors,
    } = useFormErrors();
    const {
        toasts,
        removeToast,
        success: showSuccess,
        error: showError,
        warning: showWarning,
        info: showInfo,
    } = useToastWithErrorHandling();
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [editingMemberIndex, setEditingMemberIndex] = useState(null);

    // Base de données locales
    const [classesDatabase, setClassesDatabase] = useState([]);
    const [villesDatabase, setVillesDatabase] = useState([]);

    // Recherche et Dropdowns
    const [classesSearchTerm, setClassesSearchTerm] = usePersistentState(
        "registerConducteur_classesSearchTerm",
        "",
    );
    const [showClassesDropdown, setShowClassesDropdown] = useState(false);
    const [villesSearchTerm, setVillesSearchTerm] = usePersistentState(
        "registerConducteur_villesSearchTerm",
        "",
    );
    const [showVillesDropdown, setShowVillesDropdown] = useState(false);

    // États pour l'adresse autocomplete
    const [adresseInputValue, setAdresseInputValue] = usePersistentState(
        "registerConducteur_adresseInputValue",
        "",
    );
    const [adresseSuggestions, setAdresseSuggestions] = useState([]);
    const [showAdresseDropdown, setShowAdresseDropdown] = useState(false);

    // Debounce pour l'adresse
    const debouncedAdresseTerm = useDebounce(adresseInputValue, 500);

    // Données du formulaire
    const [famille, setFamille] = usePersistentState(
        "registerConducteur_famille",
        {
            nom: "",
            adresse: "",
            quartier: "",
            ville: "",
            telephone: "",
            telephone2: "",
            classe_id: null,
        },
    );

    const [responsable, setResponsable] = usePersistentState(
        "registerConducteur_responsable",
        {
            nom: "",
            prenom: "",
            email: "",
            tel: "",
            telephone2: "",
            dateNaissance: "",
            genre: "",
            profession: "",
            employment_status: "",
            profession_detail: "",
            fonction_professionnelle: "",
            adresse: "",
            ville_id: null,
            statutMarital: "",
            dateMariage: "",
            lieuMariage: "",
            dateDivorce: "",
            lieuDivorce: "",
            dateDeces: "",
            lieuDeces: "",
            // Champs religieux - baptême
            baptise: false,
            dateBapteme: "",
            lieuBapteme: "",
            // Champs religieux - première communion
            premiereCommunion: false,
            datePremiereCommunion: "",
            lieuPremiereCommunion: "",
            // Champs religieux - mariage religieux
            marieReligieusement: false,
            dateMariageReligieux: "",
            lieuMariageReligieux: "",
            photo: null,
            photoPreview: null,
        },
        { excludeKeys: ["photo", "photoPreview"] },
    );

    const [membres, setMembres] = usePersistentState(
        "registerConducteur_membres",
        [],
    );
    const [membreTemp, setMembreTemp] = usePersistentState(
        "registerConducteur_membreTemp",
        {
            nom: "",
            prenom: "",
            email: "",
            telephone: "",
            relation: "",
            genre: "",
            dateNaissance: "",
            statutMarital: "",
            dateMariage: "",
            lieuMariage: "",
            dateDivorce: "",
            lieuDivorce: "",
            dateDeces: "",
            lieuDeces: "",
            dateDote: "",
            lieuDote: "",
            lienParente: "",
            // Champs religieux - baptême
            baptise: false,
            dateBapteme: "",
            lieuBapteme: "",
            // Champs religieux - première communion
            premiereCommunion: false,
            datePremiereCommunion: "",
            lieuPremiereCommunion: "",
            // Champs religieux - mariage religieux
            marieReligieusement: false,
            dateMariageReligieux: "",
            lieuMariageReligieux: "",
            fonction: "",
            profession: "",
            employment_status: "",
            profession_detail: "",
            photo: null,
            photoPreview: null,
        },
        { excludeKeys: ["photo", "photoPreview"] },
    );

    const [consentement, setConsentement] = usePersistentState(
        "registerConducteur_consentement",
        false,
    );
    const [churchRoles, setChurchRoles] = useState([]);
    const [selectedRolesResponsable, setSelectedRolesResponsable] =
        usePersistentState("registerConducteur_selectedRolesResponsable", []);
    const [selectedMembresRoles, setSelectedMembresRoles] = usePersistentState(
        "registerConducteur_selectedMembresRoles",
        new Set(),
    );
    const [selectedCity, setSelectedCity] = usePersistentState(
        "registerConducteur_selectedCity",
        null,
    );
    const [hasMembersToAdd, setHasMembersToAdd] = usePersistentState(
        "registerConducteur_hasMembersToAdd",
        null,
    );
    const [isResponsablePhotoUploading, setIsResponsablePhotoUploading] =
        useState(false);
    const [isMemberPhotoUploading, setIsMemberPhotoUploading] = useState(false);

    // Reset the question choice on component mount so each new registration
    // starts with the undecided state (null) instead of reusing previous answer.
    useEffect(() => {
        setHasMembersToAdd(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Refs
    const familyNameRef = useRef(null);
    const respNameRef = useRef(null);
    const respPrenomRef = useRef(null);
    const respEmailRef = useRef(null);
    const classesDropdownRef = useRef(null);
    const villesDropdownRef = useRef(null);

    const totalSteps = labels.length;

    // --- Effets (Chargement des données) ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Charger les classes depuis la base de données
                const classesRes = await fetch("/api/classes");
                if (classesRes.ok) {
                    const classesData = await classesRes.json();
                    setClassesDatabase(
                        classesData.data && Array.isArray(classesData.data)
                            ? classesData.data
                            : Array.isArray(classesData)
                              ? classesData
                              : [],
                    );
                } else {
                    console.error(
                        "Erreur chargement classes:",
                        classesRes.status,
                    );
                    setClassesDatabase([]);
                }

                // Charger les villes depuis la base de données
                const villesRes = await fetch("/api/villes");
                if (villesRes.ok) {
                    const villesData = await villesRes.json();
                    setVillesDatabase(
                        villesData.data && Array.isArray(villesData.data)
                            ? villesData.data
                            : Array.isArray(villesData)
                              ? villesData
                              : [],
                    );
                } else {
                    console.error(
                        "Erreur chargement villes:",
                        villesRes.status,
                    );
                    setVillesDatabase([]);
                }

                // Charger les fonctions d'église
                const rolesRes = await fetch("/api/fonctions");
                if (rolesRes.ok) {
                    const rolesData = await rolesRes.json();
                    setChurchRoles(
                        rolesData.data && Array.isArray(rolesData.data)
                            ? rolesData.data
                            : Array.isArray(rolesData)
                              ? rolesData
                              : [],
                    );
                } else {
                    setChurchRoles([]);
                }
            } catch (error) {
                console.error("Erreur chargement données:", error);
                setClassesDatabase([]);
                setVillesDatabase([]);
                setChurchRoles([]);
            }
        };
        fetchData();
    }, []);

    // Fermer les dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                classesDropdownRef.current &&
                !classesDropdownRef.current.contains(event.target)
            )
                setShowClassesDropdown(false);
            if (
                villesDropdownRef.current &&
                !villesDropdownRef.current.contains(event.target)
            )
                setShowVillesDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatName = (text) => text.toUpperCase().replace(/\s+/g, " ").trim();
    const formatPrenom = (text) => sanitizeUppercasePrenom(text);

    /**
     * Valider le format téléphone
     * UNIQUEMENT 10 chiffres exactement
     * Pas de caractères spéciaux
     */
    const isValidPhoneFormat = (phone) => {
        if (!phone) return false;
        const cleaned = phone.replace(/\D/g, "");
        // UNIQUEMENT 10 chiffres exactement
        return cleaned.length === 10;
    };

    /**
     * Formatter le numéro de téléphone
     * UNIQUEMENT les 10 premiers chiffres
     * Enlève tous les caractères non-numériques
     */
    const formatPhoneNumber = (text) => {
        // Garder UNIQUEMENT les chiffres
        const cleaned = text.replace(/\D/g, "");

        // UNIQUEMENT 10 chiffres maximum
        return cleaned.substring(0, 10);
    };

    const ajouterMembre = () => {
        const newErrors = {};

        if (!membreTemp.nom) newErrors["membre.nom"] = "Nom requis";
        if (!membreTemp.prenom) newErrors["membre.prenom"] = "Prénom requis";
        if (!membreTemp.email) {
            newErrors["membre.email"] = "Email requis";
        } else if (!/^\S+@\S+\.\S+$/.test(membreTemp.email)) {
            newErrors["membre.email"] = "Adresse email invalide";
        }
        if (!membreTemp.relation)
            newErrors["membre.relation"] = "Relation requise";
        if (!membreTemp.dateNaissance)
            newErrors["membre.dateNaissance"] = "Date de naissance requise";

        // Si fourni, valider le format téléphone
        if (membreTemp.telephone && !isValidPhoneFormat(membreTemp.telephone)) {
            newErrors["membre.telephone"] =
                "Doit contenir exactement 10 chiffres";
        }

        if (!membreTemp.genre) newErrors["membre.genre"] = "Genre requis";
        if (!membreTemp.statutMarital)
            newErrors["membre.statutMarital"] = "Statut marital requis";
        if (!membreTemp.employment_status)
            newErrors["membre.employment_status"] = "Statut d'emploi requis";
        if (!membreTemp.profession_detail)
            newErrors["membre.profession_detail"] = "Profession requise";

        // Vérifier conditions statut marital
        if (membreTemp.statutMarital === "marie") {
            if (!membreTemp.dateMariage)
                newErrors["membre.dateMariage"] = "Date requise";
            if (!membreTemp.lieuMariage)
                newErrors["membre.lieuMariage"] = "Lieu requis";
        }
        if (membreTemp.statutMarital === "divorce") {
            if (!membreTemp.dateDivorce)
                newErrors["membre.dateDivorce"] = "Date requise";
            if (!membreTemp.lieuDivorce)
                newErrors["membre.lieuDivorce"] = "Lieu requis";
        }
        if (membreTemp.statutMarital === "veuf") {
            if (!membreTemp.dateDeces)
                newErrors["membre.dateDeces"] = "Date requise";
            if (!membreTemp.lieuDeces)
                newErrors["membre.lieuDeces"] = "Lieu requis";
        }
        if (membreTemp.statutMarital === "dot") {
            if (!membreTemp.dote) newErrors["membre.dote"] = "Date requise";
            if (!membreTemp.lieuDote)
                newErrors["membre.lieuDote"] = "Lieu requis";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (isMemberPhotoUploading) {
            showWarning(
                "Veuillez attendre la fin de l'upload de la photo du membre avant d'ajouter ce membre.",
            );
            return;
        }

        const normalizedMemberPhoto = normalizePhotoValue(
            membreTemp.photo,
            membreTemp.photoPreview,
        );
        const normalizedMember = {
            ...membreTemp,
            photo: normalizedMemberPhoto,
            photoPreview:
                typeof normalizedMemberPhoto === "string"
                    ? normalizedMemberPhoto
                    : membreTemp.photoPreview,
        };

        // Vérifier si on édite un membre ou on en ajoute un nouveau
        if (editingMemberIndex !== null) {
            // Mettre à jour le membre existant
            const updatedMembres = [...membres];
            updatedMembres[editingMemberIndex] = normalizedMember;
            setMembres(updatedMembres);
            showSuccess("✅ Membre modifié avec succès !");

            // Réinitialiser le mode édition
            setEditingMemberIndex(null);
        } else {
            // Ajouter le nouveau membre
            setMembres([...membres, normalizedMember]);
            showSuccess("✅ Membre ajouté avec succès !");
        }

        // Reset du formulaire
        setTimeout(() => {
            setMembreTemp({
                nom: "",
                prenom: "",
                email: "",
                telephone: "",
                relation: "",
                genre: "",
                dateNaissance: "",
                statutMarital: "",
                dateMariage: "",
                lieuMariage: "",
                dateDivorce: "",
                lieuDivorce: "",
                dateDeces: "",
                lieuDeces: "",
                baptise: false,
                dateBapteme: "",
                lieuBapteme: "",
                premiereCommunion: false,
                datePremiereCommunion: "",
                lieuPremiereCommunion: "",
                marieReligieusement: false,
                dateMariageReligieux: "",
                lieuMariageReligieux: "",
                fonction: "",
                profession: "",
                employment_status: "",
                profession_detail: "",
                photo: null,
                photoPreview: null,
            });
            setErrors({});
        }, 500);
    };

    const supprimerMembre = (index) => {
        setMembres(membres.filter((_, i) => i !== index));
    };

    // Validation stricte
    const validateStep = (s) => {
        const newErrors = {};

        if (s === 1) {
            if (!famille.nom) newErrors["famille.nom"] = "Requis";
            if (!famille.quartier) newErrors["famille.quartier"] = "Requis";
            if (!famille.ville)
                newErrors["famille.ville"] =
                    "Veuillez sélectionner une ville dans la liste.";
            if (!famille.telephone) {
                newErrors["famille.telephone"] = "Requis";
            } else if (!isValidPhoneFormat(famille.telephone)) {
                newErrors["famille.telephone"] =
                    "Doit contenir exactement 10 chiffres";
            }
            if (!famille.classe_id)
                newErrors["famille.classe_id"] =
                    "Veuillez sélectionner une classe.";
        }
        if (s === 2) {
            if (!responsable.nom) newErrors["responsable.nom"] = "Requis";
            if (!responsable.prenom) newErrors["responsable.prenom"] = "Requis";
            if (!responsable.email) newErrors["responsable.email"] = "Requis";
            else if (!/^\S+@\S+\.\S+$/.test(responsable.email))
                newErrors["responsable.email"] = "Email invalide";
            if (!responsable.tel) {
                newErrors["responsable.tel"] = "Requis";
            } else if (!isValidPhoneFormat(responsable.tel)) {
                newErrors["responsable.tel"] =
                    "Doit contenir exactement 10 chiffres";
            }
            if (!responsable.dateNaissance)
                newErrors["responsable.dateNaissance"] = "Requis";
            else if (new Date(responsable.dateNaissance) > new Date())
                newErrors["responsable.dateNaissance"] =
                    "La date ne doit pas être dans le futur";
            if (!responsable.genre) newErrors["responsable.genre"] = "Requis";
            if (!responsable.employment_status)
                newErrors["responsable.employment_status"] =
                    "Statut d'emploi requis";
            if (!responsable.profession_detail)
                newErrors["responsable.profession_detail"] =
                    "Profession requise";
            if (!responsable.statutMarital)
                newErrors["responsable.statutMarital"] = "Requis";
            if (!responsable.lienParente)
                newErrors["responsable.lienParente"] = "Requis";
        }
        if (s === 3) {
            // Si l'utilisateur a choisi d'ajouter des membres, valider qu'il en a au moins confirmé un
            if (hasMembersToAdd === true && membres.length === 0) {
                newErrors["membres"] =
                    "Veuillez ajouter au moins un membre de la famille";
            }
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            if (getFieldError("famille.nom") && familyNameRef.current)
                familyNameRef.current.focus();
            else if (getFieldError("responsable.nom") && respNameRef.current)
                respNameRef.current.focus();
            return false;
        }
        return true;
    };

    // --- Validation en temps réel pour les champs ---
    const validateField = (fieldName, value) => {
        let error = "";

        if (fieldName.startsWith("famille.")) {
            const field = fieldName.replace("famille.", "");
            if (field === "nom") {
                if (!value) error = "Requis";
            } else if (field === "ville") {
                if (!value) error = "Sélectionner une ville";
            } else if (field === "telephone") {
                if (!value) error = "Requis";
                else if (!isValidPhoneFormat(value))
                    error = "10 chiffres exact";
            } else if (field === "classe_id") {
                if (!value) error = "Sélectionner une classe";
            }
        } else if (fieldName.startsWith("responsable.")) {
            const field = fieldName.replace("responsable.", "");
            if (field === "nom") {
                if (!value) error = "Requis";
            } else if (field === "prenom") {
                if (!value) error = "Requis";
            } else if (field === "email") {
                if (!value) error = "Requis";
                else if (!/^\S+@\S+\.\S+$/.test(value))
                    error = "Email invalide";
            } else if (field === "tel") {
                if (!value) error = "Requis";
                else if (!isValidPhoneFormat(value))
                    error = "10 chiffres exact";
            } else if (field === "dateNaissance") {
                if (!value) error = "Requis";
            } else if (field === "genre") {
                if (!value) error = "Requis";
            } else if (field === "employment_status") {
                if (!value) error = "Requis";
            } else if (field === "profession_detail") {
                if (!value) error = "Requis";
            } else if (field === "statutMarital") {
                if (!value) error = "Requis";
            }
        }

        return error;
    };

    const handleFieldChange = (fieldName, value) => {
        const error = validateField(fieldName, value);
        setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: error,
        }));
    };

    const normalizePhotoValue = (value, fallback = null) => {
        const candidate = value ?? fallback;

        if (!candidate) {
            return null;
        }

        if (candidate instanceof File) {
            return candidate;
        }

        if (typeof candidate === "string") {
            const normalized = candidate.trim();

            if (
                !normalized ||
                normalized.startsWith("blob:") ||
                normalized === "[object Object]"
            ) {
                return null;
            }

            return normalized;
        }

        if (Array.isArray(candidate)) {
            return normalizePhotoValue(candidate[0] ?? null, fallback);
        }

        if (typeof candidate === "object") {
            return normalizePhotoValue(
                candidate.photo_url ??
                    candidate.photoUrl ??
                    candidate.url ??
                    candidate.path ??
                    candidate.value ??
                    null,
                fallback,
            );
        }

        return null;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Valider toutes les étapes
        for (let s = 1; s <= totalSteps; s++) {
            if (!validateStep(s)) {
                setStep(s);
                return;
            }
        }

        if (!consentement) {
            showWarning("Veuillez accepter le consentement.");
            return;
        }

        if (isResponsablePhotoUploading || isMemberPhotoUploading) {
            showWarning(
                "Veuillez attendre la fin de l'upload des photos avant de soumettre le formulaire.",
            );
            return;
        }

        setLoading(true);

        const formData = new FormData();
        const responsablePhotoToSend = normalizePhotoValue(
            responsable.photo,
            responsable.photoPreview,
        );

        // --- 1. Famille (avec nettoyage téléphone) ---
        Object.entries(famille).forEach(([k, v]) => {
            // On ignore photoPreview
            if (k === "photoPreview") return;
            let valueToSend = v;
            // Correspondance des noms backend
            let backendKey = k;
            if (k === "ville") backendKey = "ville_id";
            // Nettoyage téléphone
            if (
                (backendKey === "telephone" || backendKey === "telephone2") &&
                valueToSend
            ) {
                valueToSend = valueToSend.toString().replace(/^225/, "");
            }
            // Classe_id doit être à plat
            if (backendKey === "classe_id") {
                formData.append("classe_id", valueToSend ?? "");
            } else {
                formData.append(backendKey, valueToSend ?? "");
            }
        });

        // --- 2. Responsable (envoyer sous forme d'objet) ---
        Object.entries(responsable).forEach(([k, v]) => {
            if (k === "photoPreview") return;
            if (k === "photo") {
                if (responsablePhotoToSend) {
                    formData.append(
                        `responsable[photo]`,
                        responsablePhotoToSend,
                    );
                }
                return;
            }
            // Les booléens doivent être envoyés comme '1' ou '0'
            let valueToSend = typeof v === "boolean" ? (v ? "1" : "0") : v;
            // Nettoyage téléphone
            if ((k === "tel" || k === "telephone2") && valueToSend) {
                valueToSend = valueToSend.toString().replace(/^225/, "");
            }
            formData.append(`responsable[${k}]`, valueToSend ?? "");
        });

        formData.append(
            "employment_status",
            responsable.employment_status || "",
        );
        formData.append(
            "profession_detail",
            responsable.profession_detail || "",
        );
        if (Array.isArray(selectedRolesResponsable)) {
            selectedRolesResponsable.forEach((roleId, index) => {
                if (!roleId) return;
                formData.append(`selectedRoles[${index}][id]`, roleId);
            });
        }

        // --- 2bis. Champs religieux dans spirituel ---
        const spirituel = {
            baptise: responsable.baptise ? "true" : "false",
            dateBapteme: responsable.dateBapteme || "",
            lieuBapteme: responsable.lieuBapteme || "",
            premiereCommunion: responsable.premiereCommunion ? "true" : "false",
            datePremiereCommunion: responsable.datePremiereCommunion || "",
            lieuPremiereCommunion: responsable.lieuPremiereCommunion || "",
            marieReligieusement: responsable.marieReligieusement
                ? "true"
                : "false",
            dateMariage: responsable.dateMariageReligieux || "",
            lieuMariage: responsable.lieuMariageReligieux || "",
        };
        Object.entries(spirituel).forEach(([k, v]) => {
            formData.append(`spirituel[${k}]`, v);
        });

        // --- 3. Membres ---
        if (membres.length > 0) {
            membres.forEach((m, i) => {
                const memberPhotoToSend = normalizePhotoValue(
                    m.photo,
                    m.photoPreview,
                );
                Object.entries(m).forEach(([k, v]) => {
                    if (k === "photo") {
                        if (memberPhotoToSend) {
                            formData.append(
                                `membres[${i}][photo]`,
                                memberPhotoToSend,
                            );
                        }
                    } else if (k !== "photoPreview") {
                        // Nettoyer le téléphone si présent
                        let valueToSend = v;
                        if (k === "telephone" && valueToSend) {
                            valueToSend = valueToSend
                                .toString()
                                .replace(/^225/, "");
                        }
                        formData.append(
                            `membres[${i}][${k}]`,
                            valueToSend ?? "",
                        );
                    }
                });
            });
        }

        formData.append("type", "conductor");
        formData.append("consentement", consentement ? "1" : "0");

        // 🔐 Récupérer et ajouter le token CSRF au FormData
        let csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");

        // Fallback si la meta n'existe pas - chercher dans window.axios
        if (
            !csrfToken &&
            window.axios?.defaults?.headers?.common?.["X-CSRF-TOKEN"]
        ) {
            csrfToken = window.axios.defaults.headers.common["X-CSRF-TOKEN"];
        }

        // ✅ Ajouter le token CSRF au FormData
        if (csrfToken) {
            formData.append("_token", csrfToken);
        }

        try {
            // ✅ Ne pas définir Content-Type - axios le fera automatiquement
            const headers = {};

            // Ajouter le token CSRF au header aussi (double sécurité)
            if (csrfToken) {
                headers["X-CSRF-TOKEN"] = csrfToken;
            }

            const res = await axios.post("/register/conducteur", formData, {
                headers: headers,
            });

            // Succès
            const message =
                res.data?.message || "Inscription soumise avec succès !";
            showSuccess(message);

            // Reset du formulaire
            setStep(1);
            setFamille({
                nom: "",
                adresse: "",
                quartier: "",
                ville: "",
                telephone: "",
                telephone2: "",
                classe_id: null,
            });
            setResponsable({
                nom: "",
                prenom: "",
                email: "",
                tel: "",
                telephone2: "",
                dateNaissance: "",
                genre: "",
                profession: "",
                employment_status: "",
                profession_detail: "",
                fonction_professionnelle: "",
                adresse: "",
                ville_id: null,
                statutMarital: "",
                dateMariage: "",
                lieuMariage: "",
                dateDivorce: "",
                lieuDivorce: "",
                dateDeces: "",
                lieuDeces: "",
                baptise: false,
                dateBapteme: "",
                lieuBapteme: "",
                premiereCommunion: false,
                datePremiereCommunion: "",
                lieuPremiereCommunion: "",
                marieReligieusement: false,
                dateMariageReligieux: "",
                lieuMariageReligieux: "",
                fonction: "",
                photo: null,
                photoPreview: null,
            });
            setMembres([]);
            setMembreTemp({
                nom: "",
                prenom: "",
                email: "",
                telephone: "",
                relation: "",
                genre: "",
                dateNaissance: "",
                statutMarital: "",
                dateMariage: "",
                lieuMariage: "",
                dateDivorce: "",
                lieuDivorce: "",
                dateDeces: "",
                lieuDeces: "",
                baptise: false,
                dateBapteme: "",
                lieuBapteme: "",
                premiereCommunion: false,
                datePremiereCommunion: "",
                lieuPremiereCommunion: "",
                marieReligieusement: false,
                dateMariageReligieux: "",
                lieuMariageReligieux: "",
                fonction: "",
                profession: "",
                employment_status: "",
                profession_detail: "",
                photo: null,
                photoPreview: null,
            });
            setConsentement(false);
            setSelectedCity(null);
            setClassesSearchTerm("");
            setVillesSearchTerm("");
            setAdresseInputValue("");

            // Effacer les données sauvegardées après soumission réussie
            clearFormPersistedData("registerConducteur_");
            localStorage.removeItem("registerWelcomeState");
        } catch (err) {
            const apiErrors = err?.response?.data?.errors || {};
            const apiMessage = err?.response?.data?.message;

            if (Object.keys(apiErrors).length > 0) {
                // Construire un message d'erreur clair et lisible pour le toast
                const errorList = Object.entries(apiErrors).flatMap(
                    ([field, messages]) => {
                        if (Array.isArray(messages)) {
                            return messages.map((msg) => msg);
                        }
                        return [messages];
                    },
                );

                const errorTitle = "⚠️ ERREURS DE VALIDATION";
                const errorBody = errorList.join("\n");
                const fullErrorMessage = `${errorTitle}\n\n${errorBody}`;

                showError(fullErrorMessage);
                handleServerErrors(
                    apiErrors,
                    "Veuillez corriger les erreurs ci-dessus.",
                );
                setStep(1);
            } else if (apiMessage) {
                showError(`${apiMessage}`);
            } else {
                showError(
                    "Une erreur est survenue lors de la soumission. Veuillez réessayer.",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const activites = [
        { key: "collecte", label: "Collecte / Logistique", icon: Package },
        { key: "evangelisation", label: "Évangélisation", icon: Megaphone },
        { key: "transport", label: "Transport", icon: Car },
        {
            key: "enseignement",
            label: "Enseignement biblique",
            icon: GraduationCap,
        },
    ];

    const filteredClasses = classesDatabase.filter((c) =>
        c.nom.toLowerCase().includes(classesSearchTerm.toLowerCase()),
    );
    const filteredVilles = villesDatabase.filter((v) =>
        v.nom.toLowerCase().includes(villesSearchTerm.toLowerCase()),
    );

    const renderStepForm = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <FormField
                            label="Nom de la famille"
                            icon={Home}
                            required
                        >
                            <input
                                ref={familyNameRef}
                                className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                value={famille.nom}
                                onChange={(e) =>
                                    setFamille({
                                        ...famille,
                                        nom: formatName(e.target.value),
                                    })
                                }
                                placeholder="EX: FAMILLE KOUAME"
                            />
                            {getFieldError("famille.nom") && (
                                <p className="text-red-500 text-xs mt-1">
                                    {getFieldError("famille.nom")}
                                </p>
                            )}
                        </FormField>

                        <FormField label="Adresse" icon={MapPin}>
                            <AddressAutocomplete
                                value={famille.adresse}
                                onChange={(value) =>
                                    setFamille({ ...famille, adresse: value })
                                }
                                onAddressSelect={(addressDetails) => {
                                    setFamille({
                                        ...famille,
                                        adresse: addressDetails.full_address,
                                    });
                                }}
                            />
                        </FormField>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Quartier" icon={MapPin} required>
                                <input
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 outline-none"
                                    placeholder="Ex: Riviera, Plateau, Yopougon..."
                                    value={famille.quartier}
                                    onChange={(e) =>
                                        setFamille({
                                            ...famille,
                                            quartier: e.target.value,
                                        })
                                    }
                                />
                            </FormField>
                            <FormField label="Ville" icon={Building} required>
                                <CitySelect
                                    value={famille.ville}
                                    onChange={(value) => {
                                        setFamille({
                                            ...famille,
                                            ville: value,
                                        });
                                    }}
                                    placeholder="Sélectionner une ville"
                                />
                                {getFieldError("famille.ville") && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {getFieldError("famille.ville")}
                                    </p>
                                )}
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Téléphone" icon={Phone} required>
                                <div className="flex">
                                    <span className="bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg px-3 flex items-center text-gray-600">
                                        +225
                                    </span>
                                    <input
                                        type="tel"
                                        className="flex-1 h-12 border border-gray-300 rounded-r-lg px-4 outline-none"
                                        placeholder="0102030405"
                                        maxLength="10"
                                        value={famille.telephone}
                                        onChange={(e) =>
                                            setFamille({
                                                ...famille,
                                                telephone: formatPhoneNumber(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                    />
                                </div>
                                {getFieldError("famille.telephone") && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {getFieldError("famille.telephone")}
                                    </p>
                                )}
                            </FormField>
                            <FormField label="Téléphone 2" icon={Phone}>
                                <div className="flex">
                                    <span className="bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg px-3 flex items-center text-gray-600">
                                        +225
                                    </span>
                                    <input
                                        className="flex-1 h-12 border border-gray-300 rounded-r-lg px-4 outline-none"
                                        placeholder="Optionnel (10 chiffres)"
                                        maxLength="10"
                                        value={famille.telephone2 || ""}
                                        onChange={(e) =>
                                            setFamille({
                                                ...famille,
                                                telephone2: formatPhoneNumber(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                    />
                                </div>
                            </FormField>
                        </div>

                        <FormField
                            label="Classe de la famille"
                            icon={BookOpen}
                            required
                        >
                            <Select2Classe
                                id="classe_id_select"
                                name="classe_id"
                                value={famille.classe_id || ""}
                                onChange={(e) =>
                                    setFamille({
                                        ...famille,
                                        classe_id: e.target.value
                                            ? parseInt(e.target.value, 10)
                                            : null,
                                    })
                                }
                                options={classesDatabase}
                                placeholder="Sélectionner une classe"
                            />
                            {getFieldError("famille.classe_id") && (
                                <p className="text-red-500 text-xs mt-1">
                                    {getFieldError("famille.classe_id")}
                                </p>
                            )}
                        </FormField>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Photo Upload avec background complet - LARGEUR COMPLÈTE */}
                        <div className="w-full p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-md">
                            <div className="flex flex-col items-center gap-3">
                                <h3 className="text-sm font-bold text-gray-800">
                                    Photo de profil
                                </h3>
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-white overflow-hidden border-3 border-blue-400 shadow-lg ring-3 ring-blue-100">
                                        {responsable.photoPreview ? (
                                            <img
                                                src={responsable.photoPreview}
                                                alt="profil"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                <User className="w-10 h-10 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <PhotoUploadInput
                                    size="md"
                                    enableCamera={true}
                                    initialPhotoUrl={responsable.photoPreview}
                                    onUploadStateChange={
                                        setIsResponsablePhotoUploading
                                    }
                                    onPhotoSelected={(photoUrl) => {
                                        setResponsable((prev) => ({
                                            ...prev,
                                            photo: photoUrl,
                                            photoPreview: photoUrl,
                                        }));
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Nom" icon={User} required>
                                <input
                                    ref={respNameRef}
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 outline-none uppercase"
                                    value={responsable.nom}
                                    onChange={(e) =>
                                        setResponsable({
                                            ...responsable,
                                            nom: formatName(e.target.value),
                                        })
                                    }
                                    placeholder="ex: DUPONT"
                                />
                                {getFieldError("responsable.nom") && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {getFieldError("responsable.nom")}
                                    </p>
                                )}
                            </FormField>
                            <FormField label="Prénom" icon={User} required>
                                <input
                                    ref={respPrenomRef}
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 outline-none capitalize"
                                    value={responsable.prenom}
                                    onChange={(e) =>
                                        setResponsable({
                                            ...responsable,
                                            prenom: formatPrenom(e.target.value),
                                        })
                                    }
                                    placeholder="ex: Jean"
                                />
                                {getFieldError("responsable.prenom") && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {getFieldError("responsable.prenom")}
                                    </p>
                                )}
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Email" icon={Mail} required>
                                <input
                                    ref={respEmailRef}
                                    type="email"
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 outline-none"
                                    value={responsable.email}
                                    onChange={(e) =>
                                        setResponsable({
                                            ...responsable,
                                            email: e.target.value,
                                        })
                                    }
                                    placeholder="ex: jean@email.com"
                                />
                                {getFieldError("responsable.email") && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {getFieldError("responsable.email")}
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
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 outline-none"
                                    value={responsable.dateNaissance}
                                    onChange={(e) =>
                                        setResponsable({
                                            ...responsable,
                                            dateNaissance: e.target.value,
                                        })
                                    }
                                />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                label="Téléphone 1"
                                icon={Phone}
                                required
                            >
                                <div className="flex">
                                    <span className="bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg px-3 flex items-center text-gray-600">
                                        +225
                                    </span>
                                    <input
                                        type="tel"
                                        className="flex-1 h-12 border border-gray-300 rounded-r-lg px-4 outline-none"
                                        placeholder="ex: 0102030405"
                                        maxLength="10"
                                        value={responsable.tel}
                                        onChange={(e) =>
                                            setResponsable({
                                                ...responsable,
                                                tel: formatPhoneNumber(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                    />
                                </div>
                                {getFieldError("responsable.tel") && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {getFieldError("responsable.tel")}
                                    </p>
                                )}
                            </FormField>
                            <FormField label="Téléphone 2" icon={Phone}>
                                <div className="flex">
                                    <span className="bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg px-3 flex items-center text-gray-600">
                                        +225
                                    </span>
                                    <input
                                        className="flex-1 h-12 border border-gray-300 rounded-r-lg px-4 outline-none"
                                        placeholder="ex: 0606070809 (optionnel)"
                                        maxLength="10"
                                        value={responsable.telephone2}
                                        onChange={(e) =>
                                            setResponsable({
                                                ...responsable,
                                                telephone2: formatPhoneNumber(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                    />
                                </div>
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Genre" icon={Users} required>
                                <select
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 bg-white"
                                    value={responsable.genre}
                                    onChange={(e) =>
                                        setResponsable({
                                            ...responsable,
                                            genre: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Sélectionner...</option>
                                    <option value="M">Masculin</option>
                                    <option value="F">Féminin</option>
                                </select>
                            </FormField>
                            <FormField
                                label="Lien de parenté"
                                icon={Users}
                                required
                                hint="Relation avec la famille"
                            >
                                <Select2Relation
                                    value={responsable.lienParente}
                                    onChange={(e) =>
                                        setResponsable({
                                            ...responsable,
                                            lienParente: e.target.value,
                                        })
                                    }
                                    placeholder="Sélectionner un lien de parenté"
                                />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                label="Statut d'emploi"
                                icon={Briefcase}
                                required
                            >
                                <select
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 outline-none focus:border-blue-500"
                                    value={responsable.employment_status || ""}
                                    onChange={(e) =>
                                        setResponsable({
                                            ...responsable,
                                            employment_status: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">
                                        Sélectionner un statut
                                    </option>
                                    <option value="TRAVAILLEUR">
                                        Travailleur(euse)
                                    </option>
                                    <option value="RETRAITE">
                                        Retraité(e)
                                    </option>
                                    <option value="ETUDIANT">
                                        Étudiant(e)
                                    </option>
                                    <option value="SANS_EMPLOI">
                                        Sans emploi
                                    </option>
                                </select>
                                {getFieldError(
                                    "responsable.employment_status",
                                ) && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {getFieldError(
                                            "responsable.employment_status",
                                        )}
                                    </p>
                                )}
                            </FormField>
                            <FormField
                                label="Profession / Activité"
                                icon={Briefcase}
                                required
                                hint="ex: Infirmier, Commerçant"
                            >
                                <input
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 outline-none focus:border-blue-500"
                                    value={responsable.profession_detail || ""}
                                    onChange={(e) =>
                                        setResponsable({
                                            ...responsable,
                                            profession_detail: e.target.value,
                                        })
                                    }
                                    placeholder="ex: Enseignant, Électricien"
                                />
                                {getFieldError(
                                    "responsable.profession_detail",
                                ) && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {getFieldError(
                                            "responsable.profession_detail",
                                        )}
                                    </p>
                                )}
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                label="Fonction dans l'église"
                                icon={Users}
                                hint="Cliquez pour sélectionner"
                            >
                                <Select2Fonction
                                    value={Array.from(
                                        selectedRolesResponsable,
                                    ).filter(Boolean)}
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        setSelectedRolesResponsable(
                                            e.target.value,
                                        );
                                        setResponsable({
                                            ...responsable,
                                            fonction: e.target.value.join(","),
                                        });
                                    }}
                                    options={churchRoles}
                                    placeholder="Sélectionner des fonctions..."
                                />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <FormField
                                label="Statut Marital"
                                icon={Heart}
                                required
                            >
                                <select
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 bg-white outline-none focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={responsable.statutMarital}
                                    onChange={(e) =>
                                        setResponsable({
                                            ...responsable,
                                            statutMarital: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Sélectionner...</option>
                                    <option value="celibataire">
                                        Célibataire
                                    </option>
                                    <option value="marie">Mariage Civil</option>
                                    <option value="divorce">Divorcé(e)</option>
                                    <option value="veuf">Veuf(ve)</option>
                                    <option value="dot">Dot</option>
                                </select>
                                {getFieldError("responsable.statutMarital") && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {getFieldError(
                                            "responsable.statutMarital",
                                        )}
                                    </p>
                                )}
                            </FormField>
                        </div>

                        {responsable.statutMarital === "marie" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        label="Date du mariage civil"
                                        icon={Calendar}
                                        required
                                    >
                                        <input
                                            type="date"
                                            className="w-full h-10 border border-gray-300 rounded-lg px-3 outline-none focus:border-blue-500"
                                            value={responsable.dateMariage}
                                            onChange={(e) =>
                                                setResponsable({
                                                    ...responsable,
                                                    dateMariage: e.target.value,
                                                })
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        label="Lieu du mariage civil"
                                        icon={Building}
                                        required
                                    >
                                        <input
                                            className="w-full h-10 border border-gray-300 rounded-lg px-3 outline-none focus:border-blue-500"
                                            value={responsable.lieuMariage}
                                            onChange={(e) =>
                                                setResponsable({
                                                    ...responsable,
                                                    lieuMariage: e.target.value,
                                                })
                                            }
                                            placeholder="ex: Mairie d'Abidjan"
                                        />
                                    </FormField>
                                </div>
                            </div>
                        )}
                        {responsable.statutMarital === "dot" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        label="Date de la dot"
                                        icon={Calendar}
                                        required
                                    >
                                        <input
                                            type="date"
                                            className="w-full h-10 border border-gray-300 rounded-lg px-3 outline-none focus:border-blue-500"
                                            value={responsable.dateDote}
                                            onChange={(e) =>
                                                setResponsable({
                                                    ...responsable,
                                                    dateDote: e.target.value,
                                                })
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        label="Lieu de la dot"
                                        icon={Building}
                                        required
                                    >
                                        <input
                                            className="w-full h-10 border border-gray-300 rounded-lg px-3 outline-none"
                                            value={responsable.lieuDote}
                                            onChange={(e) =>
                                                setResponsable({
                                                    ...responsable,
                                                    lieuDote: e.target.value,
                                                })
                                            }
                                            placeholder="ex: Domicile familial"
                                        />
                                    </FormField>
                                </div>
                            </div>
                        )}
                        {responsable.statutMarital === "divorce" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        label="Date du divorce"
                                        icon={Calendar}
                                        required
                                    >
                                        <input
                                            type="date"
                                            className="w-full h-10 border border-gray-300 rounded-lg px-3 outline-none"
                                            value={responsable.dateDivorce}
                                            onChange={(e) =>
                                                setResponsable({
                                                    ...responsable,
                                                    dateDivorce: e.target.value,
                                                })
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        label="Lieu du divorce"
                                        icon={Building}
                                    >
                                        <input
                                            className="w-full h-10 border border-gray-300 rounded-lg px-3 outline-none"
                                            value={responsable.lieuDivorce}
                                            onChange={(e) =>
                                                setResponsable({
                                                    ...responsable,
                                                    lieuDivorce: e.target.value,
                                                })
                                            }
                                            placeholder="ex: Tribunal"
                                        />
                                    </FormField>
                                </div>
                            </div>
                        )}
                        {responsable.statutMarital === "veuf" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        label="Date du décès du conjoint"
                                        icon={Calendar}
                                        required
                                    >
                                        <input
                                            type="date"
                                            className="w-full h-10 border border-gray-300 rounded-lg px-3 outline-none"
                                            value={responsable.dateDeces}
                                            onChange={(e) =>
                                                setResponsable({
                                                    ...responsable,
                                                    dateDeces: e.target.value,
                                                })
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        label="Lieu du décès"
                                        icon={Building}
                                    >
                                        <input
                                            className="w-full h-10 border border-gray-300 rounded-lg px-3 outline-none"
                                            value={responsable.lieuDeces}
                                            onChange={(e) =>
                                                setResponsable({
                                                    ...responsable,
                                                    lieuDeces: e.target.value,
                                                })
                                            }
                                            placeholder="ex: Hôpital"
                                        />
                                    </FormField>
                                </div>
                            </div>
                        )}

                        {/* Champs Religieux - Section Complète */}
                        <div className="border-t pt-6 mt-6">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Heart className="w-5 h-5 text-blue-600" />
                                Informations Religieuses
                            </h3>

                            {/* Baptême */}
                            <div className="space-y-3 mb-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={responsable.baptise === true}
                                        onChange={(e) =>
                                            setResponsable({
                                                ...responsable,
                                                baptise: e.target.checked,
                                                dateBapteme: e.target.checked
                                                    ? responsable.dateBapteme
                                                    : "",
                                                lieuBapteme: e.target.checked
                                                    ? responsable.lieuBapteme
                                                    : "",
                                            })
                                        }
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">
                                        Baptisé(e)
                                    </span>
                                </label>
                                {responsable.baptise === true && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-8 mt-3">
                                        <FormField label="Date du baptême">
                                            <input
                                                type="date"
                                                className="w-full h-10 border border-gray-300 rounded px-2 bg-white"
                                                value={responsable.dateBapteme}
                                                onChange={(e) =>
                                                    setResponsable({
                                                        ...responsable,
                                                        dateBapteme:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </FormField>
                                        <FormField label="Lieu du baptême">
                                            <input
                                                type="text"
                                                className="w-full h-10 border border-gray-300 rounded px-2"
                                                value={responsable.lieuBapteme}
                                                onChange={(e) =>
                                                    setResponsable({
                                                        ...responsable,
                                                        lieuBapteme:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </FormField>
                                    </div>
                                )}
                            </div>

                            {/* Première Communion */}
                            <div className="space-y-3 mb-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={
                                            responsable.premiereCommunion ===
                                            true
                                        }
                                        onChange={(e) =>
                                            setResponsable({
                                                ...responsable,
                                                premiereCommunion:
                                                    e.target.checked,
                                                datePremiereCommunion: e.target
                                                    .checked
                                                    ? responsable.datePremiereCommunion
                                                    : "",
                                                lieuPremiereCommunion: e.target
                                                    .checked
                                                    ? responsable.lieuPremiereCommunion
                                                    : "",
                                            })
                                        }
                                        className="w-5 h-5 rounded border-gray-300 text-purple-600"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">
                                        Première Communion
                                    </span>
                                </label>
                                {responsable.premiereCommunion === true && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-8 mt-3">
                                        <FormField label="Date de la première communion">
                                            <input
                                                type="date"
                                                className="w-full h-10 border border-gray-300 rounded px-2 bg-white"
                                                value={
                                                    responsable.datePremiereCommunion
                                                }
                                                onChange={(e) =>
                                                    setResponsable({
                                                        ...responsable,
                                                        datePremiereCommunion:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </FormField>
                                        <FormField label="Lieu de la première communion">
                                            <input
                                                type="text"
                                                className="w-full h-10 border border-gray-300 rounded px-2"
                                                value={
                                                    responsable.lieuPremiereCommunion
                                                }
                                                onChange={(e) =>
                                                    setResponsable({
                                                        ...responsable,
                                                        lieuPremiereCommunion:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </FormField>
                                    </div>
                                )}
                            </div>

                            {/* Mariage Religieux */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={
                                            responsable.marieReligieusement ===
                                            true
                                        }
                                        onChange={(e) =>
                                            setResponsable({
                                                ...responsable,
                                                marieReligieusement:
                                                    e.target.checked,
                                                dateMariageReligieux: e.target
                                                    .checked
                                                    ? responsable.dateMariageReligieux
                                                    : "",
                                                lieuMariageReligieux: e.target
                                                    .checked
                                                    ? responsable.lieuMariageReligieux
                                                    : "",
                                            })
                                        }
                                        className="w-5 h-5 rounded border-gray-300 text-pink-600"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">
                                        Marié(e) religieusement
                                    </span>
                                </label>
                                {responsable.marieReligieusement === true && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-8 mt-3">
                                        <FormField label="Date du mariage religieux">
                                            <input
                                                type="date"
                                                className="w-full h-10 border border-gray-300 rounded px-2 bg-white"
                                                value={
                                                    responsable.dateMariageReligieux
                                                }
                                                onChange={(e) =>
                                                    setResponsable({
                                                        ...responsable,
                                                        dateMariageReligieux:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </FormField>
                                        <FormField label="Lieu du mariage religieux">
                                            <input
                                                type="text"
                                                className="w-full h-10 border border-gray-300 rounded px-2"
                                                value={
                                                    responsable.lieuMariageReligieux
                                                }
                                                onChange={(e) =>
                                                    setResponsable({
                                                        ...responsable,
                                                        lieuMariageReligieux:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </FormField>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Section 1: Choice buttons - ALWAYS VISIBLE */}
                        {hasMembersToAdd === null && (
                            <div className="text-center space-y-6">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full">
                                    <Users className="w-10 h-10 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    Voulez-vous ajouter des membres à la
                                    famille?
                                </h3>
                                <p className="text-gray-600">
                                    Vous pouvez ajouter des enfants, conjoints,
                                    parents ou autres membres de la famille.
                                </p>

                                <div className="flex gap-4 justify-center pt-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setHasMembersToAdd(false)
                                        }
                                        className="px-8 py-3 rounded-lg bg-red-500 text-white font-semibold shadow-lg ring-2 ring-red-300 transition-all hover:bg-red-600"
                                    >
                                        Non, pas pour le moment
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setHasMembersToAdd(true)}
                                        className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105"
                                    >
                                        Oui, ajouter des membres
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Section 2: Confirmation message - shown if hasMembersToAdd === false */}
                        {hasMembersToAdd === false && (
                            <div className="text-center space-y-6 bg-blue-50 p-8 rounded-lg border border-blue-200">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    D'accord !
                                </h3>
                                <p className="text-gray-600">
                                    Vous pouvez continuer avec votre inscription
                                    sans ajouter de membres pour le moment.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setHasMembersToAdd(null)}
                                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                                >
                                    ← Revenir à la question
                                </button>
                            </div>
                        )}

                        {/* Section 3: Form - ONLY shown if hasMembersToAdd === true */}
                        {hasMembersToAdd === true && (
                            <>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 pt-6 border-t">
                                    Ajouter les membres de la famille
                                </h3>

                                {getFieldError("membres") && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {getFieldError("membres")}
                                    </div>
                                )}

                                {/* Form to add new member */}
                                <div
                                    className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm space-y-6"
                                    data-member-form
                                >
                                    {/* Photo Upload avec background complet - LARGEUR COMPLÈTE */}
                                    <div className="w-full p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-md">
                                        <div className="flex flex-col items-center gap-3">
                                            <h3 className="text-sm font-bold text-gray-800">
                                                Photo du membre
                                            </h3>
                                            <div className="relative">
                                                <div className="w-20 h-20 rounded-full bg-white overflow-hidden border-3 border-blue-400 shadow-lg ring-3 ring-blue-100">
                                                    {membreTemp.photoPreview ? (
                                                        <img
                                                            src={
                                                                membreTemp.photoPreview
                                                            }
                                                            alt="profil"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                            <Users className="w-10 h-10 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <PhotoUploadInput
                                                size="md"
                                                enableCamera={true}
                                                initialPhotoUrl={
                                                    membreTemp.photoPreview
                                                }
                                                onUploadStateChange={
                                                    setIsMemberPhotoUploading
                                                }
                                                onPhotoSelected={(photoUrl) => {
                                                    setMembreTemp((prev) => ({
                                                        ...prev,
                                                        photo: photoUrl,
                                                        photoPreview: photoUrl,
                                                    }));
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Identité: Nom, Prénom, Genre */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            label="Nom"
                                            icon={User}
                                            required
                                        >
                                            <input
                                                className={`${STYLES.input} uppercase`}
                                                value={membreTemp.nom}
                                                onChange={(e) =>
                                                    setMembreTemp({
                                                        ...membreTemp,
                                                        nom: e.target.value,
                                                    })
                                                }
                                                placeholder="Nom de famille"
                                            />
                                            {getFieldError("membre.nom") && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError(
                                                        "membre.nom",
                                                    )}
                                                </p>
                                            )}
                                        </FormField>
                                        <FormField
                                            label="Prénom"
                                            icon={User}
                                            required
                                        >
                                            <input
                                                className={`${STYLES.input} capitalize`}
                                                value={membreTemp.prenom}
                                                onChange={(e) =>
                                                    setMembreTemp({
                                                        ...membreTemp,
                                                        prenom: formatPrenom(
                                                            e.target.value,
                                                        ),
                                                    })
                                                }
                                                placeholder="Prénom"
                                            />
                                            {getFieldError("membre.prenom") && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError(
                                                        "membre.prenom",
                                                    )}
                                                </p>
                                            )}
                                        </FormField>
                                    </div>

                                    {/* Genre et Date de naissance */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            label="Genre"
                                            icon={Users}
                                            required
                                        >
                                            <select
                                                className={STYLES.input}
                                                value={membreTemp.genre}
                                                onChange={(e) =>
                                                    setMembreTemp({
                                                        ...membreTemp,
                                                        genre: e.target.value,
                                                    })
                                                }
                                            >
                                                <option value="">
                                                    Sélectionner...
                                                </option>
                                                <option value="M">
                                                    Masculin
                                                </option>
                                                <option value="F">
                                                    Féminin
                                                </option>
                                            </select>
                                            {getFieldError("membre.genre") && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError(
                                                        "membre.genre",
                                                    )}
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
                                                className={STYLES.input}
                                                value={membreTemp.dateNaissance}
                                                onChange={(e) =>
                                                    setMembreTemp({
                                                        ...membreTemp,
                                                        dateNaissance:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                            {getFieldError(
                                                "membre.dateNaissance",
                                            ) && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError(
                                                        "membre.dateNaissance",
                                                    )}
                                                </p>
                                            )}
                                        </FormField>
                                    </div>

                                    {/* Email et Téléphone */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField label="Email" icon={Mail}>
                                            <input
                                                type="email"
                                                className={STYLES.input}
                                                value={membreTemp.email}
                                                onChange={(e) =>
                                                    setMembreTemp({
                                                        ...membreTemp,
                                                        email: e.target.value,
                                                    })
                                                }
                                                placeholder="ex: jean.dupont@email.com"
                                            />
                                            {getFieldError("membre.email") && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError(
                                                        "membre.email",
                                                    )}
                                                </p>
                                            )}
                                        </FormField>
                                        <FormField
                                            label="Téléphone"
                                            icon={Phone}
                                            hint="Ex: 0102030405 (optionnel)"
                                        >
                                            <div className="flex">
                                                <span className="bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg px-3 flex items-center text-gray-600">
                                                    +225
                                                </span>
                                                <input
                                                    type="tel"
                                                    className="flex-1 h-12 border border-gray-300 rounded-r-lg px-4 outline-none"
                                                    value={membreTemp.telephone}
                                                    onChange={(e) =>
                                                        setMembreTemp({
                                                            ...membreTemp,
                                                            telephone:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="ex: 0102030405"
                                                    maxLength="10"
                                                />
                                            </div>
                                            {getFieldError(
                                                "membre.telephone",
                                            ) && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError(
                                                        "membre.telephone",
                                                    )}
                                                </p>
                                            )}
                                        </FormField>
                                    </div>
                                    {/* Fonction dans l'église et profession */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            label="Fonction dans l'église"
                                            icon={Users}
                                            hint="Sélectionnez une fonction"
                                        >
                                            <Select2Fonction
                                                value={Array.from(
                                                    selectedMembresRoles,
                                                )}
                                                onChange={(e) => {
                                                    // e.target.value est un array d'IDs
                                                    const newSet = new Set(
                                                        e.target.value,
                                                    );
                                                    setSelectedMembresRoles(
                                                        newSet,
                                                    );
                                                    setMembreTemp({
                                                        ...membreTemp,
                                                        fonction:
                                                            e.target.value.join(
                                                                ",",
                                                            ),
                                                    });
                                                }}
                                                options={churchRoles}
                                                placeholder="Sélectionner des fonctions..."
                                            />
                                        </FormField>
                                        <FormField
                                            label="Statut d'emploi"
                                            icon={Briefcase}
                                            required
                                        >
                                            <select
                                                className={STYLES.input}
                                                value={
                                                    membreTemp.employment_status ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setMembreTemp({
                                                        ...membreTemp,
                                                        employment_status:
                                                            e.target.value,
                                                    })
                                                }
                                            >
                                                <option value="">
                                                    Sélectionner un statut
                                                </option>
                                                <option value="TRAVAILLEUR">
                                                    Travailleur(euse)
                                                </option>
                                                <option value="RETRAITE">
                                                    Retraité(e)
                                                </option>
                                                <option value="ETUDIANT">
                                                    Étudiant(e)
                                                </option>
                                                <option value="SANS_EMPLOI">
                                                    Sans emploi
                                                </option>
                                            </select>
                                            {getFieldError(
                                                "membre.employment_status",
                                            ) && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError(
                                                        "membre.employment_status",
                                                    )}
                                                </p>
                                            )}
                                        </FormField>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            label="Profession / Activité"
                                            icon={Briefcase}
                                            required
                                        >
                                            <input
                                                className={STYLES.input}
                                                value={
                                                    membreTemp.profession_detail ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setMembreTemp({
                                                        ...membreTemp,
                                                        profession_detail:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="ex: Enseignant, Infirmier..."
                                            />
                                            {getFieldError(
                                                "membre.profession_detail",
                                            ) && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError(
                                                        "membre.profession_detail",
                                                    )}
                                                </p>
                                            )}
                                        </FormField>
                                    </div>
                                    {/* Lien de parenté et Statut marital */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            label="Lien de parenté"
                                            icon={Users}
                                            required
                                            hint="Relation avec le responsable"
                                        >
                                            <Select2Relation
                                                value={membreTemp.relation}
                                                onChange={(e) =>
                                                    setMembreTemp({
                                                        ...membreTemp,
                                                        relation:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="Sélectionner un lien de parenté"
                                            />
                                            {getFieldError(
                                                "membre.relation",
                                            ) && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError(
                                                        "membre.relation",
                                                    )}
                                                </p>
                                            )}
                                        </FormField>
                                        <FormField
                                            label="Statut marital"
                                            icon={Heart}
                                            required
                                        >
                                            <select
                                                className={STYLES.input}
                                                value={membreTemp.statutMarital}
                                                onChange={(e) =>
                                                    setMembreTemp({
                                                        ...membreTemp,
                                                        statutMarital:
                                                            e.target.value,
                                                    })
                                                }
                                            >
                                                <option value="">
                                                    Sélectionner...
                                                </option>
                                                <option value="celibataire">
                                                    Célibataire
                                                </option>
                                                <option value="marie">
                                                    Marié(e)
                                                </option>
                                                <option value="divorce">
                                                    Divorcé(e)
                                                </option>
                                                <option value="veuf">
                                                    Veuf(ve)
                                                </option>
                                                <option value="dot">Dot</option>
                                            </select>
                                            {getFieldError(
                                                "membre.statutMarital",
                                            ) && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError(
                                                        "membre.statutMarital",
                                                    )}
                                                </p>
                                            )}
                                        </FormField>
                                    </div>

                                    {membreTemp.statutMarital === "marie" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                                            <FormField
                                                label="Date du mariage"
                                                icon={Calendar}
                                                required
                                            >
                                                <input
                                                    type="date"
                                                    className={STYLES.input}
                                                    value={
                                                        membreTemp.dateMariage
                                                    }
                                                    onChange={(e) =>
                                                        setMembreTemp({
                                                            ...membreTemp,
                                                            dateMariage:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                                {getFieldError(
                                                    "membre.dateMariage",
                                                ) && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {getFieldError(
                                                            "membre.dateMariage",
                                                        )}
                                                    </p>
                                                )}
                                            </FormField>
                                            <FormField
                                                label="Lieu du mariage"
                                                icon={Building}
                                                required
                                            >
                                                <input
                                                    className={STYLES.input}
                                                    value={
                                                        membreTemp.lieuMariage
                                                    }
                                                    onChange={(e) =>
                                                        setMembreTemp({
                                                            ...membreTemp,
                                                            lieuMariage:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Ville, Pays..."
                                                />
                                                {getFieldError(
                                                    "membre.lieuMariage",
                                                ) && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {getFieldError(
                                                            "membre.lieuMariage",
                                                        )}
                                                    </p>
                                                )}
                                            </FormField>
                                        </div>
                                    )}

                                    {membreTemp.statutMarital === "divorce" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                                            <FormField
                                                label="Date du divorce"
                                                icon={Calendar}
                                                required
                                            >
                                                <input
                                                    type="date"
                                                    className={STYLES.input}
                                                    value={
                                                        membreTemp.dateDivorce
                                                    }
                                                    onChange={(e) =>
                                                        setMembreTemp({
                                                            ...membreTemp,
                                                            dateDivorce:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                                {getFieldError(
                                                    "membre.dateDivorce",
                                                ) && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {getFieldError(
                                                            "membre.dateDivorce",
                                                        )}
                                                    </p>
                                                )}
                                            </FormField>
                                            <FormField
                                                label="Lieu du divorce"
                                                icon={Building}
                                                required
                                            >
                                                <input
                                                    className={STYLES.input}
                                                    value={
                                                        membreTemp.lieuDivorce
                                                    }
                                                    onChange={(e) =>
                                                        setMembreTemp({
                                                            ...membreTemp,
                                                            lieuDivorce:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Ville, Pays..."
                                                />
                                                {getFieldError(
                                                    "membre.lieuDivorce",
                                                ) && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {getFieldError(
                                                            "membre.lieuDivorce",
                                                        )}
                                                    </p>
                                                )}
                                            </FormField>
                                        </div>
                                    )}

                                    {membreTemp.statutMarital === "veuf" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                                            <FormField
                                                label="Date du décès"
                                                icon={Calendar}
                                                required
                                            >
                                                <input
                                                    type="date"
                                                    className={STYLES.input}
                                                    value={membreTemp.dateDeces}
                                                    onChange={(e) =>
                                                        setMembreTemp({
                                                            ...membreTemp,
                                                            dateDeces:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                                {getFieldError(
                                                    "membre.dateDeces",
                                                ) && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {getFieldError(
                                                            "membre.dateDeces",
                                                        )}
                                                    </p>
                                                )}
                                            </FormField>
                                            <FormField
                                                label="Lieu du décès"
                                                icon={Building}
                                                required
                                            >
                                                <input
                                                    className={STYLES.input}
                                                    value={membreTemp.lieuDeces}
                                                    onChange={(e) =>
                                                        setMembreTemp({
                                                            ...membreTemp,
                                                            lieuDeces:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Ville, Pays..."
                                                />
                                                {getFieldError(
                                                    "membre.lieuDeces",
                                                ) && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {getFieldError(
                                                            "membre.lieuDeces",
                                                        )}
                                                    </p>
                                                )}
                                            </FormField>
                                        </div>
                                    )}

                                    {membreTemp.statutMarital === "dot" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                                            <FormField
                                                label="Date du dot"
                                                icon={Calendar}
                                                required
                                            >
                                                <input
                                                    type="date"
                                                    className={STYLES.input}
                                                    value={
                                                        membreTemp.dateDot || ""
                                                    }
                                                    onChange={(e) =>
                                                        setMembreTemp({
                                                            ...membreTemp,
                                                            dateDot:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                                {getFieldError(
                                                    "membre.dateDot",
                                                ) && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {getFieldError(
                                                            "membre.dateDot",
                                                        )}
                                                    </p>
                                                )}
                                            </FormField>
                                            <FormField
                                                label="Lieu du dot"
                                                icon={Building}
                                                required
                                            >
                                                <input
                                                    className={STYLES.input}
                                                    value={
                                                        membreTemp.lieuDot || ""
                                                    }
                                                    onChange={(e) =>
                                                        setMembreTemp({
                                                            ...membreTemp,
                                                            lieuDot:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="ex: Abidjan, Côte d'Ivoire"
                                                />
                                                {getFieldError(
                                                    "membre.lieuDot",
                                                ) && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {getFieldError(
                                                            "membre.lieuDot",
                                                        )}
                                                    </p>
                                                )}
                                            </FormField>
                                        </div>
                                    )}

                                    {/* Informations Spirituelles */}
                                    <div className="border-t pt-6 mt-6">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <Heart className="w-5 h-5 text-blue-600" />
                                            Informations Religieuses
                                        </h3>

                                        {/* Baptism section */}
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center gap-3 mb-4">
                                                <input
                                                    type="checkbox"
                                                    id="baptise"
                                                    className="h-5 w-5 text-blue-600 rounded"
                                                    checked={membreTemp.baptise}
                                                    onChange={(e) =>
                                                        setMembreTemp({
                                                            ...membreTemp,
                                                            baptise:
                                                                e.target
                                                                    .checked,
                                                        })
                                                    }
                                                />
                                                <label
                                                    htmlFor="baptise"
                                                    className="text-sm font-medium text-gray-700"
                                                >
                                                    Cette personne est baptisée
                                                </label>
                                            </div>

                                            {membreTemp.baptise && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                                                    <FormField label="Date de baptême">
                                                        <input
                                                            type="date"
                                                            className={
                                                                STYLES.input
                                                            }
                                                            value={
                                                                membreTemp.dateBapteme ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                setMembreTemp({
                                                                    ...membreTemp,
                                                                    dateBapteme:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                        />
                                                    </FormField>
                                                    <FormField label="Lieu de baptême">
                                                        <input
                                                            className={
                                                                STYLES.input
                                                            }
                                                            value={
                                                                membreTemp.lieuBapteme ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                setMembreTemp({
                                                                    ...membreTemp,
                                                                    lieuBapteme:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            placeholder="Église, Ville..."
                                                        />
                                                    </FormField>
                                                </div>
                                            )}
                                        </div>

                                        {/* Première Communion */}
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center gap-3 mb-4">
                                                <input
                                                    type="checkbox"
                                                    id="premiereCommunion"
                                                    className="h-5 w-5 text-purple-600 rounded"
                                                    checked={
                                                        membreTemp.premiereCommunion
                                                    }
                                                    onChange={(e) =>
                                                        setMembreTemp({
                                                            ...membreTemp,
                                                            premiereCommunion:
                                                                e.target
                                                                    .checked,
                                                        })
                                                    }
                                                />
                                                <label
                                                    htmlFor="premiereCommunion"
                                                    className="text-sm font-medium text-gray-700"
                                                >
                                                    Cette personne a fait sa
                                                    première communion
                                                </label>
                                            </div>

                                            {membreTemp.premiereCommunion && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                                                    <FormField label="Date de première communion">
                                                        <input
                                                            type="date"
                                                            className={
                                                                STYLES.input
                                                            }
                                                            value={
                                                                membreTemp.datePremiereCommunion ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                setMembreTemp({
                                                                    ...membreTemp,
                                                                    datePremiereCommunion:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                        />
                                                    </FormField>
                                                    <FormField label="Lieu de première communion">
                                                        <input
                                                            className={
                                                                STYLES.input
                                                            }
                                                            value={
                                                                membreTemp.lieuPremiereCommunion ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                setMembreTemp({
                                                                    ...membreTemp,
                                                                    lieuPremiereCommunion:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            placeholder="Église, Ville..."
                                                        />
                                                    </FormField>
                                                </div>
                                            )}
                                        </div>

                                        {/* Mariage Religieux */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 mb-4">
                                                <input
                                                    type="checkbox"
                                                    id="marieReligieusement"
                                                    className="h-5 w-5 text-pink-600 rounded"
                                                    checked={
                                                        membreTemp.marieReligieusement
                                                    }
                                                    onChange={(e) =>
                                                        setMembreTemp({
                                                            ...membreTemp,
                                                            marieReligieusement:
                                                                e.target
                                                                    .checked,
                                                        })
                                                    }
                                                />
                                                <label
                                                    htmlFor="marieReligieusement"
                                                    className="text-sm font-medium text-gray-700"
                                                >
                                                    Cette personne a été mariée
                                                    religieusement
                                                </label>
                                            </div>

                                            {membreTemp.marieReligieusement && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                                                    <FormField label="Date du mariage religieux">
                                                        <input
                                                            type="date"
                                                            className={
                                                                STYLES.input
                                                            }
                                                            value={
                                                                membreTemp.dateMariageReligieux ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                setMembreTemp({
                                                                    ...membreTemp,
                                                                    dateMariageReligieux:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                        />
                                                    </FormField>
                                                    <FormField label="Lieu du mariage religieux">
                                                        <input
                                                            className={
                                                                STYLES.input
                                                            }
                                                            value={
                                                                membreTemp.lieuMariageReligieux ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                setMembreTemp({
                                                                    ...membreTemp,
                                                                    lieuMariageReligieux:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            placeholder="Église, Ville..."
                                                        />
                                                    </FormField>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add/Edit button */}
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={ajouterMembre}
                                            className={`flex-1 ${STYLES.button.primary}`}
                                        >
                                            {editingMemberIndex !== null
                                                ? "Enregistrer les modifications"
                                                : "Ajouter ce membre"}
                                        </button>
                                        {editingMemberIndex !== null && (
                                            <button
                                                type="button"
                                                onClick={annulerEdition}
                                                className={
                                                    STYLES.button.secondary
                                                }
                                            >
                                                Annuler
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* List of added members */}
                                <div className="border-t pt-6">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                        Membres ajoutés ({membres.length})
                                    </h4>

                                    {membres.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>
                                                Aucun membre ajouté pour le
                                                moment
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {membres.map((m, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-4 bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        {/* Photo and Identity */}
                                                        <div className="flex items-start gap-4 flex-1">
                                                            <div
                                                                className={
                                                                    STYLES.photoContainer
                                                                }
                                                            >
                                                                {m.photoPreview ? (
                                                                    <img
                                                                        src={
                                                                            m.photoPreview
                                                                        }
                                                                        alt="photo"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <Users className="w-6 h-6 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-bold text-gray-800">
                                                                    {m.prenom}{" "}
                                                                    {m.nom}
                                                                </div>
                                                                <div className="text-sm text-gray-600 space-y-1 mt-2">
                                                                    <div>
                                                                        <span className="font-medium">
                                                                            Relation:
                                                                        </span>{" "}
                                                                        {
                                                                            m.relation
                                                                        }{" "}
                                                                        •{" "}
                                                                        {m.genre ===
                                                                        "M"
                                                                            ? "♂ Masculin"
                                                                            : "♀ Féminin"}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">
                                                                            Email:
                                                                        </span>{" "}
                                                                        {
                                                                            m.email
                                                                        }
                                                                    </div>
                                                                    {m.telephone && (
                                                                        <div>
                                                                            <span className="font-medium">
                                                                                Téléphone:
                                                                            </span>{" "}
                                                                            {
                                                                                m.telephone
                                                                            }
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <span className="font-medium">
                                                                            Né
                                                                            le:
                                                                        </span>{" "}
                                                                        {
                                                                            m.dateNaissance
                                                                        }
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">
                                                                            Statut:
                                                                        </span>{" "}
                                                                        {m.statutMarital ===
                                                                        "celibataire"
                                                                            ? "Célibataire"
                                                                            : m.statutMarital ===
                                                                                "marie"
                                                                              ? "Marié(e)"
                                                                              : m.statutMarital ===
                                                                                  "divorce"
                                                                                ? "Divorcé(e)"
                                                                                : "Veuf(ve)"}
                                                                    </div>
                                                                    {m.statutMarital ===
                                                                        "marie" && (
                                                                        <div className="text-xs text-blue-600">
                                                                            Marié
                                                                            le{" "}
                                                                            {
                                                                                m.dateMariage
                                                                            }{" "}
                                                                            à{" "}
                                                                            {
                                                                                m.lieuMariage
                                                                            }
                                                                        </div>
                                                                    )}
                                                                    {m.statutMarital ===
                                                                        "divorce" && (
                                                                        <div className="text-xs text-orange-600">
                                                                            Divorcé
                                                                            le{" "}
                                                                            {
                                                                                m.dateDivorce
                                                                            }{" "}
                                                                            à{" "}
                                                                            {
                                                                                m.lieuDivorce
                                                                            }
                                                                        </div>
                                                                    )}
                                                                    {m.statutMarital ===
                                                                        "veuf" && (
                                                                        <div className="text-xs text-gray-600">
                                                                            Décédé
                                                                            le{" "}
                                                                            {
                                                                                m.dateDeces
                                                                            }{" "}
                                                                            à{" "}
                                                                            {
                                                                                m.lieuDeces
                                                                            }
                                                                        </div>
                                                                    )}
                                                                    {m.baptise && (
                                                                        <div className="text-xs text-indigo-600">
                                                                            Baptisé
                                                                            {m.dateBapteme &&
                                                                                ` le ${m.dateBapteme}`}
                                                                            {m.lieuBapteme &&
                                                                                ` à ${m.lieuBapteme}`}
                                                                        </div>
                                                                    )}
                                                                    {m.fonction && (
                                                                        <div className="text-xs text-blue-600">
                                                                            <span className="font-medium">
                                                                                Fonction:
                                                                            </span>{" "}
                                                                            {
                                                                                m.fonction
                                                                            }
                                                                        </div>
                                                                    )}
                                                                    {m.profession && (
                                                                        <div className="text-xs text-gray-600">
                                                                            <span className="font-medium">
                                                                                Profession:
                                                                            </span>{" "}
                                                                            {
                                                                                m.profession
                                                                            }
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Delete button */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                supprimerMembre(
                                                                    idx,
                                                                )
                                                            }
                                                            className={
                                                                STYLES.button
                                                                    .danger
                                                            }
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                );

            case 4:
                const villeSelected = villesDatabase.find(
                    (v) => v.id == famille.ville,
                );
                const classeSelected = classesDatabase.find(
                    (c) => c.id == famille.classe_id,
                );
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
                            Vérification finale
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <h4 className="font-semibold text-blue-800 mb-2">
                                    Famille
                                </h4>
                                <ul className="text-sm space-y-1 text-gray-700">
                                    <li>
                                        <strong>Nom:</strong> {famille.nom}
                                    </li>
                                    <li>
                                        <strong>Ville:</strong>{" "}
                                        {villeSelected
                                            ? villeSelected.nom
                                            : famille.ville}
                                    </li>
                                    <li>
                                        <strong>Quartier:</strong>{" "}
                                        {famille.quartier}
                                    </li>
                                    <li>
                                        <strong>Adresse:</strong>{" "}
                                        {famille.adresse}
                                    </li>
                                    <li>
                                        <strong>Tel:</strong>{" "}
                                        {famille.telephone}
                                    </li>
                                    <li>
                                        <strong>Classe:</strong>{" "}
                                        {classeSelected
                                            ? classeSelected.nom
                                            : "Non sélectionnée"}
                                    </li>
                                </ul>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <h4 className="font-semibold text-green-800 mb-2">
                                    Responsable
                                </h4>
                                <ul className="text-sm space-y-1 text-gray-700">
                                    <li>
                                        <strong>Nom:</strong>{" "}
                                        {responsable.prenom} {responsable.nom}
                                    </li>
                                    <li>
                                        <strong>Email:</strong>{" "}
                                        {responsable.email}
                                    </li>
                                    <li>
                                        <strong>Tel:</strong> {responsable.tel}
                                    </li>
                                    <li>
                                        <strong>Statut d'emploi:</strong>{" "}
                                        {responsable.employment_status || "N/A"}
                                    </li>
                                    <li>
                                        <strong>Profession:</strong>{" "}
                                        {responsable.profession_detail || "N/A"}
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Membres de la
                                famille ({membres.length})
                            </h4>
                            {membres.length === 0 ? (
                                <p className="text-gray-500">
                                    Aucun membre ajouté
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {membres.map((m, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                {m.photoPreview ? (
                                                    <img
                                                        src={m.photoPreview}
                                                        alt="photo"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-bold">
                                                        {m.prenom?.[0]}
                                                        {m.nom?.[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-medium">
                                                {m.prenom} {m.nom}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {m.relation}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {m.genre === "M"
                                                    ? "Masculin"
                                                    : m.genre === "F"
                                                      ? "Féminin"
                                                      : ""}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {m.dateNaissance}
                                            </span>
                                            {m.baptise && (
                                                <span className="text-xs text-blue-600">
                                                    Baptisé
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="border-t pt-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={consentement}
                                    onChange={(e) =>
                                        setConsentement(e.target.checked)
                                    }
                                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">
                                    J'atteste l'exactitude de ces informations
                                    et accepte la politique de confidentialité
                                    de l'église.
                                </span>
                            </label>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div
                className="min-h-screen py-10 px-4"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                {/* Header avec lien retour */}
                <div className="max-w-4xl mx-auto mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-white hover:text-yellow-300 font-semibold transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Retour à l'accueil
                    </Link>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white">
                            Inscription Famille du Conducteur
                        </h1>
                        <p className="text-yellow-100">
                            Suivez les étapes pour enregistrer votre famille
                        </p>
                    </div>

                    <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                        <FormStepper
                            currentStep={step}
                            totalSteps={totalSteps}
                            labels={labels}
                            onStepClick={setStep}
                        />

                        <div className="p-6 md:p-10">
                            {renderStepForm()}

                            <div
                                className={`flex mt-8 gap-4 ${step === 1 ? "justify-end" : "justify-between"}`}
                            >
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setStep(step - 1)}
                                        className={`${STYLES.button.secondary} flex items-center gap-2`}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Retour</span>
                                    </button>
                                )}

                                {step < totalSteps ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (validateStep(step))
                                                setStep(step + 1);
                                        }}
                                        className={`${STYLES.button.primary} ml-auto flex items-center gap-2`}
                                    >
                                        <span>Continuer</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading || !consentement}
                                        className={`${STYLES.button.primary} ml-auto disabled:opacity-60 disabled:cursor-not-allowed disabled:transform disabled:hover:scale-100 flex items-center gap-2`}
                                    >
                                        {loading ? (
                                            "Envoi..."
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                <span>Soumettre</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
