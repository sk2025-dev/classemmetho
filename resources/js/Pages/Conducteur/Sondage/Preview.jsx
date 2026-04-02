import { useEffect, useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import ResponsableFamilleSondageShow from "../../ResponsableFamille/Sondage/Show";

export default function Preview({ surveyId }) {
    const [draft, setDraft] = useState(null);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const rawDraft = window.localStorage.getItem("conducteur-sondage-preview");

        if (!rawDraft) {
            return;
        }

        try {
            setDraft(JSON.parse(rawDraft));
        } catch {
            setDraft(null);
        }
    }, []);

    const survey = draft?.survey ?? null;
    const previewBackHref = draft?.previewBackHref || "/conducteur/sondages/create";
    const previewQuestions = useMemo(() => {
        if (Array.isArray(draft?.questions) && draft.questions.length > 0) {
            return draft.questions;
        }

        return [];
    }, [draft]);
    const previewSurvey = useMemo(() => {
        return {
            id: surveyId,
            titre: survey?.titre || "Titre non renseigne",
            description:
                survey?.description ||
                "Ajoutez une description dans la creation du sondage pour l'afficher ici.",
            audience: survey?.audience || "Non renseignee",
            dateEcheance: survey?.dateEcheance || null,
            statut: "Apercu",
            reponses: 0,
            participants: 0,
            questions: previewQuestions,
        };
    }, [previewQuestions, survey, surveyId]);

    const hasDraft = Boolean(
        survey?.titre || survey?.description || previewQuestions.length > 0,
    );

    return (
        <>
            <Head title="Apercu du sondage" />
            <ResponsableFamilleSondageShow
                survey={previewSurvey}
                classe={null}
                hasResponded={false}
                previewMode
                backHref={previewBackHref}
                headerTitle="Apercu du sondage"
                headerSubtitle="Visualisez exactement la vue de reponse qui sera affichee aux repondants."
                badgeLabel="Mode apercu"
                submitLabel={hasDraft ? "Envoyer mes reponses" : "Aucune question a previsualiser"}
                submitDisabled={!hasDraft}
            />
        </>
    );
}
