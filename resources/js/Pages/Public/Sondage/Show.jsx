import ResponsableFamilleSondageShow from "../../ResponsableFamille/Sondage/Show";

export default function PublicSondageShow(props) {
    const publicToken = props?.publicToken;

    return (
        <ResponsableFamilleSondageShow
            {...props}
            publicMode
            backHref="/"
            headerTitle="Repondre au sondage"
            headerSubtitle="Acces public sans connexion. Votre participation reste anonyme."
            badgeLabel="Lien public"
            submitUrl={
                publicToken
                    ? `/sondages/public/${publicToken}/reponses`
                    : null
            }
        />
    );
}
