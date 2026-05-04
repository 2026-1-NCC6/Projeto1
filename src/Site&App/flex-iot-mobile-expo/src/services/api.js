import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';
export const SOCKET_URL = API_BASE_URL.replace('/api', '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@flexiot:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function apiErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Erro inesperado';
}

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  recoverPassword: async (email) => {
    // Backend atual não possui rota real de recuperação.
    // Para o requisito acadêmico, a simulação acontece no app.
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { data: { message: `Instruções simuladas enviadas para ${email}` } };
  },
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export const environmentApi = {
  list: () => api.get('/environments'),
};

export const deviceApi = {
  list: () => api.get('/devices'),
};

export const readingApi = {
  list: ({ from, to, environmentId, deviceId, limit = 200 } = {}) =>
    api.get('/readings', { params: { from, to, environmentId, deviceId, limit } }),
};

export const alertApi = {
  list: () => api.get('/alerts'),
};
