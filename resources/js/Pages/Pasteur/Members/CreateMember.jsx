import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@inertiajs/react";
import {
    usePersistentState,
    clearFormPersistedData,
} from "../../../Hooks/usePersistentState";
import useToast from "../../../Hooks/useToast";
import ToastContainer from "../../../Components/ToastContainer";
import Select2Fonction from "../../../Components/Select2Fonction";
import Select2Relation from "../../../Components/Select2Relation";
import { sanitizeUppercasePrenom } from "../../../Helpers/nameSanitizers";
import {
    ArrowLeft,
    User,
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
} from "lucide-react";
import axios from "axios";
import { Inertia } from "@inertiajs/inertia";

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
                        onClick={(e) => e.stopPropagation()} // Empêcher le double déclenchement
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

export default function CreateMember({ family, errors }) {
    // États pour les données persistantes
    const [fonctions, setFonctions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    // Toast hook
    const { toasts, removeToast, success: showSuccess } = useToast();

    // Données du formulaire avec persistance
    const [data, setData] = usePersistentState(
        "createMember_data",
        {
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
        },
        { excludeKeys: ["photo", "photoPreview"] },
    );

    // Refs pour les inputs
    const nomRef = useRef(null);
    const prenomRef = useRef(null);
    const emailRef = useRef(null);

    // --- Effets ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const fonctionsRes = await axios.get("/api/fonctions");
                setFonctions(fonctionsRes.data);
            } catch (error) {
                console.error("Erreur:", error);
            }
        };
        fetchData();
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

    // --- Validation en temps réel ---
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
            case "fonction_id":
                if (!value) error = "La fonction est obligatoire";
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

    const handleFieldBlur = (fieldName) => {
        const error = validateField(fieldName, data[fieldName]);
        setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: error,
        }));
    };

    const handleFieldChange = (fieldName, value) => {
        setData({ ...data, [fieldName]: value });
        // Valider immédiatement et afficher l'erreur
        const error = validateField(fieldName, value);
        setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: error,
        }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Validation
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
        if (!data.fonction_id)
            newErrors.fonction_id = "La fonction est obligatoire";

        // Vérifier conditions statut marital
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

        setLoading(true);

        const formData = new FormData();

        // Données du membre
        Object.entries(data).forEach(([k, v]) => {
            if (k === "photo" && v) {
                formData.append("photo", v);
            } else if (k !== "photoPreview") {
                // Nettoyer le téléphone si présent
                let valueToSend = v;
                if (k === "telephone" && valueToSend) {
                    valueToSend = valueToSend.toString().replace(/^225/, "");
                }
                // Convert boolean to 0/1 for Laravel validation
                if (typeof v === "boolean") {
                    valueToSend = v ? "1" : "0";
                }
                formData.append(k, valueToSend ?? "");
            }
        });

        // Ajouter le token CSRF
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");
        if (csrfToken) {
            formData.append("_token", csrfToken);
        }

        try {
            const res = await axios.post(
                `/responsable-famille/members/store?family_id=${family.id}`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                },
            );

            // Succès - Afficher toast avec bouton Modifier
            const addedMemberData = res.data?.data || data; // Récupérer les données du membre depuis la réponse API

            showSuccess(
                "✅ Membre ajouté avec succès !",
                0, // durée infinie (0) jusqu'à ce que l'utilisateur clique sur Modifier ou ferme
                {
                    label: "Modifier",
                    onClick: () => {
                        // Remplir le formulaire avec les données du membre pour modification
                        setData((prev) => ({
                            ...prev,
                            ...addedMemberData,
                            photoPreview: prev.photoPreview, // Garder la preview photo
                        }));
                        // Focus sur le premier champ
                        setTimeout(() => nomRef.current?.focus(), 100);
                    },
                },
            );

            // Reset du formulaire après 2 secondes
            setTimeout(() => {
                setData({
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

                // Effacer les données sauvegardées après soumission réussie
                clearFormPersistedData("createMember_");
            }, 2000);

            // Revenir automatiquement à la page des inscriptions après courte pause
            setTimeout(() => {
                Inertia.get(
                    `/responsable-famille/inscriptions?family_id=${family.id}`,
                );
            }, 1500);
        } catch (err) {
            console.error("Erreur:", err);
            const apiErrors = err?.response?.data?.errors;
            if (apiErrors) {
                const errorMessages = Object.values(apiErrors)
                    .flat()
                    .join("\n");
                alert(`Erreur:\n${errorMessages}`);
            } else {
                alert("Une erreur est survenue.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Le fichier est trop volumineux (max 5MB).");
                return;
            }
            const preview = URL.createObjectURL(file);
            if (data.photoPreview) {
                URL.revokeObjectURL(data.photoPreview);
            }
            setData({
                ...data,
                photo: file,
                photoPreview: preview,
            });
        }
    };

    return (
        <div
            className="min-h-screen font-sans text-gray-800 selection:bg-purple-200"
            style={{
                background:
                    "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
            }}
        >
            {/* Toast Container */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header Compact */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/responsable-famille/inscriptions?family_id=${family.id}`}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-extrabold text-white tracking-tight">
                                Nouveau Membre
                            </h1>
                            <p className="text-blue-100 text-sm font-medium flex items-center gap-2">
                                Famille :{" "}
                                <span className="bg-white/20 px-2 py-0.5 rounded text-xs backdrop-blur-sm">
                                    {family.nom}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Formulaire en Grille Paysage */}
                <form
                    onSubmit={handleSubmit}
                    encType="multipart/form-data"
                    className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/50"
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
                                                    src={data.photoPreview}
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
                                    <FormField label="Nom" icon={User} required>
                                        <input
                                            ref={nomRef}
                                            className={`w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 uppercase ${
                                                fieldErrors.nom
                                                    ? "border-red-500 focus:border-red-500"
                                                    : "border-gray-300 focus:border-blue-500"
                                            }`}
                                            value={data.nom}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "nom",
                                                    formatPrenom(e.target.value),
                                                )
                                            }
                                            onBlur={() =>
                                                handleFieldBlur("nom")
                                            }
                                            placeholder="ex: DUPONT"
                                        />
                                        {(fieldErrors.nom || errors.nom) && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {fieldErrors.nom || errors.nom}
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
                                            value={data.prenom}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "prenom",
                                                    formatPrenom(e.target.value),
                                                )
                                            }
                                            onBlur={() =>
                                                handleFieldBlur("prenom")
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
                                        <select
                                            className={`w-full h-12 border rounded-lg px-4 bg-white focus:shadow-md focus:shadow-blue-200 transition-all duration-300 ${
                                                fieldErrors.genre
                                                    ? "border-red-500 focus:border-red-500"
                                                    : "border-gray-300 focus:border-blue-500"
                                            }`}
                                            value={data.genre}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "genre",
                                                    e.target.value,
                                                )
                                            }
                                            onBlur={() =>
                                                handleFieldBlur("genre")
                                            }
                                        >
                                            <option value="">
                                                Sélectionner...
                                            </option>
                                            <option value="M">Masculin</option>
                                            <option value="F">Féminin</option>
                                        </select>
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
                                            onBlur={() =>
                                                handleFieldBlur(
                                                    "date_naissance",
                                                )
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
                                    <FormField label="Email" icon={Mail}>
                                        <input
                                            ref={emailRef}
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
                                            onBlur={() =>
                                                handleFieldBlur("email")
                                            }
                                            placeholder="ex: jean.dupont@gmail.com"
                                        />
                                        {(fieldErrors.email ||
                                            errors.email) && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {fieldErrors.email ||
                                                    errors.email}
                                            </p>
                                        )}
                                    </FormField>
                                    <FormField label="Téléphone" icon={Phone}>
                                        <div className="flex">
                                            <span className="bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg px-3 flex items-center text-gray-600">
                                                +225
                                            </span>
                                            <input
                                                type="tel"
                                                className="flex-1 h-12 border border-gray-300 rounded-r-lg px-4 outline-none focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                value={data.telephone}
                                                onChange={(e) =>
                                                    setData({
                                                        ...data,
                                                        telephone:
                                                            formatPhoneNumber(
                                                                e.target.value,
                                                            ),
                                                    })
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
                                            onBlur={() =>
                                                handleFieldBlur("profession")
                                            }
                                            placeholder="ex: Enseignant, Commerçant"
                                        />
                                        {(fieldErrors.profession ||
                                            errors.profession) && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {fieldErrors.profession ||
                                                    errors.profession}
                                            </p>
                                        )}
                                    </FormField>
                                    <FormField
                                        label="Fonction dans l'église"
                                        icon={Users}
                                        required
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
                                                    e.target.value.length > 0
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
                                        {(fieldErrors.fonction_id ||
                                            errors.fonction_id) && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {fieldErrors.fonction_id ||
                                                    errors.fonction_id}
                                            </p>
                                        )}
                                    </FormField>
                                    <FormField
                                        label="Relation de Famille"
                                        icon={Users}
                                    >
                                        <Select2Relation
                                            value={data.relation}
                                            onChange={(e) =>
                                                setData({
                                                    ...data,
                                                    relation: e.target.value,
                                                })
                                            }
                                            placeholder="Sélectionner une relation..."
                                        />
                                        {errors.relation && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.relation}
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
                                        <select
                                            className="w-full h-12 border border-gray-300 rounded-lg px-4 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                            value={data.statut_marital}
                                            onChange={(e) =>
                                                setData({
                                                    ...data,
                                                    statut_marital:
                                                        e.target.value,
                                                })
                                            }
                                        >
                                            <option value="">
                                                Sélectionner...
                                            </option>
                                            <option value="Célibataire">
                                                Célibataire
                                            </option>
                                            <option value="Marié(e)">
                                                Marié(e)
                                            </option>
                                            <option value="Divorcé(e)">
                                                Divorcé(e)
                                            </option>
                                            <option value="Veuf(ve)">
                                                Veuf(ve)
                                            </option>
                                            <option value="Dote">
                                                Doté(e)
                                            </option>
                                        </select>
                                        {errors.statut_marital && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.statut_marital}
                                            </p>
                                        )}
                                    </FormField>

                                    {/* Afficher Date et Lieu Mariage SEULEMENT si statut marital !== Célibataire */}
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
                                                            setData({
                                                                ...data,
                                                                date_mariage:
                                                                    e.target
                                                                        .value,
                                                            })
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
                                                            setData({
                                                                ...data,
                                                                lieu_mariage:
                                                                    e.target
                                                                        .value,
                                                            })
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
                                    Sacrements & Vie Chrétienne
                                </h3>
                                <div className="space-y-3">
                                    <SacrementSection
                                        title="Baptême"
                                        icon={BookOpen}
                                        color="purple"
                                        checked={data.baptise}
                                        onChange={(val) =>
                                            setData({ ...data, baptise: val })
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
                                                            setData({
                                                                ...data,
                                                                date_bapteme:
                                                                    e.target
                                                                        .value,
                                                            })
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
                                                            setData({
                                                                ...data,
                                                                lieu_bapteme:
                                                                    e.target
                                                                        .value,
                                                            })
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
                                            setData({
                                                ...data,
                                                premiere_communion: val,
                                            })
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
                                                            setData({
                                                                ...data,
                                                                date_premiere_communion:
                                                                    e.target
                                                                        .value,
                                                            })
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
                                                            setData({
                                                                ...data,
                                                                lieu_premiere_communion:
                                                                    e.target
                                                                        .value,
                                                            })
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
                                            setData({
                                                ...data,
                                                marie_religieusement: val,
                                            })
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
                                                            setData({
                                                                ...data,
                                                                date_mariage_religieux:
                                                                    e.target
                                                                        .value,
                                                            })
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
                                                            setData({
                                                                ...data,
                                                                lieu_mariage_religieux:
                                                                    e.target
                                                                        .value,
                                                            })
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

                    {/* Footer Actions */}
                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                        <Link
                            href={`/responsable-famille/inscriptions?family_id=${family.id}`}
                            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <X className="w-4 h-4" /> Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform disabled:hover:scale-100 flex items-center gap-2"
                        >
                            {loading ? (
                                <>Enregistrement...</>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" /> Enregistrer le
                                    Membre
                                </>
                            )}
                        </button>
                    </div>
                </form>
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
}
