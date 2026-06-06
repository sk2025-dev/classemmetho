import React, { useState } from "react";
import { useAdmin } from "../hooks/useAdmin";
import "../styles/admin.css";

const ProfileModal = () => {
  const { userProfile, updateProfile, setShowProfileModal, showProfileModal } =
    useAdmin();
  const [formData, setFormData] = useState(userProfile || {});
  const [photoPreview, setPhotoPreview] = useState(userProfile?.photo || null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          photo: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateProfile(formData);
    setShowProfileModal(false);
  };

  const handleClose = () => {
    setFormData(userProfile);
    setPhotoPreview(userProfile?.photo || null);
    setShowProfileModal(false);
  };

  if (!showProfileModal) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={handleClose}></div>
      <div className="modal-content" style={{ maxWidth: "500px" }}>
        <div className="modal-head">
          <div className="modal-title">Mon Profil</div>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Photo upload section */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div className="profile-photo-container">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profil"
                  className="profile-photo"
                />
              ) : (
                <div className="profile-photo-placeholder">
                  <span style={{ fontSize: "48px" }}>📸</span>
                </div>
              )}
            </div>
            <label
              className="action-btn"
              style={{
                marginTop: "12px",
                cursor: "pointer",
                display: "inline-block",
              }}
            >
              🖼️ Ajouter une photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
            </label>
            {photoPreview && (
              <button
                className="action-btn ab-cancel"
                onClick={() => {
                  setPhotoPreview(null);
                  setFormData((prev) => ({ ...prev, photo: null }));
                }}
                style={{ marginLeft: "8px" }}
              >
                ✕ Supprimer
              </button>
            )}
          </div>

          {/* Form fields */}
          <div className="admin-field">
            <label className="admin-label">Nom complet</label>
            <input
              type="text"
              name="name"
              className="admin-inp"
              value={formData.name || ""}
              onChange={handleInputChange}
              placeholder="Votre nom"
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Email</label>
            <input
              type="email"
              name="email"
              className="admin-inp"
              value={formData.email || ""}
              onChange={handleInputChange}
              placeholder="votre@email.com"
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Téléphone</label>
            <input
              type="tel"
              name="phone"
              className="admin-inp"
              value={formData.phone || ""}
              onChange={handleInputChange}
              placeholder="+235 66 00 00 00"
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Bio/Description</label>
            <textarea
              name="bio"
              className="admin-inp"
              value={formData.bio || ""}
              onChange={handleInputChange}
              placeholder="Décrivez votre rôle..."
              rows="3"
              style={{ fontFamily: "inherit", resize: "vertical" }}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="action-btn ab-primary"
            onClick={handleSave}
            style={{ flex: 1 }}
          >
            💾 Enregistrer
          </button>
          <button
            className="action-btn"
            onClick={handleClose}
            style={{ flex: 1 }}
          >
            Annuler
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileModal;
