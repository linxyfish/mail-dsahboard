import axios from 'axios'

export const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE ?? '/api', timeout: 15_000 })
http.interceptors.request.use(config => { const token = localStorage.getItem('mail-api-key'); if (token) config.headers.Authorization = `Bearer ${token}`; return config })
http.interceptors.response.use(response => response.data, error => Promise.reject(new Error(error.response?.data?.message ?? error.message ?? '网络异常')))
