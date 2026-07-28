import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function getUsers() {
  const response = await axios.get(`${API_URL}/users`, getAuthHeaders());
  return response.data;
}

export async function createStaffUser(username, password, full_name, role) {
  const response = await axios.post(
    `${API_URL}/users/create`,
    { username, password, full_name, role },
    getAuthHeaders()
  );
  return response.data;
}