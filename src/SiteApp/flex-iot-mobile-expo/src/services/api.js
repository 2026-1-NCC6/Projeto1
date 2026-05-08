import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL || API_BASE_URL.replace('/api', '');

console.log('API_BASE_URL:', API_BASE_URL);
console.log('SOCKET_URL:', SOCKET_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('@flexiot:token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => response,
  error => {
    console.log('Erro na API:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      url: error?.config?.url,
      baseURL: error?.config?.baseURL
    });

    return Promise.reject(error);
  }
);

export function apiErrorMessage(error) {
  if (error?.code === 'ECONNABORTED') {
    return 'Tempo de conexão esgotado. O backend pode estar acordando no Render. Aguarde alguns segundos e tente novamente.';
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.message) {
    return error.message;
  }

  return 'Erro inesperado';
}

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),

  me: () => api.get('/auth/me'),

  recoverPassword: async email => {
    await new Promise(resolve => setTimeout(resolve, 700));

    return {
      data: {
        message: `Instruções simuladas enviadas para ${email}`
      }
    };
  }
};

export const dashboardApi = {
  get: () => api.get('/dashboard')
};

export const environmentApi = {
  list: () => api.get('/environments')
};

export const deviceApi = {
  list: () => api.get('/devices')
};

export const readingApi = {
  list: ({ from, to, environmentId, deviceId, limit = 200 } = {}) =>
    api.get('/readings', {
      params: {
        from,
        to,
        environmentId,
        deviceId,
        limit
      }
    })
};

export const alertApi = {
  list: () => api.get('/alerts')
};