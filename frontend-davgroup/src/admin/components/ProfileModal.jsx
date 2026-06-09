import { useState } from "react";
import { useAdmin } from "../hooks/useAdmin";
import "../styles/admin.css";

const ProfileModal = () => {
  const { userProfile, updateProfile, setShowProfileModal, showProfileModal } =
    useAdmin();
  const [formData, setFormData] = useState(userProfile || {});
  const [photoPreview, setPhotoPreview] = useState(userProfile?.photo || null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setFormData((prev) => ({
        ...prev,
        photo: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateProfile(formData);
    setShowProfileModal(false);
  };

  const handleClose = () => {
    setFormData(userProfile || {});
    setPhotoPreview(userProfile?.photo || null);
    setShowProfileModal(false);
  };

  if (!showProfileModal) return null;

  return (
    <div className="modal-overlay open" onClick={handleClose}>
      <div
        className="modal-box"
        style={{ maxWidth: "500px" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-head-title">Mon profil</div>
          <button className="modal-close" onClick={handleClose}>
            x
          </button>
        </div>

        <div className="modal-body">
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
                  {(userProfile?.name || userProfile?.email || "A")
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
            <label
              className="action-btn"
              style={{
                marginTop: "12px",
                cursor: "pointer",
                display: "inline-flex",
              }}
            >
              Ajouter une photo
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
                Supprimer
              </button>
            )}
          </div>

          <div className="admin-field">
            <label className="admin-label">Nom complet</label>
            <input
              type="text"
              className="admin-inp"
              value={userProfile?.name || ""}
              readOnly
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Email</label>
            <input
              type="email"
              className="admin-inp"
              value={userProfile?.email || ""}
              readOnly
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Telephone</label>
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
            <label className="admin-label">Bio / description</label>
            <textarea
              name="bio"
              className="admin-inp"
              value={formData.bio || ""}
              onChange={handleInputChange}
              placeholder="Role dans l'administration"
              rows="3"
              style={{ fontFamily: "inherit", resize: "vertical" }}
            />
          </div>
        </div>

        <div className="modal-status-row" style={{ padding: "0 28px 24px" }}>
          <button
            className="action-btn ab-primary"
            onClick={handleSave}
            style={{ flex: 1, justifyContent: "center" }}
          >
            Enregistrer
          </button>
          <button
            className="action-btn"
            onClick={handleClose}
            style={{ flex: 1, justifyContent: "center" }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
