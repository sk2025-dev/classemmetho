import { useState, useMemo, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAdmin } from "../hooks/useAdmin";
import { MOCK_PRODUCTS, BADGE_OPTIONS } from "../utils/constants";
import { adminApi } from "../utils/api";
import "../styles/admin.css";

const Products = () => {
  const { showToast } = useAdmin();
  const [products, setProducts] = useLocalStorage(
    "dav_products",
    MOCK_PRODUCTS.map((p) => ({
      ...p,
      inStock: true,
      badge: "",
    })),
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await adminApi.getProducts();
        const data = res?.data || [];
        const mapped = data.map((p) => ({
          name: p.name,
          cat: p.category || "",
          price: p.price?.toString() || "0",
          img: p.image || "/images/placeholder.png",
          inStock: p.quantity > 0,
          badge: "",
        }));
        if (mounted && mapped.length > 0) setProducts(mapped);
      } catch (err) {
        // leave local mock data
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [setProducts]);
  const [filter, setFilter] = useState("all");

  const filteredProducts = useMemo(() => {
    let result = products || [];
    if (filter === "oos") {
      result = result.filter((p) => !p.inStock);
    }
    return result;
  }, [products, filter]);

  const handlePriceChange = (idx, newPrice) => {
    const updated = [...products];
    updated[idx].price = newPrice;
    setProducts(updated);
    showToast("✓ Prix mis à jour");
  };

  const handleStockToggle = (idx) => {
    const updated = [...products];
    updated[idx].inStock = !updated[idx].inStock;
    setProducts(updated);
    showToast("✓ Stock mis à jour");
  };

  const handleBadgeChange = (idx, newBadge) => {
    const updated = [...products];
    updated[idx].badge = newBadge;
    setProducts(updated);
    showToast("✓ Badge mis à jour");
  };

  const oos = products?.filter((p) => !p.inStock)?.length || 0;

  return (
    <div className="panel active">
      <div className="section-head">
        <div>
          <div className="section-head-title">Produits &amp; Stock</div>
          <div className="section-head-sub">
            {filteredProducts.length} produit(s) — {oos} en rupture
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className={`tf-tab ${filter === "all" ? "tf-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Tous
          </button>
          <button
            className={`tf-tab ${filter === "oos" ? "tf-active" : ""}`}
            onClick={() => setFilter("oos")}
          >
            Ruptures
          </button>
        </div>
      </div>
      <div className="products-admin-grid">
        {filteredProducts.length === 0 ? (
          <div className="empty-row" style={{ gridColumn: "1 / -1" }}>
            Aucun produit
          </div>
        ) : (
          filteredProducts.map((p, idx) => (
            <div
              key={idx}
              className={`prod-admin-card ${!p.inStock ? "out-of-stock" : ""}`}
            >
              <div className="pac-img">
                <img
                  src={p.img}
                  alt={p.name}
                  onError={(e) =>
                    (e.target.parentNode.style.background = "var(--gold-pale)")
                  }
                />
                {!p.inStock && (
                  <div className="pac-stock-overlay">
                    <span>Rupture de stock</span>
                  </div>
                )}
              </div>
              <div className="pac-body">
                <div className="pac-name">{p.name}</div>
                <div className="pac-cat">{p.cat}</div>
                <div className="pac-price-row">
                  <input
                    type="text"
                    className="pac-price-inp"
                    value={p.price}
                    onChange={(e) => handlePriceChange(idx, e.target.value)}
                    placeholder="Prix"
                  />
                  <span className="pac-price-unit">FCFA</span>
                </div>
                <div className="pac-actions">
                  <button
                    className={`pac-toggle ${p.inStock ? "in-stock" : "oos"}`}
                    onClick={() => handleStockToggle(idx)}
                  >
                    {p.inStock ? "✓ En stock" : "✕ Rupture"}
                  </button>
                  <select
                    className="pac-badge-sel"
                    value={p.badge || ""}
                    onChange={(e) => handleBadgeChange(idx, e.target.value)}
                  >
                    {BADGE_OPTIONS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Products;
