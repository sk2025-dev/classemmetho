import { useAdmin } from "../hooks/useAdmin";
import "../styles/admin.css";

const Toast = () => {
  const { toast } = useAdmin();

  if (!toast) return null;

  return <div className="save-toast show">{toast}</div>;
};

export default Toast;
