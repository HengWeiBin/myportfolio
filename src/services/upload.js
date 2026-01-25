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

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
