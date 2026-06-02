import BeauteAboutSection from "../components/Beaute/BeauteAboutSection";
import BeauteBanner from "../components/Beaute/BeauteBanner";
import BeauteCtaBand from "../components/Beaute/BeauteCtaBand";
import BeauteLayout from "../components/Beaute/BeauteLayout";

function BeautePage() {
  return (
    <BeauteLayout>
      <BeauteBanner />
      <BeauteAboutSection />
      <BeauteCtaBand />
    </BeauteLayout>
  );
}

export default BeautePage;
