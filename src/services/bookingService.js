import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
}

// 1. Binago mula getBookings -> getAllBookings para tumugma sa Vue file mo
export async function getAllBookings() {
  const response = await axios.get(`${API_URL}/bookings`, getAuthHeaders());
  return response.data;
}

export async function createBooking(bookingData) {
  const response = await axios.post(`${API_URL}/bookings`, bookingData, getAuthHeaders());
  return response.data;
}

export async function updateBookingStatus(id, status) {
  const response = await axios.patch(`${API_URL}/bookings/${id}/status`, { status }, getAuthHeaders());
  return response.data;
}

export async function deleteBooking(id) {
  const response = await axios.delete(`${API_URL}/bookings/${id}`, getAuthHeaders());
  return response.data;
}

// 2. IDINAGDAG: Function para sa checkDateConflict gamit ang Axios
export async function checkDateConflict(eventDate) {
  try {
    const response = await axios.get(`${API_URL}/bookings/check-conflict`, {
      ...getAuthHeaders(),
      params: { date: eventDate }
    });
    return response.data; // Dapat mag-return ang backend mo ng { conflict: true/false, existingBookings: [...] }
  } catch (error) {
    // Fallback kung wala ka pang endpoint sa backend para dito:
    const allBookings = await getAllBookings();
    const existing = allBookings.filter(b => b.event_date === eventDate);
    return {
      conflict: existing.length > 0,
      existingBookings: existing
    };
  }
}