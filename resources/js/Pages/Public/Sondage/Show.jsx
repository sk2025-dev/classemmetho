import ResponsableFamilleSondageShow from "../../ResponsableFamille/Sondage/Show";
import { withBasePath } from "../../../Utils/urlHelper";

export default function PublicSondageShow(props) {
    const publicToken = props?.publicToken;

    return (
        <ResponsableFamilleSondageShow
            {...props}
            publicMode
            backHref={withBasePath("", "/")}
            headerTitle="Repondre au sondage"
            headerSubtitle="Acces public sans connexion. Votre participation reste anonyme."
            badgeLabel="Lien public"
            submitUrl={
                publicToken
                    ? withBasePath(
                          "",
                          `/sondages/public/${publicToken}/reponses`,
                      )
                    : null
            }
        />
    );
}
