import axios from 'axios';

const API = import.meta.env.VITE_API_BASE;          // from .env files

export const api = axios.create({
  baseURL: API,
  withCredentials: false,       // keep if you don't need cookies
});

/* optional shorthand wrappers */
export const get  = api.get;
export const post = api.post;
export const patch= api.patch;
export const del  = api.delete;