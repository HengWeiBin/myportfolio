/**
 * Netlify Function: Delete Object from R2 Storage
 * 
 * Accepts a key (object path) and deletes it from Cloudflare R2.
 * 
 * Environment Variables Required:
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME
 *   R2_ENDPOINT_URL
 *   ADMIN_API_KEY
 */

const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const adminKey = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  const { key } = body;

  if (!key) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required field: key' })
    };
  }

  // Validate key format (should be table/uuid_filename)
  const keyPattern = /^(projects|certificates)\/[a-f0-9-]+_[a-z0-9.-]+$/;
  if (!keyPattern.test(key)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid key format' })
    };
  }

  try {
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT_URL,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, deletedKey: key })
    };

  } catch (err) {
    console.error('Error deleting object from R2:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete object from storage' })
    };
  }
};
