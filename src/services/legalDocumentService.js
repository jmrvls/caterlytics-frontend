import { supabase } from '../supabaseClient';
import { cleanDocForm, validateFile } from '../utils/legaldocs';

const BUCKET = 'legal-documents';
const COLUMNS = 'document_id, title, doc_type, party_name, reference_no, issue_date, expiry_date, notes, file_path, file_name, file_size, mime_type, created_at, updated_at';

function isMissingTable(error) {
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    /could not find the table|does not exist/i.test(error?.message || '')
  );
}

function setupError() {
  const err = new Error('Legal document handling is not set up in the database yet. Run legal_documents.sql in the Supabase SQL Editor.');
  err.code = 'LEGAL_NOT_SET_UP';
  return err;
}

// Storage keys can't contain odd characters, so keep the name URL-safe.
// The original name is kept separately in file_name for display/download.
function storagePath(businessId, fileName) {
  const safe = String(fileName).replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80);
  const unique = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  return `${businessId}/${unique}-${safe}`;
}

async function uploadFile(businessId, file) {
  validateFile(file);
  const path = storagePath(businessId, file.name);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: '3600',
    contentType: file.type || undefined,
  });
  if (error) {
    if (/bucket not found/i.test(error.message || '')) throw setupError();
    throw new Error(error.message || 'Failed to upload the file.');
  }
  return path;
}

async function removeFile(path) {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.warn('Could not remove file from storage:', error.message);
}

// RLS limits this to the caller's own business (Admin / Owner-Manager only).
export async function getLegalDocuments() {
  const { data, error } = await supabase
    .from('tbl_legal_documents')
    .select(COLUMNS)
    .order('expiry_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    if (isMissingTable(error)) throw setupError();
    throw new Error(error.message || 'Failed to load documents.');
  }
  return data || [];
}

export async function uploadLegalDocument(businessId, form, file) {
  if (!businessId) throw new Error('Your account is not linked to a business.');
  const clean = cleanDocForm(form); // validate the details before uploading anything
  const path = await uploadFile(businessId, file);

  const { data, error } = await supabase
    .from('tbl_legal_documents')
    .insert({
      ...clean,
      business_id: businessId,
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    await removeFile(path); // don't leave an orphaned file behind
    if (isMissingTable(error)) throw setupError();
    if (error.code === '42501') throw new Error('You do not have permission to upload documents.');
    throw new Error(error.message || 'Failed to save the document.');
  }
  return data;
}

// Edit details; pass `newFile` to replace the attached file as well.
export async function updateLegalDocument(doc, form, newFile = null, businessId = null) {
  const clean = cleanDocForm(form);
  const patch = { ...clean };
  let newPath = null;

  if (newFile) {
    newPath = await uploadFile(businessId, newFile);
    Object.assign(patch, {
      file_path: newPath,
      file_name: newFile.name,
      file_size: newFile.size,
      mime_type: newFile.type || null,
    });
  }

  const { data, error } = await supabase
    .from('tbl_legal_documents')
    .update(patch)
    .eq('document_id', doc.document_id)
    .select(COLUMNS)
    .maybeSingle();

  if (error || !data) {
    if (newPath) await removeFile(newPath);
    if (error) throw new Error(error.message || 'Failed to update the document.');
    throw new Error('You do not have permission to edit this document.');
  }
  if (newPath) await removeFile(doc.file_path); // old file is no longer referenced
  return data;
}

export async function deleteLegalDocument(doc) {
  const { data, error } = await supabase
    .from('tbl_legal_documents')
    .delete()
    .eq('document_id', doc.document_id)
    .select('document_id');

  if (error) throw new Error(error.message || 'Failed to delete the document.');
  if (!data?.length) throw new Error('You do not have permission to delete this document.');
  await removeFile(doc.file_path);
}

// Private bucket -> files are opened through short-lived signed URLs.
// Pass `download: true` to force a save dialog with the original file name.
export async function getDocumentUrl(doc, { download = false, expiresIn = 120 } = {}) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.file_path, expiresIn, download ? { download: doc.file_name } : undefined);
  if (error || !data?.signedUrl) throw new Error('Could not open the file. It may have been removed.');
  return data.signedUrl;
}