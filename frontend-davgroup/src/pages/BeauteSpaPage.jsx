import BeauteLayout from "../components/Beaute/BeauteLayout";
import BeauteServiceSection from "../components/Beaute/BeauteServiceSection";
import { spaAndNails } from "../components/Beaute/beauteData";

function BeauteSpaPage() {
  return (
    <BeauteLayout>
      <BeauteServiceSection
        id="ongleriespa"
        eyebrow="Onglerie et Spa"
        title="Pose, soin et détente dans"
        emphasis="un même espace"
        services={spaAndNails}
      />
    </BeauteLayout>
  );
}

export default BeauteSpaPage;
