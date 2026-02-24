import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar usuario del localStorage al iniciar
    const loadUser = () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error al parsear usuario:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      const { access_token, refresh_token, user: userData } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);

      // Redirigir según rol
      if (userData.rol === 'admin') {
        navigate('/admin/dashboard');
      } else if (userData.rol === 'tutor') {
        navigate('/tutor/dashboard');
      } else {
        navigate('/dashboard');
      }

      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al iniciar sesión',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const register = async (nombre, email, password, rol) => {
    try {
      const response = await api.post('/register', {
        nombre,
        email,
        password,
        rol,
      });

      // Ya NO se hace login automático
      // El backend devuelve solo un mensaje, no tokens
      return {
        success: true,
        message: response.data.message
      };

    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al registrarse',
      };
    }
  };

  const value = {
    user,
    setUser,
    login,
    logout,
    register,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'admin',
    isTutor: user?.rol === 'tutor',
    isAlumno: user?.rol === 'alumno',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}