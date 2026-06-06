export const STATUS_MAP = {
  pending: { label: "En attente", cls: "s-pending" },
  confirmed: { label: "Confirmée", cls: "s-confirmed" },
  shipped: { label: "Expédiée", cls: "s-shipped" },
  delivered: { label: "Livrée", cls: "s-delivered" },
  cancelled: { label: "Annulée", cls: "s-cancelled" },
  awaiting: { label: "Acompte dû", cls: "s-awaiting" },
  done: { label: "Terminé", cls: "s-done" },
};

export const PAY_LABELS = {
  mobile: "Mobile Money",
  card: "Carte bancaire",
  cash: "Paiement livraison",
};

export const BADGE_OPTIONS = [
  { value: "", label: "Aucun badge" },
  { value: "badge-new", label: "Nouveau" },
  { value: "badge-best", label: "Best-seller" },
  { value: "badge-promo", label: "Promo" },
];

export const MOCK_PRODUCTS = [
  {
    name: "Duo Black Pouss",
    cat: "Capillaires",
    price: "14 000",
    img: "/images/blackplus.png",
  },
  {
    name: "Duo Pousse Accéléré",
    cat: "Capillaires",
    price: "14 000",
    img: "frontend/images/duopousseaccelere.jpeg",
  },
  {
    name: "Huile Black Plus",
    cat: "Capillaires",
    price: "5 000",
    img: "frontend/images/huileblackplus.jpeg",
  },
  {
    name: "Huile Simple Pousse",
    cat: "Capillaires",
    price: "7 000",
    img: "frontend/images/huilesimplepouss.jpeg",
  },
  {
    name: "Shampoing Aloe Vera",
    cat: "Capillaires",
    price: "10 000",
    img: "frontend/images/shampoing aloe vera.jpeg",
  },
  {
    name: "Shampoing Gingembre",
    cat: "Capillaires",
    price: "10 000",
    img: "frontend/images/shampoing gimgimbre.jpeg",
  },
  {
    name: "Crème capillaire",
    cat: "Capillaires",
    price: "10 000",
    img: "frontend/images/cremecapilaire.jpeg",
  },
  {
    name: "Pommade de cheveux",
    cat: "Capillaires",
    price: "5 000",
    img: "frontend/images/pommade decheveux.jpeg",
  },
  {
    name: "DAV'Avocado",
    cat: "Cosmétiques",
    price: "2 500",
    img: "frontend/images/avocado.jpeg",
  },
  {
    name: "DAV Curcuma",
    cat: "Cosmétiques",
    price: "1 500",
    img: "frontend/images/davcucurma.jpeg",
  },
  {
    name: "DAV Carotte",
    cat: "Cosmétiques",
    price: "5 500",
    img: "frontend/images/DAVcarotte.jpeg",
  },
  {
    name: "DAV Cacao",
    cat: "Cosmétiques",
    price: "5 500",
    img: "frontend/images/davcacao.jpeg",
  },
  {
    name: "DAV Lemon",
    cat: "Cosmétiques",
    price: "5 500",
    img: "frontend/images/davlemon.jpeg",
  },
  {
    name: "Dav'Miel",
    cat: "Cosmétiques",
    price: "5 500",
    img: "frontend/images/davcurcuma bronze.jpeg",
  },
  {
    name: "Dav'Carotte savon",
    cat: "Cosmétiques",
    price: "5 500",
    img: "frontend/images/caro.jpeg",
  },
  {
    name: "Gel à base d'oeuf",
    cat: "Cosmétiques",
    price: "5 500",
    img: "frontend/images/geloeuf.jpeg",
  },
  {
    name: "Gel Aloe Vera",
    cat: "Cosmétiques",
    price: "5 500",
    img: "frontend/images/geldouchealoevera.jpeg",
  },
  {
    name: "Gel Curcuma",
    cat: "Cosmétiques",
    price: "5 500",
    img: "frontend/images/gelcurcuma.jpeg",
  },
  {
    name: "Huile Miracle",
    cat: "Cosmétiques",
    price: "5 500",
    img: "frontend/images/huilecorps.jpeg",
  },
];

export const MOCK_ORDERS = [
  {
    id: "#DAV-2847",
    date: "2026-05-20 10:23",
    client: {
      name: "Aya Kouassi",
      phone: "+225 07 57 24 93 90",
      address: "Cocody Angré 8e tranche",
      city: "Abidjan",
    },
    items: [
      { name: "Shampoing Aloe Vera", qty: 2, price: 10000 },
      { name: "DAV Avocado", qty: 1, price: 2500 },
    ],
    total: 24500,
    payMethod: "mobile",
    status: "pending",
  },
  {
    id: "#DAV-2841",
    date: "2026-05-20 08:47",
    client: {
      name: "Mariame Bamba",
      phone: "+225 05 44 22 11 33",
      address: "Yopougon Selmer",
      city: "Abidjan",
    },
    items: [{ name: "Duo Black Pouss", qty: 1, price: 14000 }],
    total: 14000,
    payMethod: "cash",
    status: "confirmed",
  },
];

export const MOCK_RDVS = [
  {
    id: "#RDV-9341",
    rdvDate: "2026-05-22",
    slot: "10:00",
    service: "Tresses africaines",
    duration: "3h",
    svcPrice: 8000,
    client: { name: "Fatou Diallo", phone: "+225 05 44 33 22 11", email: "" },
    payMethod: "mobile",
    acompte: 5000,
    status: "confirmed",
  },
  {
    id: "#RDV-9338",
    rdvDate: "2026-05-21",
    slot: "14:00",
    service: "Soin visage éclat",
    duration: "1h",
    svcPrice: 22000,
    client: {
      name: "Aïssatou Koné",
      phone: "+225 07 11 22 33 44",
      email: "aissatou@gmail.com",
    },
    payMethod: "card",
    acompte: 5000,
    status: "awaiting",
  },
];
