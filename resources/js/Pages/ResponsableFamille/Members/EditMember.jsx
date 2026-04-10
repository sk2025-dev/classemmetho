import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import axios from "axios";

import Select2Fonction from "../../../Components/Select2Fonction";
import Select2Single from "../../../Components/Select2Single";
import FormField from "@/Components/FormField";
import { resolveMemberPhotoUrl } from "../../../Helpers/PhotoHelper";
import { sanitizeUppercasePrenom } from "../../../Helpers/nameSanitizers";
import { withBasePath } from "../../../Utils/urlHelper";
import {
    GENDER_OPTIONS,
    MEMBER_MARITAL_STATUS_OPTIONS,
    RELATION_OPTIONS,
} from "../../../Helpers/select2SingleOptions";
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

// Fonction utilitaire pour formater les dates ISO en yyyy-MM-dd
const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    } catch (error) {
        return "";
    }
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
                        className={`w-5 h-5 rounded border-gray-300 cursor-pointer ${
                            color === "blue"
                                ? "text-blue-600 focus:ring-blue-500"
                                : color === "emerald"
                                  ? "text-emerald-600 focus:ring-emerald-500"
                                  : color === "rose"
                                    ? "text-rose-600 focus:ring-rose-500"
                                    : "text-gray-600 focus:ring-gray-500"
                        }`}
                    />
                    <Icon
                        className={`w-5 h-5 ${
                            color === "blue"
                                ? "text-blue-600"
                                : color === "emerald"
                                  ? "text-emerald-600"
                                  : color === "rose"
                                    ? "text-rose-600"
                                    : "text-gray-600"
                        }`}
                    />
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

export default function EditMember({ member, family }) {
    const [fonctions, setFonctions] = useState([]);
    const [fonctionsState, setFonctionsState] = useState([]);
    const [loading, setLoading] = useState(false);
    const currentDataRef = useRef(null);

    // Préparer les sacrements existants (maintenant c'est un objet unique)
    const sacrements = member.sacrements || {};

    // Données du formulaire
    const [data, setData] = useState({
        nom: member.nom || "",
        prenom: member.prenom || "",
        email: member.email || "",
        telephone: member.telephone || "",
        telephone2: member.telephone2 || "",
        genre: member.genre || "M",
        date_naissance: formatDateForInput(member.date_naissance),
        statut_marital: member.statut_marital || "",
        date_mariage: formatDateForInput(member.date_mariage),
        lieu_mariage: member.lieu_mariage || "",
        profession: member.profession || "",
        fonction_id: member.fonction_id || "",
        relation: member.relation || "",
        photo: null,
        photoPreview: resolveMemberPhotoUrl(member),
        originalPhotoPath: member.photo_path || null,
        baptise: sacrements.baptise || false,
        date_bapteme: formatDateForInput(sacrements.bapteme_date),
        lieu_bapteme: sacrements.bapteme_lieu || "",
        premiere_communion: sacrements.premiere_communion || false,
        date_premiere_communion: formatDateForInput(
            sacrements.premiere_communion_date,
        ),
        lieu_premiere_communion: sacrements.premiere_communion_lieu || "",
        marie_religieusement: sacrements.marie_religieusement || false,
        date_mariage_religieux: formatDateForInput(
            sacrements.mariage_religieux_date,
        ),
        lieu_mariage_religieux: sacrements.mariage_religieux_lieu || "",
    });

    // Réinitialiser les données quand le membre change
    useEffect(() => {
        const currentSacrements = member.sacrements || {};

        const initialData = {
            nom: member.nom || "",
            prenom: member.prenom || "",
            email: member.email || "",
            telephone: member.telephone || "",
            telephone2: member.telephone2 || "",
            genre: member.genre || "M",
            date_naissance: formatDateForInput(member.date_naissance),
            statut_marital: member.statut_marital || "",
            date_mariage: formatDateForInput(member.date_mariage),
            lieu_mariage: member.lieu_mariage || "",
            profession: member.profession || "",
            fonction_id: member.fonction_id || "",
            relation: member.relation || "",
            photo: null,
            photoPreview: resolveMemberPhotoUrl(member),
            originalPhotoPath: member.photo_path || null,
            baptise: currentSacrements.baptise || false,
            date_bapteme: formatDateForInput(currentSacrements.bapteme_date),
            lieu_bapteme: currentSacrements.bapteme_lieu || "",
            premiere_communion: currentSacrements.premiere_communion || false,
            date_premiere_communion: formatDateForInput(
                currentSacrements.premiere_communion_date,
            ),
            lieu_premiere_communion:
                currentSacrements.premiere_communion_lieu || "",
            marie_religieusement:
                currentSacrements.marie_religieusement || false,
            date_mariage_religieux: formatDateForInput(
                currentSacrements.mariage_religieux_date,
            ),
            lieu_mariage_religieux:
                currentSacrements.mariage_religieux_lieu || "",
        };

        setData(initialData);
        currentDataRef.current = initialData;
    }, [member.id]);

    // Charger les fonctions depuis l'API
    useEffect(() => {
        const loadFonctions = async () => {
            try {
                const fonctionsRes = await axios.get(
                    withBasePath("", "/api/fonctions"),
                );
                setFonctions(fonctionsRes.data);
            } catch (error) {
                console.error(
                    "Erreur lors du chargement des fonctions:",
                    error,
                );
            }
        };
        loadFonctions();
    }, []);

    useEffect(() => {
        setFonctionsState(fonctions || []);
    }, [fonctions]);

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Le fichier est trop volumineux (max 5MB).");
                return;
            }
            const preview = URL.createObjectURL(file);
            if (data.photoPreview && data.photoPreview.startsWith("blob:")) {
                URL.revokeObjectURL(data.photoPreview);
            }
            setData({ ...data, photo: file, photoPreview: preview });
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        setLoading(true);

        // Logging pour débugger
        console.log("Données à envoyer:", JSON.stringify(data, null, 2));

        // Valider que les champs requis ne sont pas vides
        if (!data.nom || !data.nom.trim()) {
            alert("Le nom est obligatoire");
            setLoading(false);
            return;
        }
        if (!data.prenom || !data.prenom.trim()) {
            alert("Le prénom est obligatoire");
            setLoading(false);
            return;
        }
        if (!data.genre) {
            alert("Le genre est obligatoire");
            setLoading(false);
            return;
        }

        // Préparer les données - utiliser FormData si une photo est envoyée, sinon JSON
        const hasPhotoFile = data.photo instanceof File;

        if (hasPhotoFile) {
            // Utiliser FormData si une photo a été sélectionnée
            const formData = new FormData();

            Object.entries(data).forEach(([k, v]) => {
                // Exclure les champs internes
                if (k === "photoPreview" || k === "originalPhotoPath") {
                    return;
                }

                // Gérer les booléens - envoyer comme '0' ou '1'
                if (
                    k === "baptise" ||
                    k === "premiere_communion" ||
                    k === "marie_religieusement"
                ) {
                    formData.append(k, v ? "1" : "0");
                    return;
                }

                // Inclure tous les autres champs
                formData.append(k, v ?? "");
            });

            console.log("Données FormData prêtes pour envoi");

            // Envoyer via router avec FormData
            router.post(
                `/responsable-famille/members/${member.id}?_method=PUT`,
                formData,
                {
                    onSuccess: () => {
                        alert("Modifications sauvegardées avec succès !");
                        clearFormPersistedData("editMember_");
                        window.localStorage.removeItem("editMember_memberId");
                    },
                    onError: (errors) => {
                        console.error(
                            "Erreurs de validation:",
                            JSON.stringify(errors, null, 2),
                        );
                        const errorMessages = Object.entries(errors).map(
                            ([field, message]) => {
                                return `${field}: ${message}`;
                            },
                        );
                        alert(
                            `Erreur de validation:\n${errorMessages.join("\n")}`,
                        );
                    },
                    onFinish: () => {
                        setLoading(false);
                    },
                },
            );
        } else {
            // Utiliser JSON pour les données simples (sans photo)
            const submitData = {};

            Object.entries(data).forEach(([k, v]) => {
                // Exclure les champs internes et le champ photo si vide
                if (
                    k === "photoPreview" ||
                    k === "originalPhotoPath" ||
                    k === "photo"
                ) {
                    return;
                }

                // Gérer les booléens - envoyer comme '0' ou '1'
                if (
                    k === "baptise" ||
                    k === "premiere_communion" ||
                    k === "marie_religieusement"
                ) {
                    submitData[k] = v ? "1" : "0";
                    return;
                }

                // Inclure tous les autres champs
                submitData[k] = v;
            });

            console.log("Données JSON prêtes pour envoi:", submitData);

            // Utiliser Inertia router.put() pour les données JSON
            router.put(
                `/responsable-famille/members/${member.id}`,
                submitData,
                {
                    onSuccess: () => {
                        alert("Modifications sauvegardées avec succès !");
                        clearFormPersistedData("editMember_");
                        window.localStorage.removeItem("editMember_memberId");
                    },
                    onError: (errors) => {
                        console.error(
                            "Erreurs de validation:",
                            JSON.stringify(errors, null, 2),
                        );
                        const errorMessages = Object.entries(errors).map(
                            ([field, message]) => {
                                return `${field}: ${message}`;
                            },
                        );
                        alert(
                            `Erreur de validation:\n${errorMessages.join("\n")}`,
                        );
                    },
                    onFinish: () => {
                        setLoading(false);
                    },
                },
            );
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href={withBasePath(
                            "",
                            `/responsable-famille/members/${member.id}`,
                        )}
                        className="p-2 bg-white/90 backdrop-blur-xl rounded-full border border-white/50 shadow-lg hover:shadow-xl hover:bg-white transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                            Modifier {member.prenom} {member.nom}
                        </h1>
                        <p className="text-white/80 text-sm">
                            Mettez à jour les informations du membre
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    encType="multipart/form-data"
                    className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/50"
                >
                    {/* Photo Section */}
                    <section className="mb-8 p-6 border border-gray-200 rounded-xl bg-white">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b">
                            <User className="w-5 h-5 text-blue-600" />
                            Photo de Profil
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            {/* Preview */}
                            <div className="relative">
                                <div className="w-40 h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden border-3 border-gray-300 shadow-sm">
                                    {data.photoPreview ? (
                                        <img
                                            src={data.photoPreview}
                                            alt="Aperçu photo"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                            <User className="w-16 h-16 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex-1 space-y-3">
                                <div>
                                    <input
                                        type="file"
                                        id="photoInput"
                                        onChange={handlePhotoChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="photoInput"
                                        className="flex"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                document
                                                    .getElementById(
                                                        "photoInput",
                                                    )
                                                    .click()
                                            }
                                            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                                        >
                                            <Award className="w-4 h-4" />
                                            Changer la photo
                                        </button>
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 italic">
                                    Formats acceptés: JPEG, PNG, GIF (max 5MB)
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Section Personnelle */}
                        <section className="space-y-4 p-6 border border-gray-200 rounded-xl bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">
                                Informations Personnelles
                            </h2>

                            <FormField label="Nom" icon={User} required>
                                <input
                                    type="text"
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={data.nom}
                                    onChange={(e) => {
                                        const newData = {
                                            ...data,
                                            nom: e.target.value,
                                        };
                                        setData(newData);
                                        currentDataRef.current = newData;
                                    }}
                                />
                            </FormField>

                            <FormField label="Prénom" icon={User} required>
                                <input
                                    type="text"
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={data.prenom}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            prenom: sanitizeUppercasePrenom(
                                                e.target.value,
                                            ),
                                        })
                                    }
                                />
                            </FormField>

                            <FormField label="Email" icon={Mail}>
                                <input
                                    type="email"
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            email: e.target.value,
                                        })
                                    }
                                />
                            </FormField>

                            <FormField label="Téléphone" icon={Phone}>
                                <input
                                    type="tel"
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={data.telephone}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            telephone: e.target.value,
                                        })
                                    }
                                />
                            </FormField>

                            <FormField label="Téléphone (autre)" icon={Phone}>
                                <input
                                    type="tel"
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={data.telephone2}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            telephone2: e.target.value,
                                        })
                                    }
                                />
                            </FormField>

                            <FormField label="Genre" required>
                                <Select2Single
                                    name="genre"
                                    value={data.genre}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            genre: e.target.value,
                                        })
                                    }
                                    options={GENDER_OPTIONS}
                                    placeholder="Sélectionner..."
                                />
                            </FormField>

                            <FormField
                                label="Date de Naissance"
                                icon={Calendar}
                            >
                                <input
                                    type="date"
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={data.date_naissance}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            date_naissance: e.target.value,
                                        })
                                    }
                                />
                            </FormField>
                        </section>

                        {/* Section Professionnelle */}
                        <section className="space-y-4 p-6 border border-gray-200 rounded-xl bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">
                                Informations Professionnelles
                            </h2>

                            <FormField label="Profession" icon={Briefcase}>
                                <input
                                    type="text"
                                    className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={data.profession}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            profession: e.target.value,
                                        })
                                    }
                                />
                            </FormField>

                            <FormField
                                label="Fonction dans l'Église"
                                icon={Award}
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
                                        setData({
                                            ...data,
                                            fonction_id: value,
                                        });
                                    }}
                                    options={fonctionsState}
                                    placeholder="S\u00e9lectionner une fonction..."
                                />
                            </FormField>

                            <FormField label="Relation de Famille" icon={Users}>
                                <Select2Single
                                    name="relation"
                                    value={data.relation}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            relation: e.target.value,
                                        })
                                    }
                                    options={RELATION_OPTIONS}
                                    placeholder="Sélectionner une relation..."
                                />
                            </FormField>

                            <FormField label="Statut Marital">
                                <Select2Single
                                    name="statut_marital"
                                    value={data.statut_marital}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            statut_marital: e.target.value,
                                        })
                                    }
                                    options={MEMBER_MARITAL_STATUS_OPTIONS}
                                    placeholder="Sélectionner..."
                                />
                            </FormField>

                            {/* Afficher Date et Lieu de Mariage SEULEMENT si statut marital !== Célibataire */}
                            {data.statut_marital &&
                                data.statut_marital !== "Célibataire" && (
                                    <>
                                        <FormField
                                            label="Date de Mariage"
                                            icon={Calendar}
                                        >
                                            <input
                                                type="date"
                                                className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                value={data.date_mariage}
                                                onChange={(e) =>
                                                    setData({
                                                        ...data,
                                                        date_mariage:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </FormField>

                                        <FormField
                                            label="Lieu de Mariage"
                                            icon={MapPin}
                                        >
                                            <input
                                                type="text"
                                                className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                value={data.lieu_mariage}
                                                onChange={(e) =>
                                                    setData({
                                                        ...data,
                                                        lieu_mariage:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </FormField>
                                    </>
                                )}
                        </section>
                    </div>

                    {/* Section Sacrements */}
                    <section className="mt-6 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">
                            Sacrements Religieux
                        </h2>

                        <SacrementSection
                            title="Baptême"
                            icon={Gift}
                            color="blue"
                            checked={data.baptise}
                            onChange={(checked) =>
                                setData({ ...data, baptise: checked })
                            }
                        >
                            <FormField label="Date du Baptême" icon={Calendar}>
                                <input
                                    type="date"
                                    className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={data.date_bapteme}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            date_bapteme: e.target.value,
                                        })
                                    }
                                />
                            </FormField>
                            <FormField label="Lieu du Baptême" icon={MapPin}>
                                <input
                                    type="text"
                                    className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={data.lieu_bapteme}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            lieu_bapteme: e.target.value,
                                        })
                                    }
                                />
                            </FormField>
                        </SacrementSection>

                        <SacrementSection
                            title="Première Communion"
                            icon={Gift}
                            color="emerald"
                            checked={data.premiere_communion}
                            onChange={(checked) =>
                                setData({
                                    ...data,
                                    premiere_communion: checked,
                                })
                            }
                        >
                            <FormField
                                label="Date de la Première Communion"
                                icon={Calendar}
                            >
                                <input
                                    type="date"
                                    className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={data.date_premiere_communion}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            date_premiere_communion:
                                                e.target.value,
                                        })
                                    }
                                />
                            </FormField>
                            <FormField label="Lieu" icon={MapPin}>
                                <input
                                    type="text"
                                    className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={data.lieu_premiere_communion}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            lieu_premiere_communion:
                                                e.target.value,
                                        })
                                    }
                                />
                            </FormField>
                        </SacrementSection>

                        <SacrementSection
                            title="Mariage Religieux"
                            icon={Heart}
                            color="rose"
                            checked={data.marie_religieusement}
                            onChange={(checked) =>
                                setData({
                                    ...data,
                                    marie_religieusement: checked,
                                })
                            }
                        >
                            <FormField
                                label="Date du Mariage Religieux"
                                icon={Calendar}
                            >
                                <input
                                    type="date"
                                    className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={data.date_mariage_religieux}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            date_mariage_religieux:
                                                e.target.value,
                                        })
                                    }
                                />
                            </FormField>
                            <FormField
                                label="Lieu du Mariage Religieux"
                                icon={MapPin}
                            >
                                <input
                                    type="text"
                                    className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                    value={data.lieu_mariage_religieux}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            lieu_mariage_religieux:
                                                e.target.value,
                                        })
                                    }
                                />
                            </FormField>
                        </SacrementSection>
                    </section>

                    {/* Footer Actions */}
                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                        <Link
                            href={withBasePath(
                                "",
                                `/responsable-famille/members/${member.id}`,
                            )}
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
                                    <Check className="w-4 h-4" /> Modifier le
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
                        transform: translateY(-10px);
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
