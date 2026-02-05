const ADMIN_API_KEY = process.env.REACT_APP_ADMIN_API_KEY;

export const uploadImageToR2 = async (file, table) => {
  if (!file) {
    throw new Error('No file provided');
  }

  if (!['projects', 'certificates'].includes(table)) {
    throw new Error('Invalid table name');
  }

  const response = await fetch('/.netlify/functions/get-upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_API_KEY || localStorage.getItem('admin_api_key') || ''
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      table
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get upload URL');
  }

  const { uploadUrl, publicUrl } = await response.json();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image to R2');
  }

  return publicUrl;
};

export const deleteImageFromR2 = async (imageUrl) => {
  if (!imageUrl) return;

  const publicBaseUrl = process.env.REACT_APP_R2_PUBLIC_BASE_URL || '';
  if (!publicBaseUrl || !imageUrl.startsWith(publicBaseUrl)) {
    console.warn('Cannot delete: URL does not match R2 public base URL');
    return;
  }

  const key = imageUrl.replace(publicBaseUrl + '/', '');
  if (!key) return;

  const response = await fetch('/.netlify/functions/delete-storage-object', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_API_KEY || localStorage.getItem('admin_api_key') || ''
    },
    body: JSON.stringify({ key })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete image from R2');
  }

  return await response.json();
};

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
