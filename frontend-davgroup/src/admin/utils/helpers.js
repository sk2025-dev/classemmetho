export const formatPrice = (value) => {
  return Number(value).toLocaleString("fr-FR") + " FCFA";
};

export const getStatusBadge = (status, STATUS_MAP) => {
  const map = STATUS_MAP[status] || { label: status, cls: "s-pending" };
  return map;
};

export const getPaymentLabel = (method, PAY_LABELS) => {
  return PAY_LABELS[method] || method;
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const getDateToday = () => {
  const date = new Date();
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
