import BeautyCard from "./BeautyCard";
import { capillaryProducts } from "./beauteData";
import "../../styles/BeauteCapillaires.css";

function BeauteCapillairesSection({ onAddToCart }) {
  return (
    <section id="capillaires" className="beauty-section beauty-capillaires">
      <div className="beauty-section-heading beauty-capillaires__heading">
        <div>
          <p>Notre méthode</p>
          <h2>
            L'entretien de vos <span>cheveux</span>
          </h2>
        </div>
      </div>

      <div className="beauty-capillaires__intro">
        <div className="beauty-capillaires__copy">
          <p className="beauty-capillaires__kicker">Soin &amp; nutrition</p>
          <p className="beauty-capillaires__lead">
            Chez Dav'Beauté, chaque séance commence par un diagnostic capillaire
            personnalisé. Nous prenons soin de vos cheveux de la racine aux
            pointes : lavage en douceur, hydratation intensive sous casque
            thermique, puis coiffure soignée pour un résultat durable et
            naturel.
          </p>
          <ul className="beauty-capillaires__steps">
            <li>
              <span>01</span>
              Lavage &amp; démêlage doux avec nos soins naturels
            </li>
            <li>
              <span>02</span>
              Hydratation intensive sous casque thermique
            </li>
          </ul>
        </div>

        <div className="beauty-capillaires__photos" aria-label="Photos soin">
          <figure>
            <img src="/images/souscasque.jpeg" alt="Lavage des cheveux" />
            <figcaption>sous casque thermique</figcaption>
          </figure>
          <figure>
            <img src="/images/entretien.jpeg" alt="Résultat après soin" />
            <figcaption>Shampoing et Démêlage</figcaption>
          </figure>
        </div>
      </div>

      <div className="beauty-capillaires__products">
        <div className="beauty-section-heading beauty-section-heading--stack">
          <div>
            <p>Nos produits</p>
            <h2>
              Produits <span>capillaires</span>
            </h2>
          </div>
          <span className="beauty-capillaires__count">
            {capillaryProducts.length} produits
          </span>
        </div>

        <div className="beauty-product-grid">
          {capillaryProducts.map((product) => (
            <BeautyCard
              key={product.title}
              variant="product"
              item={product}
              onAddToCart={() => onAddToCart(product)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default BeauteCapillairesSection;
