import React, { useState, useEffect } from "react";
import { router, Link } from "@inertiajs/react";

// Import des composants séparés
import { CustomStyles, ValidationModal } from "./components/AdminShared";
import AdminHeader from "./components/AdminHeader";
import { ToastContainer, useToast } from "../../Components/Toast";

import TabUtilisateurs from "./Tabs/TabUtilisateurs";
import TabFamille from "./Tabs/TabFamille";
import TabClasses from "./Tabs/TabClasse";
import TabFonctions from "./Tabs/TabFonctions";
import { withBasePath } from "../../Utils/urlHelper";

export default function AdminPage({
    auth,
    dataByType: initialDataByType = {},
    membersByFamily: initialMembersByFamily = {},
    membersByFamilyCode: initialMembersByFamilyCode = {},
    membersByResponsible: initialMembersByResponsible = {},
    membres: initialMembres = [], // ✅ Liste des membres (utilisateurs)
    availableClasses: initialAvailableClasses = [], // ✅ Classes disponibles
    availableFonctions: initialAvailableFonctions = [], // ✅ Fonctions disponibles
    total_users_count = 0, // ✅ Total global des personnes
}) {
    // Lire le query param 'tab' depuis l'URL pour conserver l'onglet actif après un reload
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get("tab");
    const defaultTab = tabFromUrl || "utilisateurs";

    const [activeTab, setActiveTab] = React.useState(defaultTab);
    const [selectedForValidation, setSelectedForValidation] =
        React.useState(null);
    const [isValidationModalOpen, setIsValidationModalOpen] =
        React.useState(false);
    const [showToggleClasseModal, setShowToggleClasseModal] =
        React.useState(false);
    const [selectedClasseForToggle, setSelectedClasseForToggle] =
        React.useState(null);

    const tabList = [
        { id: "utilisateurs", label: "Utilisateurs" },
        { id: "familles", label: "Familles" },
        { id: "classes", label: "Classes" },
        { id: "fonctions", label: "Fonctions" },
    ];

    // Toast state
    const [toasts, setToasts] = useState([]);
    const toast = useToast({ toasts, setToasts });

    // États pour synchroniser les données en temps réel
    const [classesData, setClassesData] = React.useState(
        initialDataByType?.classes || [],
    );
    const [membresData, setMembresData] = React.useState(initialMembres || []);
    const [fonctions, setFonctions] = React.useState(initialAvailableFonctions);

    // Synchroniser l'état local quand Inertia renvoie de nouvelles données
    useEffect(() => {
        setClassesData(initialDataByType?.classes || []);
    }, [initialDataByType?.classes]);

    useEffect(() => {
        setMembresData(initialMembres || []);
    }, [initialMembres]);

    // --- LOGIQUE D'APPEL API ---

    // Classes
    const handleSaveClass = (newClassData) => {
        router.post(withBasePath("", "/admin/classes"), newClassData, {
            onSuccess: () => {
                toast.success("Classe créée avec succès");
                // Recharger les classes
                fetch(withBasePath("", "/api/admin/classes"), {
                    headers: { Accept: "application/json" },
                })
                    .then((r) => r.json())
                    .then((data) => {
                        if (data.success) setClassesData(data.classes || []);
                    });
                router.reload({ only: ["availableClasses"] });
            },
            onError: (errors) => {
                console.error("Erreur création classe:", errors);
                toast.error("Erreur lors de la création de la classe");
            },
        });
    };

    const handleUpdateClass = (updatedClass) => {
        router.put(
            withBasePath("", `/admin/classes/${updatedClass.id}`),
            updatedClass,
            {
                onSuccess: () => {
                    toast.success("Classe mise à jour avec succès");
                    router.reload({ only: ["availableClasses"] });
                },
                onError: (errors) => {
                    console.error("Erreur modification classe:", errors);
                    toast.error("Erreur lors de la modification de la classe");
                },
            },
        );
    };

    const handleDeleteClass = (classe) => {
        return new Promise((resolve, reject) => {
            console.log(
                "🗑️ handleDeleteClass appelé pour:",
                classe.nom,
                "ID:",
                classe.id,
            );

            // Vérifier si la classe a des membres actifs
            if (classe.membres_active_count > 0) {
                const msg = `Impossible de supprimer: cette classe contient ${classe.membres_active_count} membre(s) actif(s). Veuillez d'abord désactiver la classe.`;
                toast.error(`❌ ${msg}`);
                reject(new Error(msg));
                return;
            }

            console.log(
                "✅ Classe vide, envoi DELETE request via router.delete()",
            );

            router.delete(withBasePath("", `/admin/classes/${classe.id}`), {
                onSuccess: (page) => {
                    console.log("✅ DELETE réussi");
                    toast.success(
                        `Classe "${classe.nom}" supprimée avec succès`,
                    );

                    // ✅ Mettre à jour l'état des classes en supprimant la classe
                    setClassesData((prevClasses) =>
                        prevClasses.filter((c) => c.id !== classe.id),
                    );

                    // Force un reload après un court délai
                    setTimeout(() => {
                        console.log(
                            "🔄 Rechargement de la page via window.location.reload()...",
                        );
                        window.location.reload(true);
                    }, 1500);

                    resolve();
                },
                onError: (errors) => {
                    console.log("❌ DELETE Error:", errors);
                    let errorMsg = "Erreur lors de la suppression de la classe";

                    if (errors?.error) {
                        errorMsg = errors.error;
                    } else if (errors?.message) {
                        errorMsg = errors.message;
                    }

                    toast.error(`❌ ${errorMsg}`);
                    reject(new Error(errorMsg));
                },
            });
        });
    };

    const handleToggleClasseStatus = (classe) => {
        setSelectedClasseForToggle(classe);
        setShowToggleClasseModal(true);
    };

    const handleConfirmToggleClasse = () => {
        if (!selectedClasseForToggle) return;

        const newStatus =
            selectedClasseForToggle.status === "active" ? "inactive" : "active";
        const textAction = newStatus === "inactive" ? "désactiver" : "activer";

        router.patch(
            withBasePath(
                "",
                `/admin/classes/${selectedClasseForToggle.id}/status`,
            ),
            { status: newStatus },
            {
                onSuccess: () => {
                    toast.success(
                        `Classe "${selectedClasseForToggle.nom}" ${textAction}e avec succès. Les membres ont été ${newStatus === "inactive" ? "désactivés" : "activés"}.`,
                    );
                    setShowToggleClasseModal(false);
                    setSelectedClasseForToggle(null);
                    setTimeout(() => {
                        router.visit(
                            withBasePath("", "/admin/administration"),
                            {
                                method: "get",
                                replace: true,
                                preserveScroll: false,
                                preserveState: false,
                            },
                        );
                    }, 500);
                },
                onError: (errors) => {
                    console.error("Erreur changement de statut:", errors);
                    toast.error(
                        "Erreur lors du changement de statut de la classe",
                    );
                    setShowToggleClasseModal(false);
                    setSelectedClasseForToggle(null);
                },
            },
        );
    };

    // Membres
    const handleUpdateMember = (updatedMember) => {
        router.put(
            withBasePath("", `/admin/membres/${updatedMember.id}`),
            updatedMember,
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Membre modifié avec succès"),
                onError: (errors) => {
                    console.error("Erreur modification membre:", errors);
                    toast.error("Erreur lors de la modification du membre");
                },
            },
        );
    };

    const handleDeleteMember = (member) => {
        router.delete(withBasePath("", `/admin/membres/${member.id}`), {
            preserveScroll: true,
            onSuccess: () => {
                setMembresData((prev) => prev.filter((m) => m.id !== member.id));
                toast.success("Membre supprimé avec succès");
            },
            onError: (errors) => {
                console.error("Erreur suppression membre:", errors);
                toast.error("Erreur lors de la suppression du membre");
            },
        });
    };

    const handleToggleMember = (member) => {
        const newStatus = member.is_active ? "inactif" : "actif";
        router.patch(
            withBasePath("", `/admin/membres/${member.id}/status`),
            {
                statut: newStatus,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    const displayStatus = member.is_active
                        ? "désactivé"
                        : "activé";
                    setMembresData((prev) =>
                        prev.map((m) =>
                            m.id === member.id
                                ? {
                                      ...m,
                                      is_active: member.is_active ? 0 : 1,
                                      statut: newStatus,
                                  }
                                : m,
                        ),
                    );
                    toast.success(`Membre ${displayStatus} avec succès`);
                },
                onError: (errors) => {
                    console.error("Erreur changement statut membre:", errors);
                    toast.error("Erreur lors du changement de statut");
                },
            },
        );
    };

    const handleStoreMembre = (newMemberData) => {
        const formData = new FormData();
        Object.keys(newMemberData).forEach((key) => {
            if (key === "photo" && newMemberData[key] instanceof File) {
                formData.append(key, newMemberData[key]);
            } else if (
                newMemberData[key] !== null &&
                newMemberData[key] !== undefined
            ) {
                formData.append(key, newMemberData[key]);
            }
        });

        router.post(withBasePath("", "/admin/membres"), formData, {
            preserveScroll: true,
            onSuccess: (response) => {
                toast.success("Membre ajouté avec succès");
            },
            onError: (errors) => {
                console.error("Erreur ajout membre:", errors);
                toast.error("Erreur lors de l'ajout du membre");
            },
        });
    };

    // --- LOGIQUE POUR FONCTIONS ---
    const handleAddFonction = (newFonctionData) => {
        router.post(withBasePath("", "/admin/fonctions"), newFonctionData, {
            onSuccess: () => {
                toast.success("Fonction créée avec succès");
                // Recharger les fonctions
                fetch(withBasePath("", "/api/admin/fonctions"), {
                    headers: { Accept: "application/json" },
                })
                    .then((r) => r.json())
                    .then((data) => {
                        if (data.success) setFonctions(data.fonctions || []);
                    });
                router.reload({ only: ["availableFonctions"] });
            },
            onError: (errors) => {
                console.error("Erreur création fonction:", errors);
                toast.error("Erreur lors de la création de la fonction");
            },
        });
    };

    const handleUpdateFonction = (updatedFonction) => {
        router.put(
            withBasePath("", `/admin/fonctions/${updatedFonction.id}`),
            updatedFonction,
            {
                onSuccess: () => {
                    toast.success("Fonction mise à jour avec succès");
                    router.reload({ only: ["availableFonctions"] });
                },
                onError: (errors) => {
                    console.error("Erreur modification fonction:", errors);
                    toast.error(
                        "Erreur lors de la modification de la fonction",
                    );
                },
            },
        );
    };

    const handleDeleteFonction = (item) => {
        if (confirm(`Supprimer la fonction "${item.nom}" ?`)) {
            router.delete(withBasePath("", `/admin/fonctions/${item.id}`), {
                onSuccess: () => {
                    toast.success("Fonction supprimée avec succès");
                    router.reload({ only: ["availableFonctions"] });
                },
                onError: (errors) => {
                    console.error("Erreur suppression fonction:", errors);
                    toast.error("Erreur lors de la suppression de la fonction");
                },
            });
        }
    };

    // Validation des inscriptions
    const approve = () => {
        if (!selectedForValidation) return;
        router.put(
            withBasePath("", `/admin/status/${selectedForValidation.id}/inscription`),
            { status: "Approuvé" },
            {
                onSuccess: () => {
                    setIsValidationModalOpen(false);
                    setSelectedForValidation(null);
                    toast.success("Inscription approuvée avec succès");
                },
                onError: (errors) => {
                    console.error("Erreur approbation:", errors);
                    toast.error("Erreur lors de l'approbation");
                },
            },
        );
    };

    const reject = () => {
        if (!selectedForValidation) return;
        router.put(
            withBasePath("", `/admin/status/${selectedForValidation.id}/inscription`),
            { status: "Rejeté" },
            {
                onSuccess: () => {
                    setIsValidationModalOpen(false);
                    setSelectedForValidation(null);
                    toast.success("Inscription rejetée");
                },
                onError: (errors) => {
                    console.error("Erreur rejet:", errors);
                    toast.error("Erreur lors du rejet");
                },
            },
        );
    };

    const handleOpenValidation = (row) => {
        setSelectedForValidation(row);
        setIsValidationModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <CustomStyles />

            {/* Fond d'écran */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            ></div>

            {/* Header */}
            <AdminHeader auth={auth} />

            {/* Toast Container */}
            <ToastContainer
                toasts={toasts}
                onRemoveToast={(id) => {
                    setToasts(toasts.filter((t) => t.id !== id));
                }}
            />

            {/* Bouton Retour Dashboard et Navigation */}
            <div className="relative mt-4 z-20 px-4">
                <Link
                    href={withBasePath("", "/admin/dashboard")}
                    className="absolute left-4 inline-flex items-center p-2 bg-white/10 hover:bg-white/20 rounded-full transition text-white"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5 mr-2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                        />
                    </svg>
                    Retour au dashboard
                </Link>

                <div className="flex justify-center">
                    <nav className="bg-white p-1 rounded-lg shadow-md border flex flex-wrap gap-1">
                        {tabList.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? "bg-blue-500 text-white shadow-sm font-bold"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Contenu Principal */}
            <div className="relative z-10 flex-1 flex flex-col pt-4 overflow-hidden px-4 sm:px-6 lg:px-8 pb-8">
                {activeTab === "utilisateurs" && (
                    <TabUtilisateurs
                        rawData={initialDataByType}
                        membres={membresData}
                        availableClasses={initialAvailableClasses}
                        availableFonctions={initialAvailableFonctions}
                        onEditMember={handleUpdateMember}
                        onDeleteMember={handleDeleteMember}
                        onToggleMember={handleToggleMember}
                        onAddMember={handleStoreMembre}
                    />
                )}

                {activeTab === "familles" && (
                    <TabFamille
                        familles={initialDataByType?.familles || []}
                        membersByFamilyCode={initialMembersByFamilyCode}
                    />
                )}

                {activeTab === "classes" && (
                    <TabClasses
                        key={`classes-${classesData?.length || 0}`}
                        rawData={{
                            ...initialDataByType,
                            classes: classesData,
                        }}
                        membresData={initialMembres}
                        famillesData={initialMembersByFamily}
                        onAddClass={handleSaveClass}
                        onEditClass={handleUpdateClass}
                        onDeleteClasse={handleDeleteClass}
                        onToggleClasse={handleToggleClasseStatus}
                        onSuccess={toast.success}
                    />
                )}

                {activeTab === "fonctions" && (
                    <TabFonctions
                        rawData={initialDataByType}
                        membresData={initialMembres}
                        onAdd={handleAddFonction}
                        onUpdate={handleUpdateFonction}
                        onDelete={handleDeleteFonction}
                        onSuccess={toast.success}
                    />
                )}
            </div>

            <ValidationModal
                isOpen={isValidationModalOpen}
                onClose={() => {
                    setIsValidationModalOpen(false);
                    setSelectedForValidation(null);
                }}
                data={selectedForValidation}
                onApprove={approve}
                onReject={reject}
            />

            <ValidationModal
                isOpen={showToggleClasseModal}
                onClose={() => {
                    setShowToggleClasseModal(false);
                    setSelectedClasseForToggle(null);
                }}
                title={
                    selectedClasseForToggle?.status === "active"
                        ? "Désactiver la classe"
                        : "Activer la classe"
                }
                message={`Êtes-vous sûr de vouloir ${selectedClasseForToggle?.status === "active" ? "désactiver" : "activer"} la classe "${selectedClasseForToggle?.nom}" ?\n\nLes membres de cette classe seront automatiquement ${selectedClasseForToggle?.status === "active" ? "désactivés" : "activés"}.`}
                confirmText={
                    selectedClasseForToggle?.status === "active"
                        ? "Désactiver"
                        : "Activer"
                }
                onApprove={handleConfirmToggleClasse}
                type={
                    selectedClasseForToggle?.status === "active"
                        ? "warning"
                        : "success"
                }
            />
        </div>
    );
}
