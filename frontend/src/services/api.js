import axios from 'axios';

// Usar variable de entorno o localhost por defecto
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

// Endpoints de autenticación: un 401 acá significa credenciales incorrectas,
// no un token vencido, así que no se debe intentar refrescar el token.
const AUTH_ENDPOINTS = ['/login', '/register', '/refresh'];

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function cerrarSesion() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// Si varias peticiones reciben 401 al mismo tiempo, todas esperan
// el mismo refresh en lugar de pedir un token nuevo cada una.
let refreshEnCurso = null;

async function refrescarToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  const response = await axios.post(`${API_URL}/refresh`, {
    refresh_token: refreshToken,
  });
  const { access_token } = response.data;
  localStorage.setItem('access_token', access_token);
  return access_token;
}

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const esEndpointDeAuth = AUTH_ENDPOINTS.includes(originalRequest?.url);

    // Si el token expiró, intentar refrescarlo (salvo en login/registro,
    // donde el 401 se devuelve tal cual para mostrar el mensaje de error)
    if (
      error.response?.status === 401 &&
      !esEndpointDeAuth &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (!localStorage.getItem('refresh_token')) {
        cerrarSesion();
        return Promise.reject(error);
      }

      try {
        refreshEnCurso = refreshEnCurso || refrescarToken();
        const accessToken = await refreshEnCurso;

        // Reintentar la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si el refresh falla, limpiar tokens y redirigir al login
        cerrarSesion();
        return Promise.reject(refreshError);
      } finally {
        refreshEnCurso = null;
      }
    }

    return Promise.reject(error);
  }
);

export default api;