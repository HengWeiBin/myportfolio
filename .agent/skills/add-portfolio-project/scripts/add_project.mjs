#!/usr/bin/env node

/**
 * add_project.mjs
 * 
 * Specialized automation script to add or update projects directly in the
 * Neon PostgreSQL database and upload project images to Cloudflare R2
 * without touching git source code.
 * 
 * Usage:
 *   node add_project.mjs <project.json>
 *   node add_project.mjs --file=project.json
 *   node add_project.mjs --title="Project Name" --description="..." --image-url="..." --tags="PyTorch,CUDA"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { neon } from '@netlify/neon';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate and load .env from multiple potential directory roots
const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
  path.resolve(__dirname, '..', '..', '..', '.env'),
  path.resolve(__dirname, '..', '..', '..', '..', '.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// Environment variables configuration
const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || 
                     process.env.REACT_APP_DATABASE_URL || 
                     process.env.DATABASE_URL;

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT_URL = process.env.R2_ENDPOINT_URL;
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL || 
                           process.env.REACT_APP_R2_PUBLIC_BASE_URL;

// MIME type map for standard web graphics
const MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function printHelp() {
  console.log(`
add_project.mjs - Automated Portfolio Project Sync

Usage:
  node add_project.mjs [path-to-project.json] [options]

Arguments & Options:
  --file, -f <path>             Path to JSON file containing project definition
  --title <string>              Project title (Required)
  --description <string>        Detailed summary / markdown description
  --link <url>                  Project repository or live demo URL
  --image-url, --image <string> Image source (local path, web URL, or GitHub raw link)
  --tier <featured|standard>    Project tier (default: standard)
  --sort-order <number>         Sort weight (0 for flagship, shifts existing items)
  --tags <list>                 Comma-separated tags or multiple flags (e.g. PyTorch,CUDA)
  --metrics <json|string>       JSON string or key=val,key2=val2 benchmark metrics
  --visual-type <type>          image | ResultViz | NeuralArch | CodeBlock (default: image)
  --date-start <YYYY-MM>        Project start date
  --date-end <YYYY-MM|PRESENT>  Project end date
  --is-confidential <bool>      Proprietary/NDA project flag (true|false, default: false)
  --repo-visibility <visibility>public | private (default: public)
  --id <number>                 Existing project ID (performs UPDATE instead of INSERT)
  --dry-run                     Preview operations without writing to DB or R2
  --help, -h                    Show this help message

Environment Variables:
  NETLIFY_DATABASE_URL / REACT_APP_DATABASE_URL
  R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT_URL, R2_PUBLIC_BASE_URL
`);
}

function parseCliArgs(args) {
  const options = {
    tags: [],
    metrics: {}
  };
  let positionalFile = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      return options;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith('--file=') || arg.startsWith('-f=')) {
      options.file = arg.split('=')[1];
      continue;
    }

    if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
      continue;
    }

    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      let key;
      let val;

      if (eqIdx !== -1) {
        key = arg.slice(2, eqIdx);
        val = arg.slice(eqIdx + 1);
      } else {
        key = arg.slice(2);
        // Check if next argument is a value or another flag
        if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          val = args[++i];
        } else {
          val = true;
        }
      }

      // Normalize key (kebab-case to camelCase)
      const camelKey = key.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());

      if (camelKey === 'tags') {
        if (typeof val === 'string') {
          options.tags.push(...val.split(',').map(t => t.trim()).filter(Boolean));
        }
      } else if (camelKey === 'metrics') {
        options.metricsRaw = val;
      } else {
        options[camelKey] = val;
      }
      continue;
    }

    if (!positionalFile && (arg.endsWith('.json') || fs.existsSync(arg))) {
      positionalFile = arg;
    }
  }

  if (positionalFile && !options.file) {
    options.file = positionalFile;
  }

  return options;
}

function sanitizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function inferMimeAndExt(filenameOrUrl, headerMime = '') {
  let ext = '';
  try {
    const cleanPath = filenameOrUrl.split('?')[0].split('#')[0];
    ext = path.extname(cleanPath).toLowerCase();
  } catch {}

  if (ext && MIME_MAP[ext]) {
    return { ext, mime: MIME_MAP[ext] };
  }

  if (headerMime) {
    const cleanMime = headerMime.split(';')[0].trim().toLowerCase();
    for (const [keyExt, valMime] of Object.entries(MIME_MAP)) {
      if (valMime === cleanMime) {
        return { ext: keyExt, mime: cleanMime };
      }
    }
  }

  return { ext: '.jpg', mime: 'image/jpeg' };
}

async function uploadImageToR2(imageSource, dryRun = false) {
  if (!imageSource) return null;

  const publicBase = (R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '');

  // Check if image is already hosted on the configured Cloudflare R2 bucket CDN
  if (publicBase && imageSource.startsWith(publicBase)) {
    console.log(`[R2] Image already hosted on R2 CDN: ${imageSource}`);
    return imageSource;
  }

  if (imageSource.includes('raw.githubusercontent.com')) {
    console.log('[R2] Warning: Detected raw.githubusercontent.com source. Re-hosting to Cloudflare R2 to prevent browser CORS/anti-hotlinking failures.');
  }

  let buffer;
  let sourceBasename = 'image';
  let mimeType = 'image/jpeg';
  let extension = '.jpg';

  if (dryRun) {
    const rawBasename = path.basename(imageSource.split('?')[0], path.extname(imageSource.split('?')[0])) || 'project';
    sourceBasename = sanitizeFilename(rawBasename);
    const detected = inferMimeAndExt(imageSource);
    const mockKey = `projects/${sourceBasename}_${Date.now()}${detected.ext}`;
    const mockPublicUrl = `${publicBase}/${mockKey}`;
    console.log(`[R2 DRY RUN] Would process image from: ${imageSource}`);
    console.log(`[R2 DRY RUN] Target key: ${mockKey}`);
    console.log(`[R2 DRY RUN] Target public URL: ${mockPublicUrl}`);
    return mockPublicUrl;
  }

  if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
    console.log(`[R2] Fetching remote image: ${imageSource}`);
    const fetchRes = await fetch(imageSource, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!fetchRes.ok) {
      throw new Error(`Failed to download image from ${imageSource} (Status ${fetchRes.status}: ${fetchRes.statusText})`);
    }

    const arrayBuffer = await fetchRes.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);

    const urlPathname = new URL(imageSource).pathname;
    const rawBasename = path.basename(urlPathname, path.extname(urlPathname)) || 'project';
    sourceBasename = sanitizeFilename(rawBasename);

    const detected = inferMimeAndExt(urlPathname, fetchRes.headers.get('content-type'));
    extension = detected.ext;
    mimeType = detected.mime;
  } else {
    // Local filesystem path
    const resolvedPath = path.resolve(process.cwd(), imageSource);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Local image file does not exist: ${resolvedPath}`);
    }

    console.log(`[R2] Reading local file: ${resolvedPath}`);
    buffer = fs.readFileSync(resolvedPath);

    const rawBasename = path.basename(resolvedPath, path.extname(resolvedPath)) || 'project';
    sourceBasename = sanitizeFilename(rawBasename);

    const detected = inferMimeAndExt(resolvedPath);
    extension = detected.ext;
    mimeType = detected.mime;
  }

  const timestamp = Date.now();
  const r2Key = `projects/${sourceBasename}_${timestamp}${extension}`;
  const finalPublicUrl = `${publicBase}/${r2Key}`;

  console.log(`[R2] Prepared object: key="${r2Key}", size=${buffer.length} bytes, mime="${mimeType}"`);

  if (dryRun) {
    console.log(`[R2 DRY RUN] Would upload to ${R2_BUCKET_NAME}/${r2Key}`);
    console.log(`[R2 DRY RUN] Target public URL: ${finalPublicUrl}`);
    return finalPublicUrl;
  }

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT_URL || !publicBase) {
    throw new Error('Missing Cloudflare R2 credentials in environment! Please ensure R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT_URL, and R2_PUBLIC_BASE_URL are defined.');
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT_URL,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  console.log(`[R2] Uploading to bucket "${R2_BUCKET_NAME}"...`);
  await s3Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: r2Key,
    Body: buffer,
    ContentType: mimeType,
  }));
  console.log(`[R2] Successfully uploaded to: ${finalPublicUrl}`);

  // Verification step: verify URL availability
  console.log(`[R2] Verifying public CDN availability...`);
  try {
    let headRes = await fetch(finalPublicUrl, { method: 'HEAD' });
    if (!headRes.ok && headRes.status === 405) {
      // Fallback for CDNs where HEAD is not allowed
      headRes = await fetch(finalPublicUrl, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' }
      });
    }

    if (headRes.ok) {
      console.log(`[R2 Verification] HTTP status ${headRes.status} OK. Object verified.`);
    } else {
      console.warn(`[R2 Verification] Warning: Verification returned HTTP ${headRes.status}. CDN propagation may take a few seconds.`);
    }
  } catch (verifyErr) {
    console.warn(`[R2 Verification] Non-fatal check warning: ${verifyErr.message}`);
  }

  return finalPublicUrl;
}

function parseMetrics(metricsInput, rawMetrics) {
  if (rawMetrics) {
    if (typeof rawMetrics === 'object') return rawMetrics;
    try {
      return JSON.parse(rawMetrics);
    } catch {
      // Attempt key=value,key2=value2 parsing
      const parsed = {};
      const pairs = rawMetrics.split(',');
      for (const pair of pairs) {
        const [k, ...vParts] = pair.split('=');
        if (k && vParts.length) {
          parsed[k.trim()] = vParts.join('=').trim();
        }
      }
      return parsed;
    }
  }

  if (typeof metricsInput === 'object' && metricsInput !== null) {
    return metricsInput;
  }

  return {};
}

async function main() {
  const cliArgs = process.argv.slice(2);
  const options = parseCliArgs(cliArgs);

  if (options.help || (cliArgs.length === 0 && !options.file)) {
    printHelp();
    process.exit(0);
  }

  let projectData = {};

  // Load from JSON file if provided
  if (options.file) {
    const filePath = path.resolve(process.cwd(), options.file);
    if (!fs.existsSync(filePath)) {
      console.error(`[Error] File not found: ${filePath}`);
      process.exit(1);
    }
    console.log(`[Setup] Loading project configuration from: ${filePath}`);
    try {
      let rawContent = fs.readFileSync(filePath, 'utf8');
      if (rawContent.charCodeAt(0) === 0xFEFF) {
        rawContent = rawContent.slice(1);
      }
      projectData = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error(`[Error] Failed to parse JSON file: ${parseErr.message}`);
      process.exit(1);
    }
  }

  // Merge CLI overrides on top of JSON file data
  const title = options.title || projectData.title;
  const description = options.description ?? projectData.description ?? '';
  const link = options.link ?? projectData.link ?? '';
  const rawImage = options.imageUrl || options.image || projectData.image_url || projectData.image;
  const tier = (options.tier || projectData.tier || 'standard').toLowerCase();
  const sortOrder = options.sortOrder !== undefined ? Number(options.sortOrder) : 
                    (projectData.sort_order !== undefined ? Number(projectData.sort_order) : 0);
  const visualType = options.visualType || projectData.visual_type || 'image';
  const isConfidential = options.isConfidential !== undefined ? 
    (options.isConfidential === true || options.isConfidential === 'true') : 
    Boolean(projectData.is_confidential);
  const repoVisibility = options.repoVisibility || projectData.repo_visibility || 'public';
  const dateStart = options.dateStart ?? projectData.date_start ?? '';
  const dateEnd = options.dateEnd ?? projectData.date_end ?? '';
  const targetId = options.id || projectData.id || null;

  // Merge tags
  let tags = [];
  if (Array.isArray(projectData.tags)) {
    tags.push(...projectData.tags);
  } else if (typeof projectData.tags === 'string') {
    tags.push(...projectData.tags.split(',').map(t => t.trim()));
  }
  if (options.tags && options.tags.length > 0) {
    tags.push(...options.tags);
  }
  tags = Array.from(new Set(tags.filter(Boolean)));

  // Merge metrics
  const metrics = parseMetrics(projectData.metrics, options.metricsRaw);

  // Validation
  if (!title) {
    console.error('[Validation Error] Project title is required (--title or "title" in JSON).');
    process.exit(1);
  }

  if (!['featured', 'standard'].includes(tier)) {
    console.error(`[Validation Error] Invalid tier: "${tier}". Allowed values: 'featured', 'standard'.`);
    process.exit(1);
  }

  if (!['image', 'ResultViz', 'NeuralArch', 'CodeBlock'].includes(visualType)) {
    console.error(`[Validation Error] Invalid visual_type: "${visualType}". Allowed values: 'image', 'ResultViz', 'NeuralArch', 'CodeBlock'.`);
    process.exit(1);
  }

  console.log('\n--- Project Parameters ---');
  console.log(`Action:         ${targetId ? `UPDATE (id: ${targetId})` : 'INSERT (New Project)'}`);
  console.log(`Title:          ${title}`);
  console.log(`Tier:           ${tier}`);
  console.log(`Sort Order:     ${sortOrder}`);
  console.log(`Visual Type:    ${visualType}`);
  console.log(`Tags:           [${tags.join(', ')}]`);
  console.log(`Metrics:        ${JSON.stringify(metrics)}`);
  console.log(`Confidential:   ${isConfidential}`);
  console.log(`Repository:     ${repoVisibility}`);
  console.log(`Image Source:   ${rawImage || '(none)'}`);
  console.log('--------------------------\n');

  // Step 1: Upload Image to Cloudflare R2 if provided
  let uploadedImageUrl = null;
  if (rawImage) {
    uploadedImageUrl = await uploadImageToR2(rawImage, options.dryRun);
  }

  if (options.dryRun) {
    console.log('\n[DRY RUN COMPLETED] Database operations skipped.');
    process.exit(0);
  }

  // Step 2: Database Operations via Neon PostgreSQL
  if (!DATABASE_URL) {
    console.error('[Database Error] Missing database connection string. Please define NETLIFY_DATABASE_URL or REACT_APP_DATABASE_URL in .env.');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  const serializedMetrics = JSON.stringify(metrics);

  try {
    // If inserting new record with sort_order: 0, shift existing records to preserve top rank
    if (!targetId && sortOrder === 0) {
      console.log('[Database] Shifting existing project sort_order weights (sort_order = sort_order + 1 WHERE sort_order >= 0)...');
      const shiftResult = await sql`
        UPDATE projects 
        SET sort_order = sort_order + 1 
        WHERE sort_order >= 0
      `;
      console.log('[Database] Sort orders shifted successfully.');
    }

    let dbResult;

    if (targetId) {
      console.log(`[Database] Updating project id ${targetId}...`);
      dbResult = await sql`
        UPDATE projects 
        SET title = ${title},
            description = ${description},
            link = ${link},
            date_start = ${dateStart},
            date_end = ${dateEnd},
            image_url = ${uploadedImageUrl},
            tags = ${tags},
            tier = ${tier},
            sort_order = ${sortOrder},
            visual_type = ${visualType},
            is_confidential = ${isConfidential},
            repo_visibility = ${repoVisibility},
            metrics = ${serializedMetrics}
        WHERE id = ${Number(targetId)}
        RETURNING *
      `;

      if (dbResult.length === 0) {
        throw new Error(`Project with id ${targetId} not found in database.`);
      }
    } else {
      console.log('[Database] Inserting new project record...');
      dbResult = await sql`
        INSERT INTO projects (
          title, description, link, date_start, date_end,
          image_url, tags, tier, sort_order, visual_type,
          is_confidential, repo_visibility, metrics
        ) VALUES (
          ${title},
          ${description},
          ${link},
          ${dateStart},
          ${dateEnd},
          ${uploadedImageUrl},
          ${tags},
          ${tier},
          ${sortOrder},
          ${visualType},
          ${isConfidential},
          ${repoVisibility},
          ${serializedMetrics}
        )
        RETURNING *
      `;
    }

    const savedRow = dbResult[0];
    console.log('\n=== Success! Project Synced to Database ===');
    console.log(JSON.stringify(savedRow, null, 2));
    console.log('===========================================\n');
    console.log(`Project ID:     ${savedRow.id}`);
    console.log(`Title:          ${savedRow.title}`);
    console.log(`Image URL:      ${savedRow.image_url || '(none)'}`);
    console.log(`Tier:           ${savedRow.tier}`);
    console.log(`Sort Order:     ${savedRow.sort_order}`);
    console.log('\nGit repository source code remains completely unmodified.');
  } catch (dbErr) {
    console.error(`[Database Error] Operation failed: ${dbErr.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[Fatal Error] ${err.stack || err.message}`);
  process.exit(1);
});
