import ResponsableFamilleSondageShow from "../../ResponsableFamille/Sondage/Show";
import { withBasePath } from "../../../Utils/urlHelper";

export default function MembreFamilleSondageShow(props) {
    const surveyId = props?.survey?.id;

    return (
        <ResponsableFamilleSondageShow
            {...props}
            backHref={withBasePath("", "/membre-famille/sondages")}
            submitUrl={
                surveyId
                    ? withBasePath(
                          "",
                          `/membre-famille/sondages/${surveyId}/reponses`,
                      )
                    : null
            }
        />
    );
}
