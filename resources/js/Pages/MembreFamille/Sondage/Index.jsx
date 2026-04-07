import ResponsableFamilleSondageIndex from "../../ResponsableFamille/Sondage/Index";
import { withBasePath } from "../../../Utils/urlHelper";

export default function MembreFamilleSondageIndex(props) {
    return (
        <ResponsableFamilleSondageIndex
            {...props}
            headTitle="Sondages - Membre Famille"
            backHref={withBasePath("", "/membre-famille/dashboard")}
            detailBaseHref={withBasePath("", "/membre-famille/sondages")}
            showAudienceFilter={false}
        />
    );
}
