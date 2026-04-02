import ResponsableFamilleSondageShow from "../../ResponsableFamille/Sondage/Show";

export default function MembreFamilleSondageShow(props) {
    const surveyId = props?.survey?.id;

    return (
        <ResponsableFamilleSondageShow
            {...props}
            backHref="/membre-famille/sondages"
            submitUrl={
                surveyId
                    ? `/membre-famille/sondages/${surveyId}/reponses`
                    : null
            }
        />
    );
}
