import BeautyCard from "./BeautyCard";
import BeautySectionHeader from "./BeautySectionHeader";

function BeauteServiceSection({ id, eyebrow, title, emphasis, services }) {
  return (
    <section className="beauty-section" id={id}>
      <BeautySectionHeader
        eyebrow={eyebrow}
        title={title}
        emphasis={emphasis}
        className={id === "ongleriespa" ? "beauty-section-heading--reverse" : ""}
        showBooking={id === "ongleriespa"}
      />

      <div className="beauty-service-grid">
        {services.map((service) => (
          <BeautyCard key={service.title} variant="service" item={service} />
        ))}
      </div>
    </section>
  );
}

export default BeauteServiceSection;
