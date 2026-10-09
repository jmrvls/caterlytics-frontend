import { supabase } from '../supabaseClient';

// Texts the client that their booking is confirmed.
// Never throws: a failed SMS must not undo or block the booking confirmation.
// Always resolves to { sent: boolean, reason?, message? } so the caller can
// tell the admin when the text did NOT go out (it used to fail silently).
export async function sendBookingConfirmationSms(bookingId, { force = false } = {}) {
  try {
    const { data, error } = await supabase.functions.invoke('send-booking-sms', {
      body: { booking_id: bookingId, force },
    });
    if (error) {
      let message = 'The SMS service could not be reached.';
      try {
        // The function replies with { error: '...' } on failures.
        const payload = await error.context.json();
        if (payload?.error) message = payload.error;
      } catch {
        // No readable body (e.g. network down) -- keep the default message.
      }
      console.warn('Booking confirmation SMS failed:', message);
      return { sent: false, reason: 'error', message };
    }
    if (data && data.sent === false && data.reason !== 'already_sent') {
      console.warn('Booking confirmation SMS not sent:', data.reason, data.message || '');
    }
    if (data && data.sent === false && !data.message) {
      const reasons = {
        invalid_phone: 'The client has no valid mobile number on file.',
        not_confirmed: 'The booking is not Confirmed.',
      };
      data.message = reasons[data.reason] || data.detail || 'Unknown error.';
    }
    return data; // { sent: true } or { sent: false, reason, message }
  } catch (err) {
    console.error('Booking confirmation SMS failed:', err);
    return { sent: false, reason: 'error', message: 'The SMS service could not be reached.' };
  }
}

// Admin's "Resend SMS" button: sends again even if one was already marked as sent.
export function resendBookingConfirmationSms(bookingId) {
  return sendBookingConfirmationSms(bookingId, { force: true });
}

// Texts the client that their booking was cancelled (or, if it was still
// Pending, that the request could not be accepted). Never throws, same
// contract as sendBookingConfirmationSms.
export async function sendBookingCancellationSms(bookingId, previousStatus) {
  try {
    const { data, error } = await supabase.functions.invoke('send-booking-cancel-sms', {
      body: { booking_id: bookingId, previous_status: previousStatus },
    });
    if (error) {
      let message = 'The SMS service could not be reached.';
      try {
        const payload = await error.context.json();
        if (payload?.error) message = payload.error;
      } catch {
        // No readable body -- keep the default message.
      }
      console.warn('Booking cancellation SMS failed:', message);
      return { sent: false, reason: 'error', message };
    }
    if (data && data.sent === false && !data.message) {
      const reasons = {
        invalid_phone: 'The client has no valid mobile number on file.',
        not_cancelled: 'The booking is not Cancelled.',
      };
      data.message = reasons[data.reason] || data.detail || 'Unknown error.';
    }
    return data;
  } catch (err) {
    console.error('Booking cancellation SMS failed:', err);
    return { sent: false, reason: 'error', message: 'The SMS service could not be reached.' };
  }
}