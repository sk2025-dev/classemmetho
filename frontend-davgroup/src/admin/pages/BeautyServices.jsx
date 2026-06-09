import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "../hooks/useAdmin";
import { adminApi } from "../utils/api";
import "../styles/admin.css";

const fallbackImagesByTitle = {
  "Micro-twist": "/images/debut.png",
  "Tresse enfant": "/images/mamouch.png",
  "Pose gel simple": "/images/designmarron.jpg",
  "Massage relaxant": "/images/spa4.jpeg",
  "Conseil beauté": "/images/mere.png",
};

const initialForm = {
  section_key: "rendezvous",
  category_key: "coiffure",
  title: "",
  subtitle: "",
  duration: "",
  price: "",
  sort_order: "0",
  image: null,
};

const BeautyServices = () => {
  const { showToast } = useAdmin();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState(null);

  const loadItems = async () => {
    try {
      const response = await adminApi.getBeautyServices("rendezvous");
      setItems(response?.data || []);
    } catch (error) {
      showToast(error.message || "Impossible de charger les visuels", 3000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const itemsCount = useMemo(() => items.length, [items]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    if (name === "image") {
      const file = files?.[0] || null;
      setImagePreview(file ? URL.createObjectURL(file) : null);
    }
    setForm((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.category_key) {
      showToast("⚠ Remplissez au moins le titre et la catégorie", 3000);
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        payload.append(key, value);
      }
    });

    try {
      await adminApi.createBeautyService(payload);
      setForm(initialForm);
      setImagePreview(null);
      await loadItems();
      showToast("✓ Visuel ajouté");
    } catch (error) {
      showToast(error.message || "Erreur lors de l'ajout", 3000);
    }
  };

  const handleToggle = async (item) => {
    const payload = new FormData();
    payload.append("is_active", item.is_active ? "0" : "1");
    payload.append("section_key", item.section_key);
    payload.append("category_key", item.category_key);
    payload.append("title", item.title);
    payload.append("sort_order", item.sort_order ?? 0);

    try {
      payload.append("_method", "PUT");
      await adminApi.updateBeautyService(item.id, payload);
      await loadItems();
      showToast("✓ Statut mis à jour");
    } catch (error) {
      showToast(error.message || "Erreur de mise à jour", 3000);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.deleteBeautyService(id);
      await loadItems();
      showToast("✓ Visuel supprimé");
    } catch (error) {
      showToast(error.message || "Erreur de suppression", 3000);
    }
  };

  return (
    <div className="panel active">
      <div className="section-head">
        <div>
          <div className="section-head-title">Beauté & Photos</div>
          <div className="section-head-sub">
            {itemsCount} visuel(s) piloté(s) par l'API
          </div>
        </div>
      </div>

      <div className="promos-layout">
        <div className="promo-form-card">
          <div className="promo-card-title">Ajouter un visuel</div>

          <div className="admin-field">
            <label className="admin-label">Titre</label>
            <input
              name="title"
              className="admin-inp"
              value={form.title}
              onChange={handleChange}
              placeholder="Ex : Pose gel simple"
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Catégorie</label>
            <select
              name="category_key"
              className="admin-sel"
              value={form.category_key}
              onChange={handleChange}
            >
              <option value="coiffure">Coiffure</option>
              <option value="ongerie">Ongerie</option>
              <option value="spa">Spa & Soins</option>
              <option value="conseil">Conseil beauté</option>
            </select>
          </div>

          <div className="admin-field">
            <label className="admin-label">Description courte</label>
            <input
              name="subtitle"
              className="admin-inp"
              value={form.subtitle}
              onChange={handleChange}
              placeholder="Ex : Tressage, twist, soin du cuir chevelu"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="admin-field">
              <label className="admin-label">Durée</label>
              <input
                name="duration"
                className="admin-inp"
                value={form.duration}
                onChange={handleChange}
                placeholder="Ex : 1H30"
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Prix</label>
              <input
                name="price"
                className="admin-inp"
                value={form.price}
                onChange={handleChange}
                placeholder="Ex : 24 000 FCFA"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "12px" }}>
            <div className="admin-field">
              <label className="admin-label">Image</label>
              <input
                name="image"
                type="file"
                accept="image/*"
                className="admin-inp"
                onChange={handleChange}
              />
              {imagePreview ? (
                <div style={{ marginTop: "12px", width: "100%", height: "160px", borderRadius: "16px", overflow: "hidden", background: "rgba(0,0,0,.06)" }}>
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ) : null}
            </div>
            <div className="admin-field">
              <label className="admin-label">Ordre</label>
              <input
                name="sort_order"
                type="number"
                className="admin-inp"
                value={form.sort_order}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <button className="action-btn ab-primary" onClick={handleSubmit} style={{ width: "100%" }}>
            ➕ Ajouter à la page
          </button>
        </div>

        <div>
          <div className="promo-card-title" style={{ marginBottom: "14px" }}>
            Visuels actifs
          </div>
          <div className="promo-list-card">
            {isLoading ? (
              <div className="empty-row">Chargement...</div>
            ) : items.length === 0 ? (
              <div className="empty-row">Aucun visuel enregistré</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="promo-item" style={{ alignItems: "center" }}>
                  <div className="promo-item-main" style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <div style={{ width: "72px", height: "72px", borderRadius: "14px", overflow: "hidden", background: "rgba(0,0,0,.06)", flex: "0 0 auto" }}>
                      <img
                        src={item.image_url || fallbackImagesByTitle[item.title] || "/images/logo.png"}
                        alt={item.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div>
                      <div className="promo-item-code">{item.title}</div>
                      <div className="promo-item-detail">{item.category_key} · {item.duration || "—"} · {item.price || "—"}</div>
                      <div className="promo-item-dates">{item.section_key} · ordre {item.sort_order}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button className="action-btn ab-confirm" onClick={() => handleToggle(item)}>
                      {item.is_active ? "✓ Actif" : "⊘ Inactif"}
                    </button>
                    <button className="action-btn ab-cancel" onClick={() => handleDelete(item.id)}>
                      🗑
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeautyServices;
