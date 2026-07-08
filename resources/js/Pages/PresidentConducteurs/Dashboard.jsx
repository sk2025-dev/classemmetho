import React, { useState } from "react";
import { Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import DashboardIntro from "@/Components/DashboardIntro";
import { withBasePath } from "../../Utils/urlHelper";
import TabValidationActes from "./Tabs/TabValidationActes";
import TabPresences from "./Tabs/TabPresences";
import TabProgrammes from "./Tabs/TabProgrammes";
import TabAnnuaire from "./Tabs/TabAnnuaire";
import TabTresorerie from "./Tabs/TabTresorerie";
import TabFlashInfo from "./Tabs/TabFlashInfo";
import TabSondages from "./Tabs/TabSondages";

const TABS = [
    { id: "actes", label: "Validation des actes" },
    { id: "presences", label: "Présences" },
    { id: "programmes", label: "Programmes d'activité" },
    { id: "annuaire", label: "Annuaire" },
    { id: "tresorerie", label: "Trésorerie" },
    { id: "flash_info", label: "Flash info" },
    { id: "sondages", label: "Sondages" },
];

function TabPlaceholder({ label }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{label}</h3>
            <p className="text-sm text-gray-500">
                Cet onglet sera bientôt disponible.
            </p>
        </div>
    );
}

export default function Dashboard({
    actes,
    historique,
    pendingCount,
    validatedCount,
    refusedCount,
    classesPresence,
    classesProgrammes,
    members,
    families,
    classes,
    view,
    cotisations,
    annuaireUser,
    filters,
    filterOptions,
    globalStats,
    tresorerieClasses,
    cotisationsParClasse,
    encouragements,
    flashInfos,
    sondages,
    seenSurveyIds,
}) {
    const [activeTab, setActiveTab] = useState("actes");

    return (
        <div
            className="min-h-screen admin-page px-4 sm:px-6 lg:px-8"
            style={{
                background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                minHeight: "100vh",
                position: "relative",
                overflowX: "hidden",
            }}
        >
            <div className="mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <Link
                    href={withBasePath("", "/conducteur/dashboard")}
                    className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg bg-white text-slate-700 border border-slate-200 shadow-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Retour au tableau de bord
                </Link>

                <DashboardIntro title="MON ESPACE PRÉSIDENT DES CONDUCTEURS" />

                <nav className="bg-white p-1 rounded-lg shadow-md border flex flex-wrap justify-center gap-1 mb-6">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                activeTab === tab.id
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                        >
                            {tab.label}
                            {tab.id === "actes" && pendingCount > 0 && (
                                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold shadow animate-pulse">
                                    {pendingCount > 99 ? "99+" : pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {activeTab === "actes" && (
                    <TabValidationActes
                        actes={actes}
                        historique={historique}
                        pendingCount={pendingCount}
                        validatedCount={validatedCount}
                        refusedCount={refusedCount}
                    />
                )}
                {activeTab === "presences" && (
                    <TabPresences classesPresence={classesPresence} />
                )}
                {activeTab === "programmes" && (
                    <TabProgrammes classesProgrammes={classesProgrammes} />
                )}
                {activeTab === "annuaire" && (
                    <TabAnnuaire
                        members={members}
                        families={families}
                        classes={classes}
                        view={view}
                        cotisations={cotisations}
                        annuaireUser={annuaireUser}
                        filters={filters}
                        filterOptions={filterOptions}
                    />
                )}
                {activeTab === "tresorerie" && (
                    <TabTresorerie
                        globalStats={globalStats}
                        tresorerieClasses={tresorerieClasses}
                        cotisationsParClasse={cotisationsParClasse}
                        encouragements={encouragements}
                    />
                )}
                {activeTab === "flash_info" && (
                    <TabFlashInfo flashInfos={flashInfos} />
                )}
                {activeTab === "sondages" && (
                    <TabSondages
                        sondages={sondages}
                        seenSurveyIds={seenSurveyIds}
                    />
                )}
            </div>
        </div>
    );
}
