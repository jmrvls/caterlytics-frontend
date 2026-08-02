import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function getAllInventory() {
  const response = await axios.get(`${API_URL}/inventory`, getAuthHeaders());
  return response.data.items || [];
}

export async function createInventoryItem(itemData) {
  const response = await axios.post(`${API_URL}/inventory`, itemData, getAuthHeaders());
  return response.data;
}

export async function updateInventoryItem(id, itemData) {
  const response = await axios.put(`${API_URL}/inventory/${id}`, itemData, getAuthHeaders());
  return response.data;
}

export async function adjustInventoryStock(id, adjustment) {
  const response = await axios.patch(`${API_URL}/inventory/${id}/adjust`, { adjustment }, getAuthHeaders());
  return response.data;
}

export async function deleteInventoryItem(id) {
  const response = await axios.delete(`${API_URL}/inventory/${id}`, getAuthHeaders());
  return response.data;
}