import { useMemo, useState } from "react";
import "../../Styles/BeauteRdv.css";

const services = {
  coiffure: {
    label: "Coiffure & Tressage",
    icon: "💇",
    items: [
      {
        id: 1,
        title: "Micro-twist",
        duration: "11H30",
        price: "35 000 FCFA",
        image: "/images/debut.png",
      },
      {
        id: 2,
        title: "Tresse enfant",
        duration: "3H",
        price: "25 000 FCFA",
        image: "/images/mamouch.png",
      },
      {
        id: 3,
        title: "Coloration naturelle",
        duration: "2H30",
        price: "42 000 FCFA",
        image: "/images/elegant.jpg",
      },
    ],
  },
  ongerie: {
    label: "Ongerie",
    icon: "💅",
    items: [
      {
        id: 1,
        title: "Pose gel simple",
        duration: "1H30",
        price: "24 000 FCFA",
        image: "/images/designmarron.jpg",
      },
      {
        id: 2,
        title: "Nail art complet",
        duration: "2H",
        price: "30 000 FCFA",
        image: "/images/ongletflachir.jpg",
      },
      {
        id: 3,
        title: "Manucure classique",
        duration: "1H",
        price: "18 000 FCFA",
        image: "/images/elegant.jpg",
      },
    ],
  },
  spa: {
    label: "Spa & Soins",
    icon: "🧖",
    items: [
      {
        id: 1,
        title: "Massage relaxant",
        duration: "1H30",
        price: "38 000 FCFA",
        image: "/images/spa4.jpeg",
      },
      {
        id: 2,
        title: "Soin du visage",
        duration: "1H",
        price: "29 000 FCFA",
        image: "/images/spa2.jpeg",
      },
      {
        id: 3,
        title: "Gommage complet",
        duration: "1H30",
        price: "34 000 FCFA",
        image: "/images/spa7.jpeg",
      },
    ],
  },
  conseil: {
    label: "Conseil beauté",
    icon: "✨",
    items: [
      {
        id: 1,
        title: "Conseil beauté",
        duration: "1H",
        price: "20 000 FCFA",
        image: "/images/mere.png",
      },
      {
        id: 2,
        title: "Conseil entretien capillaire",
        duration: "45mn",
        price: "12 000 FCFA",
        image: "/images/afro.png",
      },
    ],
  },
};

const paymentMethods = [
  {
    key: "mobile",
    label: "Mobile Money",
    emoji: "📱",
    detail: "Orange · MTN · Wave",
  },
  {
    key: "card",
    label: "Carte bancaire",
    emoji: "💳",
    detail: "Visa / Mastercard",
  },
  {
    key: "cash",
    label: "En boutique",
    emoji: "🏦",
    detail: "Avant votre RDV",
  },
];

function BeauteRdvSection() {
  const [activeService, setActiveService] = useState("ongerie");
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mobile");
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [isConfirmed, setIsConfirmed] = useState(false);

  const today = useMemo(() => new Date(), []);
  const monthLabel = useMemo(
    () =>
      today.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
    [today],
  );

  const daysOfMonth = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const blanks = Array((firstDay.getDay() + 6) % 7).fill(null);
    const days = [];

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      days.push(new Date(year, month, day));
    }

    return [...blanks, ...days];
  }, [today]);

  const slotOptions = useMemo(() => {
    if (!selectedDate) return [];
    if (selectedDate.getDay() === 0) return [];
    const allSlots = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
    return selectedDate.getDay() === 6 ? allSlots.slice(0, 4) : allSlots;
  }, [selectedDate]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return "Aucune date sélectionnée";
    return selectedDate.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [selectedDate]);

  const selectedServiceName = selectedService?.title || "—";
  const selectedServiceDuration = selectedService?.duration || "—";
  const selectedServicePrice = selectedService?.price || "—";

  const onChooseService = (item) => {
    setSelectedService(item);
    setSelectedDate(null);
    setSelectedSlot("");
    setCurrentStep(2);
  };

  const isBeforeToday = (day) => {
    if (!day) return false;
    const normalized = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
    );
    const now = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    return normalized < now;
  };

  const handleConfirm = () => {
    if (!formValues.firstName || !formValues.lastName || !formValues.phone) {
      window.alert("Merci de remplir votre prénom, nom et téléphone.");
      return;
    }
    setIsConfirmed(true);
  };

  const handleInputChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="beauty-rdv-section">
      <div className="rdv-header">
        <div className="rdv-header-content">
          <p className="rdv-eyebrow">SALON DAV'BEAUTÉ</p>
          <h1 className="rdv-title">
            Réservez votre <span className="highlight">rendez-vous</span>
          </h1>
          <p className="rdv-subtitle">
            Choisissez votre soin, votre créneau et confirmez en quelques
            secondes.
            <br />
            Notre équipe vous accueille à Cocody Angré, 8è tranche.
          </p>
        </div>
      </div>

      <div className="rdv-steps">
        {[
          { label: "Votre soin", step: 1 },
          { label: "Date & Heure", step: 2 },
          { label: "Confirmation", step: 3 },
        ].map((step) => (
          <div
            key={step.step}
            className={`rdv-step ${currentStep >= step.step ? "active" : ""}`}
            onClick={() => setCurrentStep(step.step)}
          >
            <span className="step-number">{step.step}</span>
            <span className="step-label">{step.label}</span>
          </div>
        ))}
      </div>

      <div className="rdv-services-container">
        <div className="rdv-tabs">
          {Object.entries(services).map(([key, service]) => (
            <button
              key={key}
              className={`rdv-tab ${activeService === key ? "active" : ""}`}
              onClick={() => {
                setActiveService(key);
                setSelectedService(null);
                setCurrentStep(1);
              }}
            >
              <span className="tab-icon">{service.icon}</span>
              <span className="tab-label">{service.label}</span>
            </button>
          ))}
        </div>

        <div className={`rdv-panel ${currentStep === 1 ? "rdv-active" : ""}`}>
          <div className="rdv-cards-grid">
            {services[activeService].items.map((item) => (
              <div
                key={item.id}
                className={`rdv-card ${selectedService?.id === item.id ? "selected" : ""}`}
              >
                <div className="rdv-card-image">
                  <img src={item.image} alt={item.title} />
                </div>
                <div className="rdv-card-content">
                  <h3>{item.title}</h3>
                  <p className="rdv-duration">⏱️ {item.duration}</p>
                  <button
                    className={`rdv-service-btn ${selectedService?.id === item.id ? "selected" : ""}`}
                    type="button"
                    onClick={() => onChooseService(item)}
                  >
                    {selectedService?.id === item.id
                      ? "Sélectionné"
                      : "Choisir"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="rdv-nav-row" style={{ justifyContent: "flex-end" }}>
            <button
              className="rdv-btn-main"
              type="button"
              disabled={!selectedService}
              onClick={() => setCurrentStep(2)}
            >
              Choisir une date
            </button>
          </div>
        </div>

        <div className={`rdv-panel ${currentStep === 2 ? "rdv-active" : ""}`}>
          <div className="rdv-selected-recap">
            <div className="rdv-recap-img">
              <img
                src={selectedService?.image || "/images/spa4.jpeg"}
                alt={selectedService?.title || "Soin sélectionné"}
              />
            </div>
            <div>
              <div className="rdv-recap-name">{selectedServiceName}</div>
              <div className="rdv-recap-meta">
                Durée: {selectedServiceDuration}
              </div>
            </div>
            <button
              className="rdv-recap-change"
              type="button"
              onClick={() => setCurrentStep(1)}
            >
              Changer ›
            </button>
          </div>
          <div className="rdv-step2-layout">
            <div className="rdv-cal-box">
              <div className="rdv-cal-header">
                <button
                  className="rdv-cal-nav"
                  type="button"
                  onClick={() => null}
                >
                  ◀
                </button>
                <div className="rdv-cal-month">{monthLabel}</div>
                <button
                  className="rdv-cal-nav"
                  type="button"
                  onClick={() => null}
                >
                  ▶
                </button>
              </div>
              <div className="rdv-cal-grid">
                <div className="rdv-day-names">
                  {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(
                    (label) => (
                      <div key={label} className="rdv-day-name">
                        {label}
                      </div>
                    ),
                  )}
                </div>
                <div className="rdv-days">
                  {daysOfMonth.map((day, index) => {
                    if (!day) {
                      return (
                        <div
                          key={`blank-${index}`}
                          className="rdv-day rdv-day-empty"
                        />
                      );
                    }

                    const isToday =
                      day.getDate() === today.getDate() &&
                      day.getMonth() === today.getMonth() &&
                      day.getFullYear() === today.getFullYear();
                    const isSelected =
                      selectedDate &&
                      day.getDate() === selectedDate.getDate() &&
                      day.getMonth() === selectedDate.getMonth();
                    const isPast = isBeforeToday(day);
                    const isClosed = day.getDay() === 0;

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        className={`rdv-day ${isToday ? "rdv-day-today" : ""} ${isSelected ? "rdv-day-selected" : ""} ${isPast ? "rdv-day-past" : ""} ${isClosed ? "rdv-day-closed" : ""}`}
                        disabled={isPast || isClosed}
                        onClick={() => {
                          if (!isPast && !isClosed) {
                            setSelectedDate(day);
                            setSelectedSlot("");
                          }
                        }}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rdv-slots-box">
              <div className="rdv-slots-title">
                {selectedDate
                  ? "Choisissez votre créneau"
                  : "Sélectionnez d'abord une date"}
              </div>
              <div className="rdv-slots-content">
                {!selectedDate ? (
                  <div className="rdv-slots-empty">
                    ← Choisissez une date dans le calendrier
                  </div>
                ) : slotOptions.length === 0 ? (
                  <div className="rdv-slots-empty">
                    Aucun créneau disponible pour cette date.
                  </div>
                ) : (
                  <div className="rdv-slots-grid">
                    {slotOptions.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`rdv-slot ${selectedSlot === slot ? "rdv-slot-sel" : ""}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="rdv-slots-legend">
                <div className="rdv-legend-item">
                  <span
                    className="rdv-legend-dot"
                    style={{ background: "var(--red)" }}
                  />
                  Sélectionné
                </div>
                <div className="rdv-legend-item">
                  <span
                    className="rdv-legend-dot"
                    style={{ background: "var(--border)" }}
                  />
                  Disponible
                </div>
                <div className="rdv-legend-item">
                  <span
                    className="rdv-legend-dot"
                    style={{ background: "#e0e0e0" }}
                  />
                  Fermé
                </div>
              </div>
            </div>
          </div>

          <div className="rdv-nav-row">
            <button
              className="rdv-btn-back"
              type="button"
              onClick={() => setCurrentStep(1)}
            >
              ← Retour
            </button>
            <button
              className="rdv-btn-main"
              type="button"
              disabled={!selectedSlot}
              onClick={() => setCurrentStep(3)}
            >
              Continuer
            </button>
          </div>
        </div>

        <div className={`rdv-panel ${currentStep === 3 ? "rdv-active" : ""}`}>
          <div className="rdv-step3-layout">
            <div className="rdv-booking-card">
              <div className="rdv-bcard-label">Votre rendez-vous</div>
              <div className="rdv-bcard-img">
                <img
                  src={selectedService?.image || "/images/spa4.jpeg"}
                  alt={selectedServiceName}
                />
              </div>
              <div className="rdv-bcard-name">{selectedServiceName}</div>
              <div className="rdv-bcard-detail">
                <span className="rdv-bcard-icon">📅</span>
                <span>
                  <strong>{selectedDateLabel}</strong>
                </span>
              </div>
              <div className="rdv-bcard-detail">
                <span className="rdv-bcard-icon">🕐</span>
                <span>
                  <strong>{selectedSlot || "—"}</strong>
                </span>
              </div>
              <div className="rdv-bcard-detail">
                <span className="rdv-bcard-icon">⏱</span>
                <span>
                  Durée : <strong>{selectedServiceDuration}</strong>
                </span>
              </div>
              <div className="rdv-bcard-detail">
                <span className="rdv-bcard-icon">📍</span>
                <span>Cocody Angré, 8e tranche</span>
              </div>
              <div className="rdv-bcard-detail" style={{ marginTop: 6 }}>
                <span className="rdv-bcard-icon">🏷️</span>
                <span>
                  Frais d'agence : <strong>5 000 FCFA</strong>
                </span>
              </div>
              <div className="rdv-bcard-price">
                {selectedServicePrice}
                <span> / séance</span>
              </div>
              <div className="rdv-bcard-note">
                Les frais d'agence (5 000 FCFA) sont dus à la réservation, quel
                que soit le soin choisi.
              </div>
            </div>

            <div className="rdv-form-box">
              {isConfirmed && (
                <div className="rdv-confirmation-banner">
                  Merci {formValues.firstName} ! Votre rendez-vous a été
                  réservé. Un membre de l'équipe vous contactera bientôt.
                </div>
              )}
              <div className="rdv-form-title">Vos coordonnées</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-lbl">Prénom</label>
                  <input
                    type="text"
                    className="form-inp"
                    value={formValues.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Aya"
                  />
                </div>
                <div className="form-group">
                  <label className="form-lbl">Nom</label>
                  <input
                    type="text"
                    className="form-inp"
                    value={formValues.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Kouassi"
                  />
                </div>
              </div>
              <div className="form-row solo">
                <div className="form-group">
                  <label className="form-lbl">Téléphone</label>
                  <input
                    type="tel"
                    className="form-inp"
                    value={formValues.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                  />
                </div>
              </div>
              <div className="form-row solo">
                <div className="form-group">
                  <label className="form-lbl">Email (optionnel)</label>
                  <input
                    type="email"
                    className="form-inp"
                    value={formValues.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="aya@email.com"
                  />
                </div>
              </div>
              <div className="form-row solo">
                <div className="form-group">
                  <label className="form-lbl">
                    Notes / Demandes particulières
                  </label>
                  <textarea
                    className="form-inp rdv-note-input"
                    value={formValues.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Ex : allergie à certains produits, longueur souhaitée..."
                  />
                </div>
              </div>

              <div className="rdv-acompte-box">
                <div className="rdv-acompte-banner">
                  <div>
                    <div className="rdv-acompte-title">Acompte obligatoire</div>
                    <div className="rdv-acompte-amount">5 000 FCFA</div>
                  </div>
                  <div className="rdv-acompte-icon">🔒</div>
                </div>
                <div className="rdv-acompte-info">
                  Cet acompte de <strong>5 000 FCFA</strong> est déduit de votre
                  prestation finale.
                  <strong>
                    Sans paiement, votre rendez-vous ne sera pas confirmé.
                  </strong>
                </div>
                <div className="rdv-acompte-methods-label">
                  Payer l'acompte via :
                </div>
                <div className="rdv-pay-methods">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.key}
                      type="button"
                      className={`rdv-pay-opt ${paymentMethod === method.key ? "active" : ""}`}
                      onClick={() => setPaymentMethod(method.key)}
                    >
                      <div className="pay-emoji">{method.emoji}</div>
                      <div className="pay-label">{method.label}</div>
                      <div className="pay-detail">{method.detail}</div>
                    </button>
                  ))}
                </div>
                <div className="rdv-pay-fields">
                  {paymentMethod === "mobile" && (
                    <>
                      <div className="form-row" style={{ marginBottom: 8 }}>
                        <div className="form-group">
                          <label className="form-lbl">Opérateur</label>
                          <select
                            className="form-inp"
                            value={formValues.operator || "Orange Money"}
                            onChange={(e) =>
                              handleInputChange("operator", e.target.value)
                            }
                          >
                            <option>Orange Money</option>
                            <option>MTN MoMo</option>
                            <option>Wave</option>
                            <option>Moov Money</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-lbl">
                            Numéro Mobile Money
                          </label>
                          <input
                            type="tel"
                            className="form-inp"
                            value={formValues.mmnum || ""}
                            onChange={(e) =>
                              handleInputChange("mmnum", e.target.value)
                            }
                            placeholder="+225 07 00 00 00 00"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {paymentMethod === "card" && (
                    <>
                      <div
                        className="form-row solo"
                        style={{ marginBottom: 10 }}
                      >
                        <div className="form-group">
                          <label className="form-lbl">Numéro de carte</label>
                          <div className="card-field-wrap">
                            <input
                              type="text"
                              className="form-inp"
                              value={formValues.cardnum || ""}
                              onChange={(e) =>
                                handleInputChange("cardnum", e.target.value)
                              }
                              placeholder="0000 0000 0000 0000"
                              maxLength="19"
                            />
                            <div className="card-logos-float">
                              <span className="card-logo-chip chip-visa">
                                VISA
                              </span>
                              <span className="card-logo-chip chip-mc">MC</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="form-row" style={{ marginBottom: 0 }}>
                        <div className="form-group">
                          <label className="form-lbl">Expiration</label>
                          <input
                            type="text"
                            className="form-inp"
                            value={formValues.expiration || ""}
                            onChange={(e) =>
                              handleInputChange("expiration", e.target.value)
                            }
                            placeholder="MM / AA"
                            maxLength="7"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-lbl">CVV</label>
                          <input
                            type="text"
                            className="form-inp"
                            value={formValues.cvv || ""}
                            onChange={(e) =>
                              handleInputChange("cvv", e.target.value)
                            }
                            placeholder="123"
                            maxLength="4"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {paymentMethod === "cash" && (
                    <div className="rdv-cash-note">
                      💡 Vous réglez l'acompte de <strong>5 000 FCFA</strong>{" "}
                      directement en boutique avant votre rendez-vous. Votre RDV
                      sera provisoirement réservé mais confirmé uniquement après
                      réception de l'acompte.
                    </div>
                  )}
                </div>
              </div>
              <div className="rdv-nav-row">
                <button
                  className="rdv-btn-back"
                  type="button"
                  onClick={() => setCurrentStep(2)}
                >
                  ← Retour
                </button>
                <button
                  className="rdv-btn-main"
                  type="button"
                  onClick={handleConfirm}
                >
                  Payer 5 000 FCFA &amp; confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BeauteRdvSection;
