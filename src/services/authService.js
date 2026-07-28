import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

export async function loginUser(username, password) {
  const response = await axios.post(`${API_URL}/login`, {
    username,
    password
  });
  return response.data;
}

export async function registerUser(username, password, full_name) {
  const response = await axios.post(`${API_URL}/register`, {
    username,
    password,
    full_name
  });
  return response.data;
}