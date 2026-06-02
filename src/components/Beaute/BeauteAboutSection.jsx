import BeautySectionHeader from "./BeautySectionHeader";

function BeauteAboutSection() {
  return (
    <section className="beauty-section" id="about">
      <div className="beauty-story">
        <div className="beauty-story-copy">
          <BeautySectionHeader
            eyebrow="Qui sommes-nous"
            title="Une image rouge, noire et dorée qui dit luxe, savoir-faire et confiance."
            stack
          />
          <p>
            Le logo DB avec ses étoiles impose une signature premium. Cette page
            doit rester lisible et orientée conversion, tout en donnant envie de
            franchir la porte du salon.
          </p>
        </div>

        <div className="beauty-gallery">
          <img src="/images/miriam.png" alt="Salon Dav'Beauté" />
          <img src="/images/madame k.png" alt="Spa Dav'Beauté" />
        </div>
      </div>
    </section>
  );
}

export default BeauteAboutSection;
