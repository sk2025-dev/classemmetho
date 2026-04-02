import ResponsableFamilleSondageIndex from "../../ResponsableFamille/Sondage/Index";

export default function MembreFamilleSondageIndex(props) {
    return (
        <ResponsableFamilleSondageIndex
            {...props}
            headTitle="Sondages - Membre Famille"
            backHref="/membre-famille/dashboard"
            detailBaseHref="/membre-famille/sondages"
            showAudienceFilter={false}
        />
    );
}
