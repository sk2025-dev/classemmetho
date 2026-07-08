import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  Menu,
  X,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";
import { clearOldStepData } from "../Hooks/usePersistentState";
import { withBasePath } from "../Utils/urlHelper";
const CHURCH_DATA = {
  name: "Église Methodiste du Jubile de Cocody",
  tagline: "Une communauté de foi, d'amour et de partage",
};

const Navbar = ({ activeSection, isScrolled, basePath }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const withBase = (path) => withBasePath(basePath, path);

  const navLinks = [
    { name: "Accueil", href: "#home" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm py-4"
          : "bg-transparent py-6 text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg shadow-md">
              <img
                src={withBase("/images/image.png")}
                alt="Logo Église ClasseMethodo Jubile"
                className="h-10 w-10 object-contain"
              />
            </div>
            <span
              className={`text-xl font-bold tracking-tight ${
                isScrolled ? "text-slate-900" : "text-white"
              }`}
            >
              {CHURCH_DATA.name}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-amber-500 ${
                  activeSection === link.href.replace("#", "")
                    ? "text-amber-500 font-semibold"
                    : isScrolled
                      ? "text-slate-600"
                      : "text-white/90"
                }`}
              >
                {link.name}
              </a>
            ))}
            <Link
              href={withBase("/login")}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                isScrolled
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-white text-slate-900 hover:bg-slate-100"
              }`}
            >
              Connexion
            </Link>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden ${
              isScrolled ? "text-slate-900" : "text-white"
            }`}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b shadow-xl animate-fade-in-down">
          <div className="flex flex-col p-4 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-700 font-medium hover:text-amber-600"
              >
                {link.name}
              </a>
            ))}
            <Link
              href={withBase("/login")}
              className="w-full bg-amber-500 text-white text-center py-3 rounded-lg font-bold"
            >
              Connexion Membre
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default function Welcome() {
  const { app } = usePage().props;
  const basePath = app?.basePath || "";
  const withBase = (path) => withBasePath(basePath, path);

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isDonModalOpen, setIsDonModalOpen] = useState(false);
  const [donLoading, setDonLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [donSuccessModal, setDonSuccessModal] = useState(null);
  const [donForm, setDonForm] = useState({
    nom: "",
    numero: "",
    montant: "",
    mode_paiement: "MOBILE_MONEY",
    operateur: "WAVE",
    motif: "",
  });
  const [cardInfo, setCardInfo] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [showCvv, setShowCvv] = useState(false);

  const formatCardNumber = (v) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  const detectCardType = (n) => {
    const num = n.replace(/\s/g, "");
    if (/^4/.test(num)) return "VISA";
    if (/^5[1-5]/.test(num)) return "MASTERCARD";
    return null;
  };

  useEffect(() => {
    clearOldStepData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const sections = ["home", "services", "contact"];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom > 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const donStatus = params.get("don");
    if (!donStatus) return;

    const cleanUrl = `${window.location.pathname}${window.location.hash || ""}`;
    window.history.replaceState({}, "", cleanUrl);

    if (donStatus === "success") {
      setDonSuccessModal({
        reference: params.get("ref") || null,
        montant: params.get("montant") || null,
        receiptUrl: params.get("receipt") || null,
      });
    } else if (donStatus === "cancelled") {
      showToast("Paiement annulé.", "error");
    } else if (donStatus === "failed") {
      showToast("Le paiement a échoué. Veuillez réessayer.", "error");
    } else {
      showToast("Erreur lors du traitement du don.", "error");
    }
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const csrf = () => {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute("content") : "";
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(";").shift();
    }
    return "";
  };

  const closeDonModal = () => {
    setIsDonModalOpen(false);
    setDonForm({
      nom: "",
      numero: "",
      montant: "",
      mode_paiement: "MOBILE_MONEY",
      operateur: "WAVE",
      motif: "",
    });
    setCardInfo({ number: "", name: "", expiry: "", cvv: "" });
    setShowCvv(false);
  };

  const submitAnonymousDon = async () => {
    const nom = String(donForm.nom || "").trim();
    const numero = String(donForm.numero || "").trim();
    const montant = Number(donForm.montant || 0);

    // Déterminer le mode de paiement final
    const modePaiement =
      donForm.mode_paiement === "MOBILE_MONEY"
        ? donForm.operateur
        : donForm.mode_paiement;

    if (!numero) {
      showToast("Le numero est requis.", "error");
      return;
    }
    if (!/^\d{10}$/.test(numero)) {
      showToast("Le numero doit contenir exactement 10 chiffres.", "error");
      return;
    }
    if (montant < 100) {
      showToast("Le montant minimum est de 100 F CFA.", "error");
      return;
    }

    try {
      setDonLoading(true);
      const csrfToken = csrf();
      const xsrfToken = decodeURIComponent(getCookie("XSRF-TOKEN") || "");

      const response = await fetch(withBase("/dons/anonyme"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-TOKEN": csrfToken,
          "X-XSRF-TOKEN": xsrfToken,
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          _token: csrfToken,
          nom_donateur: nom || "Anonyme",
          numero_donateur: numero,
          montant,
          mode_paiement: modePaiement,
          motif: donForm.motif || null,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 419) {
          throw new Error("Session expiree. Recharge la page puis reessaie.");
        }
        throw new Error(payload?.message || "Paiement en ligne impossible");
      }

      if (payload?.redirect_url) {
        window.location.href = payload.redirect_url;
        return;
      }

      showToast(payload?.message || "Paiement initialise.", "success");
    } catch (error) {
      showToast(
        error?.message || "Erreur pendant l'initialisation du paiement.",
        "error",
      );
    } finally {
      setDonLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen overflow-x-hidden">
      {toast && (
        <div className="fixed top-4 right-4 z-[90] max-w-sm">
          <div
            className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl ${
              toast.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-rose-700 text-white"
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity mt-0.5"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {donSuccessModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setDonSuccessModal(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center">
            <button
              onClick={() => setDonSuccessModal(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={44} className="text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Don confirmé !
            </h3>
            <p className="text-slate-500 mb-5 leading-relaxed">
              Merci pour votre générosité. Votre don a bien été reçu et
              enregistré. Que Dieu bénisse votre geste.
            </p>

            {(donSuccessModal.reference || donSuccessModal.montant) && (
              <div className="bg-slate-50 rounded-2xl p-4 mb-5 text-left space-y-2">
                {donSuccessModal.montant && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Montant</span>
                    <span className="font-bold text-slate-800">
                      {Number(donSuccessModal.montant).toLocaleString("fr-FR")}{" "}
                      F CFA
                    </span>
                  </div>
                )}
                {donSuccessModal.reference && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Référence</span>
                    <span className="font-mono text-xs text-slate-700 break-all text-right">
                      {donSuccessModal.reference}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {donSuccessModal.reference && (
                <a
                  href={withBase(`/dons/recu/${donSuccessModal.reference}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                >
                  Télécharger mon reçu (PDF)
                </a>
              )}
              <button
                onClick={() => setDonSuccessModal(null)}
                className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar
        activeSection={activeSection}
        isScrolled={isScrolled}
        basePath={basePath}
      />

      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
        }}
      >
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop"
            alt="Church Background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-slate-900/30"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            Votre lieu de <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Connexion Spirituelle
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto font-light">
            {CHURCH_DATA.tagline}. Rejoignez une communauté dynamique qui change
            des vies.
          </p>

          <div className="flex justify-center">
            <button
              onClick={() => setIsDonModalOpen(true)}
              className="group px-8 py-4 bg-amber-500 text-white rounded-full font-bold text-lg transition-all hover:scale-105 hover:bg-amber-600 shadow-2xl shadow-amber-500/30"
            >
              <span className="flex items-center gap-2">
                Faire un don
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowRight className="rotate-90 text-white/50 w-8 h-8" />
        </div>
      </section>

      {isDonModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={closeDonModal}
          />
          <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeDonModal}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Faire un don
            </h3>
            <p className="text-slate-600 mb-6">
              Remplissez le formulaire ci-dessous pour effectuer votre don.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Nom{" "}
                  <span className="text-slate-400 font-normal">
                    (optionnel)
                  </span>
                </label>
                <input
                  type="text"
                  value={donForm.nom}
                  onChange={(e) =>
                    setDonForm((prev) => ({
                      ...prev,
                      nom: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Laissez vide pour rester anonyme"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Numéro
                </label>
                <input
                  type="tel"
                  value={donForm.numero}
                  onChange={(e) =>
                    setDonForm((prev) => ({
                      ...prev,
                      numero: e.target.value.replace(/\D/g, "").slice(0, 10),
                    }))
                  }
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Ex: 0700000000"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Montant (F CFA)
                </label>
                <input
                  type="number"
                  min="100"
                  value={donForm.montant}
                  onChange={(e) =>
                    setDonForm((prev) => ({
                      ...prev,
                      montant: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Ex: 5000"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Mode de paiement
                </label>
                <select
                  value={donForm.mode_paiement}
                  onChange={(e) =>
                    setDonForm((prev) => ({
                      ...prev,
                      mode_paiement: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="ESPECES">Especes</option>
                  <option value="CARTE">Carte bancaire</option>
                </select>
              </div>

              {donForm.mode_paiement === "MOBILE_MONEY" && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Opérateur
                  </label>
                  <select
                    value={donForm.operateur}
                    onChange={(e) =>
                      setDonForm((prev) => ({
                        ...prev,
                        operateur: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-300 bg-amber-50"
                  >
                    <option value="WAVE">Wave</option>
                    <option value="ORANGE">Orange Money</option>
                    <option value="MOOV_CI">Moov CI</option>
                  </select>
                </div>
              )}

              {donForm.mode_paiement === "CARTE" && (
                <div className="space-y-3">
                  {/* Aperçu visuel de la carte */}
                  <div
                    className="relative rounded-2xl p-5 text-white overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #1E40AF 0%, #6B46C1 100%)",
                      minHeight: 140,
                    }}
                  >
                    <div className="absolute top-4 right-4 flex items-center gap-1">
                      {detectCardType(cardInfo.number) === "VISA" && (
                        <span className="text-white font-black text-xl italic tracking-widest">VISA</span>
                      )}
                      {detectCardType(cardInfo.number) === "MASTERCARD" && (
                        <span className="flex gap-0.5">
                          <span className="w-7 h-7 rounded-full bg-red-500 opacity-90" />
                          <span className="w-7 h-7 rounded-full bg-yellow-400 opacity-90 -ml-3" />
                        </span>
                      )}
                      {!detectCardType(cardInfo.number) && (
                        <span className="text-white/50 text-xs font-semibold">VISA / MC</span>
                      )}
                    </div>
                    <div className="mt-2 mb-4">
                      <div className="font-mono text-lg tracking-widest text-white/90">
                        {cardInfo.number
                          ? cardInfo.number.padEnd(19, " ").replace(/ /g, " ")
                          : "XXXX XXXX XXXX XXXX"}
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-white/50 text-xs uppercase tracking-wider">Nom</div>
                        <div className="text-sm font-semibold uppercase tracking-wider">
                          {cardInfo.name || "NOM PRÉNOM"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white/50 text-xs uppercase tracking-wider">Expiration</div>
                        <div className="text-sm font-semibold">{cardInfo.expiry || "MM/AA"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Numéro de carte */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Numéro de carte</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      value={cardInfo.number}
                      onChange={(e) =>
                        setCardInfo((prev) => ({
                          ...prev,
                          number: formatCardNumber(e.target.value),
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono tracking-widest outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  {/* Nom du porteur */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Nom sur la carte</label>
                    <input
                      type="text"
                      placeholder="JEAN DUPONT"
                      value={cardInfo.name}
                      onChange={(e) =>
                        setCardInfo((prev) => ({
                          ...prev,
                          name: e.target.value.toUpperCase(),
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 uppercase tracking-wider outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  {/* Expiration + CVV côte à côte */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Expiration</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cardInfo.expiry}
                        onChange={(e) =>
                          setCardInfo((prev) => ({
                            ...prev,
                            expiry: formatExpiry(e.target.value),
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">CVV</label>
                      <div className="relative">
                        <input
                          type={showCvv ? "text" : "password"}
                          inputMode="numeric"
                          placeholder="123"
                          maxLength={4}
                          value={cardInfo.cvv}
                          onChange={(e) =>
                            setCardInfo((prev) => ({
                              ...prev,
                              cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-blue-300 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCvv((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 mt-0.5"
                        >
                          {showCvv ? <X size={15} /> : <CheckCircle2 size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                    Paiement sécurisé via PayDunya — vos données ne sont pas stockées
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Motif (optionnel)
                </label>
                <textarea
                  rows={3}
                  value={donForm.motif}
                  onChange={(e) =>
                    setDonForm((prev) => ({
                      ...prev,
                      motif: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Motif du don..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={closeDonModal}
                  className="px-5 py-3 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Fermer
                </button>
                <button
                  onClick={submitAnonymousDon}
                  disabled={donLoading}
                  className="px-5 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 disabled:opacity-60"
                >
                  {donLoading ? "Traitement..." : "Valider le don"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer
        id="contact"
        className="bg-slate-900 border-t border-slate-800 py-12 text-slate-400 text-sm"
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-2">
              <span className="inline-flex items-center gap-2 text-white font-bold text-lg">
                <MapPin size={20} className="text-amber-500" />
                Abidjan, Cocody, Rue des Jardins, Côte d'Ivoire
              </span>
            </div>
            <p className="text-slate-400">
              &copy; {new Date().getFullYear()} Église Methodiste du Jubile.
              Tous droits réservés.
            </p>
          </div>
          <div className="flex gap-6">
            <a
              href="https://www.facebook.com/emujubiledecocody"
              className="hover:text-white transition-colors"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Facebook
                size={28}
                className="text-blue-500 hover:scale-110 transition-transform"
              />
            </a>
            <a
              href="https://www.instagram.com/emcijubiledecocody/"
              className="hover:text-white transition-colors"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram
                size={28}
                className="text-pink-500 hover:scale-110 transition-transform"
              />
            </a>
            <a
              href="https://youtube.com/@eglisemethodistejubiledecocody?si=Y17DEcGhySc1AhYx"
              className="hover:text-white transition-colors"
              aria-label="YouTube"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Youtube
                size={28}
                className="text-red-500 hover:scale-110 transition-transform"
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
