import BeautyCard from "./BeautyCard";
import BeautySectionHeader from "./BeautySectionHeader";

function BeautyCollectionSection({
  id,
  eyebrow,
  title,
  emphasis,
  items,
  alt = false,
}) {
  const variant = id === "realisations" ? "realisation" : "info";

  return (
    <section
      className={`beauty-section${alt ? " beauty-section--alt" : ""}`}
      id={id}
    >
      <BeautySectionHeader
        eyebrow={eyebrow}
        title={title}
        emphasis={emphasis}
      />

      <div
        className={
          id === "realisations"
            ? "beauty-grid beauty-grid--realisations"
            : "beauty-grid"
        }
      >
        {items.map((item) => (
          <BeautyCard
            key={item.title}
            variant={variant}
            item={item}
            label={emphasis}
          />
        ))}
      </div>
    </section>
  );
}

export default BeautyCollectionSection;
