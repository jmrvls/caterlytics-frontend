import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function getAllPackages() {
  const response = await axios.get(`${API_URL}/packages`, getAuthHeaders());
  return response.data.packages || [];
}

export async function createPackage(packageData) {
  const response = await axios.post(`${API_URL}/packages`, packageData, getAuthHeaders());
  return response.data;
}

export async function updatePackage(id, packageData) {
  const response = await axios.put(`${API_URL}/packages/${id}`, packageData, getAuthHeaders());
  return response.data;
}

export async function deletePackage(id) {
  const response = await axios.delete(`${API_URL}/packages/${id}`, getAuthHeaders());
  return response.data;
}