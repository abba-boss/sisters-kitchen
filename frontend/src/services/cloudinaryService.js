/**
 * Direct unsigned upload from browser to Cloudinary.
 * Uses the upload preset — no API secret needed client-side.
 */

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   || 'djlnfnqrz';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'sisters_kitchen';
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Upload a single File object to Cloudinary.
 * Returns the secure_url string.
 */
export const uploadImage = async (file, folder = 'sisters-kitchen') => {
  const fd = new FormData();
  fd.append('file',           file);
  fd.append('upload_preset',  UPLOAD_PRESET);
  fd.append('folder',         folder);

  const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
};

/**
 * Upload multiple files concurrently.
 * Returns array of secure_url strings.
 */
export const uploadImages = async (files, folder = 'sisters-kitchen', onProgress) => {
  const total   = files.length;
  let   done    = 0;
  const urls    = [];

  for (const file of files) {
    const url = await uploadImage(file, folder);
    urls.push(url);
    done++;
    if (onProgress) onProgress(Math.round((done / total) * 100));
  }

  return urls;
};
