#!/usr/bin/env node

/**
 * edit_project.mjs
 * 
 * Specialized automation script to inspect, edit, reorder, and delete projects
 * directly in the Neon PostgreSQL database, with optional Cloudflare R2 image
 * upload and old asset cleanup.
 * 
 * Usage:
 *   node edit_project.mjs --list [--tier=<tier>] [--json]
 *   node edit_project.mjs --get <id> [--json]
 *   node edit_project.mjs --id <id> [options] [--dry-run]
 *   node edit_project.mjs --delete <id> [--cleanup-old-image] [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { neon } from '@netlify/neon';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

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
edit_project.mjs - Automated Portfolio Project Editor

Usage:
  node edit_project.mjs --list [--tier=<tier>] [--json]
  node edit_project.mjs --get <id> [--json]
  node edit_project.mjs --id <id> [field options] [--cleanup-old-image] [--dry-run]
  node edit_project.mjs --delete <id> [--cleanup-old-image] [--dry-run]

Query & Inspection:
  --list                        List projects in formatted table (or JSON)
  --tier <featured|standard|archive> Filter by tier when using --list
  --get <id>                    Fetch and display single project's complete record
  --json                        Format output as JSON (used with --list or --get)

Edit Operations (--id <id>):
  --title <string>              Update project title
  --description <string>        Update project markdown description
  --link <url>                  Update repository or demo link
  --image-url, --image <string> Upload new image and replace current image
  --tier <featured|standard|archive> Update tier
  --sort-order <number>         Reorder project contiguously (0 = top rank)
  --tags <list>                 Replace tags completely (comma-separated or multiple flags)
  --add-tags <list>             Append tags to existing tag list
  --remove-tags <list>          Remove tags from existing tag list
  --metrics <json|string>       Replace metrics with JSON string or key=val,key2=val2
  --date-start <YYYY-MM>        Update start date
  --date-end <YYYY-MM|PRESENT>  Update end date
  --is-confidential <bool>      Update confidential flag (true|false)
  --repo-visibility <visibility>Update visibility (public|private)
  --cleanup-old-image           Delete previous R2 image when replacing image
  --dry-run                     Preview operations without database or R2 mutation

Delete Operation:
  --delete <id>                 Delete project and contiguously reorder remaining projects
  --cleanup-old-image           Also delete project image from Cloudflare R2
  --help, -h                    Show this help message
`);
}

function parseCliArgs(args) {
  const options = {
    addTags: [],
    removeTags: []
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      return options;
    }

    if (arg === '--list') {
      options.list = true;
      continue;
    }

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--cleanup-old-image') {
      options.cleanupOldImage = true;
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
        if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          val = args[++i];
        } else {
          val = true;
        }
      }

      const camelKey = key.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());

      if (camelKey === 'tags') {
        if (!options.tags) options.tags = [];
        if (typeof val === 'string') {
          options.tags.push(...val.split(',').map(t => t.trim()).filter(Boolean));
        }
      } else if (camelKey === 'addTags') {
        if (typeof val === 'string') {
          options.addTags.push(...val.split(',').map(t => t.trim()).filter(Boolean));
        }
      } else if (camelKey === 'removeTags') {
        if (typeof val === 'string') {
          options.removeTags.push(...val.split(',').map(t => t.trim()).filter(Boolean));
        }
      } else if (camelKey === 'metrics') {
        options.metricsRaw = val;
      } else {
        options[camelKey] = val;
      }
    }
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

function extractR2Key(imageUrl, publicBaseUrl = '') {
  if (!imageUrl) return null;
  const cleanBase = (publicBaseUrl || '').replace(/\/+$/, '');
  if (cleanBase && imageUrl.startsWith(cleanBase)) {
    return imageUrl.slice(cleanBase.length).replace(/^\/+/, '');
  }
  const match = imageUrl.match(/(?:projects|certificates)\/[^/?#]+/);
  return match ? match[0] : null;
}

function updateTags(existingTags, { tags, addTags, removeTags } = {}) {
  let result = [];
  if (Array.isArray(tags)) {
    result = [...tags];
  } else if (Array.isArray(existingTags)) {
    result = [...existingTags];
  } else if (typeof existingTags === 'string') {
    result = existingTags.split(',').map(t => t.trim()).filter(Boolean);
  }

  if (Array.isArray(addTags) && addTags.length > 0) {
    result.push(...addTags);
  }

  if (Array.isArray(removeTags) && removeTags.length > 0) {
    const removeSet = new Set(removeTags.map(t => t.toLowerCase()));
    result = result.filter(t => !removeSet.has(t.toLowerCase()));
  }

  return Array.from(new Set(result.map(t => t.trim()).filter(Boolean)));
}

function computeContiguousReorder(projects, targetId, newSortOrder) {
  const sorted = [...projects].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return b.id - a.id;
  });

  const numericTargetId = Number(targetId);
  const targetIndex = sorted.findIndex(p => Number(p.id) === numericTargetId);

  if (targetIndex === -1) {
    throw new Error(`Project with ID ${targetId} not found in project list.`);
  }

  const [item] = sorted.splice(targetIndex, 1);
  const clampedSortOrder = Math.max(0, Math.min(Number(newSortOrder), sorted.length));
  sorted.splice(clampedSortOrder, 0, item);

  const changedRows = [];
  const reordered = sorted.map((p, index) => {
    const oldOrder = Number(p.sort_order);
    if (oldOrder !== index) {
      changedRows.push({
        id: Number(p.id),
        oldSortOrder: oldOrder,
        newSortOrder: index,
        title: p.title
      });
    }
    return {
      ...p,
      sort_order: index
    };
  });

  return {
    reordered,
    changedRows
  };
}

function reorderAfterDelete(projects, deletedId) {
  const numericDeletedId = Number(deletedId);
  const remaining = projects
    .filter(p => Number(p.id) !== numericDeletedId)
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return b.id - a.id;
    });

  const changedRows = [];
  const reordered = remaining.map((p, index) => {
    const oldOrder = Number(p.sort_order);
    if (oldOrder !== index) {
      changedRows.push({
        id: Number(p.id),
        oldSortOrder: oldOrder,
        newSortOrder: index,
        title: p.title
      });
    }
    return {
      ...p,
      sort_order: index
    };
  });

  return {
    reordered,
    changedRows
  };
}

function parseMetrics(metricsInput, rawMetrics) {
  if (rawMetrics) {
    if (typeof rawMetrics === 'object') return rawMetrics;
    try {
      return JSON.parse(rawMetrics);
    } catch {
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

async function uploadImageToR2(imageSource, dryRun = false) {
  if (!imageSource) return null;

  const publicBase = (R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  if (publicBase && imageSource.startsWith(publicBase)) {
    console.log(`[R2] Image already hosted on R2 CDN: ${imageSource}`);
    return imageSource;
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

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT_URL || !publicBase) {
    throw new Error('Missing Cloudflare R2 credentials in environment.');
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT_URL,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  console.log(`[R2] Uploading to bucket "${R2_BUCKET_NAME}" key "${r2Key}"...`);
  await s3Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: r2Key,
    Body: buffer,
    ContentType: mimeType,
  }));
  console.log(`[R2] Successfully uploaded to: ${finalPublicUrl}`);

  return finalPublicUrl;
}

async function deleteR2Object(key, dryRun = false) {
  if (!key) return;

  if (dryRun) {
    console.log(`[R2 DRY RUN] Would delete object from R2: key="${key}"`);
    return;
  }

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT_URL) {
    console.warn('[R2 Warning] Missing credentials to delete R2 object.');
    return;
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT_URL,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  console.log(`[R2] Deleting object key "${key}" from bucket "${R2_BUCKET_NAME}"...`);
  await s3Client.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }));
  console.log(`[R2] Object "${key}" successfully deleted.`);
}

async function main() {
  const cliArgs = process.argv.slice(2);
  const options = parseCliArgs(cliArgs);

  if (options.help || cliArgs.length === 0) {
    printHelp();
    process.exit(0);
  }

  if (!DATABASE_URL) {
    console.error('[Database Error] Missing database connection string. Please define NETLIFY_DATABASE_URL or REACT_APP_DATABASE_URL in .env.');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);

  // Mode 1: List projects (--list)
  if (options.list) {
    try {
      let filterTier = options.tier ? options.tier.toLowerCase() : null;
      if (filterTier === 'archived' || filterTier === 'foundation') filterTier = 'archive';

      let projects;
      if (filterTier) {
        projects = await sql`
          SELECT id, sort_order, tier, title, repo_visibility, is_confidential 
          FROM projects 
          WHERE tier = ${filterTier}
          ORDER BY sort_order ASC, id DESC
        `;
      } else {
        projects = await sql`
          SELECT id, sort_order, tier, title, repo_visibility, is_confidential 
          FROM projects 
          ORDER BY sort_order ASC, id DESC
        `;
      }

      if (options.json) {
        console.log(JSON.stringify(projects, null, 2));
      } else {
        console.log(`\nFound ${projects.length} project(s)${filterTier ? ` for tier "${filterTier}"` : ''}:\n`);
        const formatted = projects.map(p => ({
          'ID': p.id,
          'Sort Order': p.sort_order,
          'Tier': p.tier,
          'Title': p.title,
          'Visibility': p.repo_visibility || 'public',
          'Confidential': p.is_confidential ? 'Yes' : 'No'
        }));
        console.table(formatted);
      }
      process.exit(0);
    } catch (listErr) {
      console.error(`[Database Error] Failed to list projects: ${listErr.message}`);
      process.exit(1);
    }
  }

  // Mode 2: Get single project details (--get <id>)
  if (options.get !== undefined) {
    const targetId = Number(options.get);
    if (!targetId) {
      console.error('[Validation Error] Please specify a valid numeric ID for --get.');
      process.exit(1);
    }

    try {
      const rows = await sql`SELECT * FROM projects WHERE id = ${targetId}`;
      if (rows.length === 0) {
        console.error(`[Database Error] Project with ID ${targetId} not found.`);
        process.exit(1);
      }

      const p = rows[0];
      if (options.json) {
        console.log(JSON.stringify(p, null, 2));
      } else {
        console.log(`\n=== Project Details [ID: ${p.id}] ===`);
        console.log(`Title:          ${p.title}`);
        console.log(`Tier:           ${p.tier}`);
        console.log(`Sort Order:     ${p.sort_order}`);
        console.log(`Visibility:     ${p.repo_visibility}`);
        console.log(`Confidential:   ${p.is_confidential}`);
        console.log(`Dates:          ${p.date_start || '(none)'} ~ ${p.date_end || '(none)'}`);
        console.log(`Link:           ${p.link || '(none)'}`);
        console.log(`Image URL:      ${p.image_url || '(none)'}`);
        console.log(`Tags:           [${(p.tags || []).join(', ')}]`);
        console.log(`Metrics:        ${JSON.stringify(p.metrics || {})}`);
        console.log(`Description:\n${p.description || '(none)'}`);
        console.log('====================================\n');
      }
      process.exit(0);
    } catch (getErr) {
      console.error(`[Database Error] Failed to get project: ${getErr.message}`);
      process.exit(1);
    }
  }

  // Mode 3: Delete project (--delete <id>)
  if (options.delete !== undefined) {
    const deleteId = Number(options.delete);
    if (!deleteId) {
      console.error('[Validation Error] Please specify a valid numeric ID for --delete.');
      process.exit(1);
    }

    try {
      const rows = await sql`SELECT * FROM projects WHERE id = ${deleteId}`;
      if (rows.length === 0) {
        console.error(`[Database Error] Project with ID ${deleteId} not found.`);
        process.exit(1);
      }

      const projectToDelete = rows[0];
      console.log(`\n[Action] Deleting Project ID ${deleteId}: "${projectToDelete.title}"`);

      // Cleanup image if requested
      if (options.cleanupOldImage && projectToDelete.image_url) {
        const oldKey = extractR2Key(projectToDelete.image_url, R2_PUBLIC_BASE_URL);
        if (oldKey) {
          console.log(`[R2] Cleaning up image asset for deleted project (key="${oldKey}")...`);
          await deleteR2Object(oldKey, options.dryRun);
        }
      }

      // Query all projects for re-normalizing sort order
      const allProjects = await sql`SELECT id, sort_order, title FROM projects ORDER BY sort_order ASC, id DESC`;
      const { changedRows } = reorderAfterDelete(allProjects, deleteId);

      if (options.dryRun) {
        console.log(`[DRY RUN] Would delete project ID ${deleteId}`);
        console.log(`[DRY RUN] Would update sort_order for ${changedRows.length} remaining project(s):`);
        for (const cr of changedRows) {
          console.log(`  ID ${cr.id} ("${cr.title}"): ${cr.oldSortOrder} -> ${cr.newSortOrder}`);
        }
        process.exit(0);
      }

      await sql`DELETE FROM projects WHERE id = ${deleteId}`;
      console.log(`[Database] Project ${deleteId} deleted.`);

      if (changedRows.length > 0) {
        console.log(`[Database] Normalizing sort_order for ${changedRows.length} remaining project(s)...`);
        for (const cr of changedRows) {
          await sql`UPDATE projects SET sort_order = ${cr.newSortOrder} WHERE id = ${cr.id}`;
        }
        console.log('[Database] Contiguous sort_order normalized.');
      }

      console.log(`\n=== Successfully deleted project ID ${deleteId} ===\n`);
      process.exit(0);
    } catch (delErr) {
      console.error(`[Database Error] Failed to delete project: ${delErr.message}`);
      process.exit(1);
    }
  }

  // Mode 4: Update project (--id <id>)
  if (options.id !== undefined) {
    const targetId = Number(options.id);
    if (!targetId) {
      console.error('[Validation Error] Please specify a valid numeric ID for --id.');
      process.exit(1);
    }

    try {
      const rows = await sql`SELECT * FROM projects WHERE id = ${targetId}`;
      if (rows.length === 0) {
        console.error(`[Database Error] Project with ID ${targetId} not found.`);
        process.exit(1);
      }

      const existing = rows[0];

      // Prepare partial field updates
      const title = options.title !== undefined ? options.title : existing.title;
      const description = options.description !== undefined ? options.description : existing.description;
      const link = options.link !== undefined ? options.link : existing.link;
      const dateStart = options.dateStart !== undefined ? options.dateStart : existing.date_start;
      const dateEnd = options.dateEnd !== undefined ? options.dateEnd : existing.date_end;

      let tier = existing.tier;
      if (options.tier) {
        tier = options.tier.toLowerCase();
        if (tier === 'archived' || tier === 'foundation') tier = 'archive';
        if (!['featured', 'standard', 'archive'].includes(tier)) {
          console.error(`[Validation Error] Invalid tier: "${tier}". Allowed: 'featured', 'standard', 'archive'.`);
          process.exit(1);
        }
      }

      const visualType = options.visualType !== undefined ? options.visualType : (existing.visual_type || 'image');
      const isConfidential = options.isConfidential !== undefined ? 
        (options.isConfidential === true || options.isConfidential === 'true') : 
        Boolean(existing.is_confidential);
      const repoVisibility = options.repoVisibility !== undefined ? options.repoVisibility : existing.repo_visibility;

      // Tag resolution
      const tags = updateTags(existing.tags, {
        tags: options.tags,
        addTags: options.addTags,
        removeTags: options.removeTags
      });

      // Metrics resolution
      let metrics = existing.metrics || {};
      if (options.metricsRaw !== undefined) {
        metrics = parseMetrics({}, options.metricsRaw);
      }
      const serializedMetrics = JSON.stringify(metrics);

      // Image handling & optional cleanup
      let imageUrl = existing.image_url;
      const rawImage = options.imageUrl || options.image;
      if (rawImage) {
        imageUrl = await uploadImageToR2(rawImage, options.dryRun);

        if (options.cleanupOldImage && existing.image_url && existing.image_url !== imageUrl) {
          const oldKey = extractR2Key(existing.image_url, R2_PUBLIC_BASE_URL);
          if (oldKey) {
            console.log(`[R2] Cleaning up previous image asset (key="${oldKey}")...`);
            await deleteR2Object(oldKey, options.dryRun);
          }
        }
      }

      // Reordering check
      let reorderChanges = [];
      let finalSortOrder = existing.sort_order;
      if (options.sortOrder !== undefined) {
        const newSortOrder = Number(options.sortOrder);
        const allProjects = await sql`SELECT id, sort_order, title FROM projects ORDER BY sort_order ASC, id DESC`;
        const reorderResult = computeContiguousReorder(allProjects, targetId, newSortOrder);
        reorderChanges = reorderResult.changedRows;
        finalSortOrder = newSortOrder;
      }

      console.log('\n--- Update Summary ---');
      console.log(`Project ID:     ${targetId}`);
      console.log(`Title:          ${title}`);
      console.log(`Tier:           ${tier}`);
      console.log(`Sort Order:     ${finalSortOrder}`);
      console.log(`Tags:           [${tags.join(', ')}]`);
      console.log(`Metrics:        ${serializedMetrics}`);
      console.log(`Image URL:      ${imageUrl || '(none)'}`);
      if (reorderChanges.length > 0) {
        console.log(`Contiguous Reorder: ${reorderChanges.length} item(s) will change sort_order`);
        for (const rc of reorderChanges) {
          console.log(`  ID ${rc.id} ("${rc.title}"): ${rc.oldSortOrder} -> ${rc.newSortOrder}`);
        }
      }
      console.log('----------------------\n');

      if (options.dryRun) {
        console.log('[DRY RUN COMPLETED] Database updates skipped.');
        process.exit(0);
      }

      // Execute primary row update
      const updateResult = await sql`
        UPDATE projects 
        SET title = ${title},
            description = ${description},
            link = ${link},
            date_start = ${dateStart},
            date_end = ${dateEnd},
            image_url = ${imageUrl},
            tags = ${tags},
            tier = ${tier},
            sort_order = ${finalSortOrder},
            visual_type = ${visualType},
            is_confidential = ${isConfidential},
            repo_visibility = ${repoVisibility},
            metrics = ${serializedMetrics}
        WHERE id = ${targetId}
        RETURNING *
      `;

      // Execute cascading sort_order shifts if any other rows shifted
      for (const rc of reorderChanges) {
        if (rc.id !== targetId) {
          await sql`UPDATE projects SET sort_order = ${rc.newSortOrder} WHERE id = ${rc.id}`;
        }
      }

      const updatedRow = updateResult[0];
      console.log('\n=== Success! Project Updated in Database ===');
      console.log(JSON.stringify(updatedRow, null, 2));
      console.log('============================================\n');
      process.exit(0);
    } catch (updateErr) {
      console.error(`[Database Error] Update failed: ${updateErr.message}`);
      process.exit(1);
    }
  }

  printHelp();
  process.exit(0);
}

export {
  parseCliArgs,
  sanitizeFilename,
  inferMimeAndExt,
  extractR2Key,
  updateTags,
  computeContiguousReorder,
  reorderAfterDelete,
  parseMetrics,
  uploadImageToR2,
  deleteR2Object,
  main
};

const isDirectRun = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) ||
  process.argv[1].endsWith('edit_project.mjs')
);

if (isDirectRun) {
  main().catch((err) => {
    console.error(`[Fatal Error] ${err.stack || err.message}`);
    process.exit(1);
  });
}
