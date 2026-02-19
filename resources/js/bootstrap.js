import axios from 'axios';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set CSRF token for Laravel
const setCSRFToken = () => {
	const tokenMeta = document.querySelector('meta[name="csrf-token"]');
	if (tokenMeta) {
		const token = tokenMeta.getAttribute('content');
		window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
		// Aussi ajouter à la configuration POST/PUT/PATCH/DELETE
		window.axios.defaults.headers.post['X-CSRF-TOKEN'] = token;
		window.axios.defaults.headers.put['X-CSRF-TOKEN'] = token;
		window.axios.defaults.headers.patch['X-CSRF-TOKEN'] = token;
	}
};

// Appeler au démarrage et après chaque réponse
setCSRFToken();

// Intercepteur pour régénérer le token si nécessaire
window.axios.interceptors.response.use(
	response => response,
	error => {
		// Si erreur 419, le token a peut-être expiré, régénérer
		if (error.response?.status === 419) {
			setCSRFToken();
		}
		return Promise.reject(error);
	}
);

