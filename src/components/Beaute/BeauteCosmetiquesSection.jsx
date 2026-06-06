import "../../Styles/BeauteCosmetiques.css";
import BeautyCard from "./BeautyCard";
import { cosmetiqueProducts, cosmetiqueKits } from "./beauteData";

function BeauteCosmetiquesSection({ onAddToCart }) {
  // split products into two groups for the two grids
  const firstGroup = cosmetiqueProducts.slice(0, 5);
  const secondGroup = cosmetiqueProducts.slice(5);

  return (
    <section className="products-section beauty-cosmetiques">
      <div className="section-header">
        <div className="section-title-block">
          <div className="section-eyebrow">Visage &amp; corps</div>
          <h2 className="section-title">
            Produits <em>cosmétiques</em>
          </h2>
        </div>
      </div>

      <div className="cosm-sub">
        <div className="cosm-sub-header">
          <div className="cosm-sub-line" />
          <div>
            <h3 className="cosm-sub-title">
              Crèmes <em>de corps</em>
            </h3>
            <span className="cosm-sub-label">
              Hydratation · Éclat · Unification du teint
            </span>
          </div>
        </div>

        <div className="beauty-grid" id="grid-cremescorps">
          {firstGroup.map((item) => (
            <BeautyCard
              key={item.title}
              variant="product"
              item={item}
              onAddToCart={() => onAddToCart(item)}
            />
          ))}
        </div>
      </div>

      <div className="cosm-sub">
        <div className="cosm-sub-header">
          <div className="cosm-sub-line" />
          <div>
            <h3 className="cosm-sub-title">
              Gels douche <em>&amp; savons de corps</em>
            </h3>
            <span className="cosm-sub-label">
              Nettoyage · Douceur · Senteurs naturelles
            </span>
          </div>
        </div>

        <div className="beauty-grid" id="grid-savonsdouche">
          {secondGroup.map((item) => (
            <BeautyCard
              key={item.title}
              variant="product"
              item={item}
              onAddToCart={() => onAddToCart(item)}
            />
          ))}
        </div>
      </div>

      <div className="cosm-sub">
        <div className="cosm-sub-header">
          <div className="cosm-sub-line" />
          <div>
            <h3 className="cosm-sub-title">
              Kits <em>de visage</em>
            </h3>
            <span className="cosm-sub-label">
              Soins complets · Routines simplifiées · Résultats visibles
            </span>
          </div>
        </div>

        <div className="beauty-grid" id="grid-kitsvisage">
          {cosmetiqueKits.map((item) => (
            <BeautyCard
              key={item.title}
              variant="product"
              item={item}
              onAddToCart={() => onAddToCart(item)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default BeauteCosmetiquesSection;
