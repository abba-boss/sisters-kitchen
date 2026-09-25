/**
 * Image uploads for vendors.
 *
 * Preferred path is a direct unsigned Cloudinary upload from the browser.
 * When the preset is not configured, the request falls back to the
 * authenticated API upload endpoint so the product still works.
 *
 * There is deliberately no hard-coded fallback cloud/preset: a missing env var
 * must never silently upload into a third party's Cloudinary account.
 */
import api from './api';

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const hasDirectUpload = Boolean(CLOUD_NAME && UPLOAD_PRESET);

const uploadDirect = async (file, folder) => {
  const fd = new FormData();
  fd.append('file',          file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder',        folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
};

const uploadViaApi = async (file, folder) => {
  const fd = new FormData();
  fd.append('file',   file);
  fd.append('folder', folder);
  const { data } = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data.data.url;
};

/**
 * Upload a single File object.
 * Returns the stored URL string.
 */
export const uploadImage = async (file, folder = 'sisters-kitchen') => {
  if (hasDirectUpload) {
    try {
      return await uploadDirect(file, folder);
    } catch (err) {
      console.warn('Direct Cloudinary upload failed, falling back to the API upload.', err);
    }
  }
  return uploadViaApi(file, folder);
};

/**
 * Upload multiple files.
 * Returns an array of stored URL strings.
 */
export const uploadImages = async (files, folder = 'sisters-kitchen', onProgress) => {
  const total = files.length;
  const urls  = [];

  for (const file of files) {
    urls.push(await uploadImage(file, folder));
    onProgress?.(Math.round((urls.length / total) * 100));
  }

  return urls;
};
