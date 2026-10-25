---
name: add-portfolio-project
description: "Adds or updates portfolio projects directly in Neon PostgreSQL database and uploads project images to Cloudflare R2 without modifying application source code. Trigger when user wants to add a new project from a GitHub URL or add a project to portfolio."
---

# Add Portfolio Project Skill

Adds and updates Machine Learning and software projects in the portfolio website without modifying frontend source code or git history. All data is persisted directly to Neon PostgreSQL, and media assets are re-hosted to Cloudflare R2 object storage.

---

## Core Guardrails

1. **Direct Data Sync & Clean Git Tree**:
   - Write directly to Neon PostgreSQL (`projects` table) and Cloudflare R2 via `scripts/add_project.mjs`.
   - Do NOT edit application source code or commit files; `git status` must remain completely clean.
2. **R2 CDN Policy & Image Aspect Ratio**:
   - Never store `raw.githubusercontent.com` URLs in the database (the script automatically re-hosts remote assets to Cloudflare R2 to prevent CORS/hotlinking failures).
   - Frontend cards (`src/components/Sections/Projects.js`) render images in an `md:w-5/12 min-h-[380px]` container with `object-cover`.
   - Optimal aspect ratio is **5:4** or **4:3** (e.g., `800x640` or `1000x800`) with $\ge 45\text{px}$ safe margin from borders. Avoid ultra-wide 16:9 or 3:1 banners to prevent severe horizontal cropping.

---

## Natural 3-Stage Workflow

### 1. 探索與擬稿 (Inspect & Draft)
- Inspect the target GitHub repository (README, topics, commit/release dates, benchmarks, and visual assets).
- Draft project fields adhering to [references/database_schema.md](references/database_schema.md).
- Omit legacy/obvious defaults (`visual_type` is deprecated and defaults to `'image'`; `is_confidential: false` and `repo_visibility: 'public'` only need mention if private/NDA).

### 2. 關鍵決策對焦 (Align & Confirm before Mutation)
- Because uploading to R2 and inserting into Neon DB are mutating operations, always pause to align with the user in **Traditional Chinese** before running the non-dry-run script.
- Present a concise draft summary (`title`, `description`, `tags`, `metrics`, `date_start` ~ `date_end`, `tier`, `sort_order`, `image_url`).
- **Proactively highlight key decision points and trade-offs with recommended options**:
  - **Image Framing/Cropping**: If the repo lacks a 5:4 or 4:3 figure, suggest which asset to use or how to crop/frame with safe margin.
  - **Metrics Selection**: Feature 3–4 high-impact quantifiable benchmarks (latency, throughput, accuracy, speedup).
  - **Tier & Ordering**: Recommend whether `tier` should be `'featured'`, `'standard'`, or `'archive'`, and explain `sort_order` (specifying `--sort-order=N` where $N \ge 0$ shifts existing projects $\ge N$ to insert contiguously at rank $N$).

### 3. 執行與驗證 (Execute & Verify)
- Once the user confirms, run `node .agent/skills/add-portfolio-project/scripts/add_project.mjs` (via CLI flags or a temporary JSON file).
- Inspect database state before or after insertion using `--list` (or `--list --json`).
- Remove any temporary JSON file after execution and verify `git status` is clean.
- Verify public image accessibility on R2 CDN and verify database record insertion.

---

## Execution Examples

### Method A: Listing Projects
```bash
# Display formatted table of all database projects
node .agent/skills/add-portfolio-project/scripts/add_project.mjs --list

# Output projects as JSON array
node .agent/skills/add-portfolio-project/scripts/add_project.mjs --list --json
```

### Method B: CLI Direct Execution (with Arbitrary Sort-Order Shifting)
```bash
# Insert project at rank 1 (automatically shifts existing items at sort_order >= 1 by +1)
node .agent/skills/add-portfolio-project/scripts/add_project.mjs \
  --title="Low-Latency Vision-Language Transformer" \
  --description="High-throughput inference pipeline integrating TensorRT-LLM and FlashAttention-2." \
  --link="https://github.com/hengweibin/vlm-inference" \
  --image-url="https://github.com/hengweibin/vlm-inference/raw/main/assets/arch.png" \
  --tier="featured" \
  --sort-order=1 \
  --tags="TensorRT,PyTorch,CUDA,FlashAttention" \
  --metrics='{"Latency":"14.2ms","Throughput":"185 tok/s","Speedup":"2.8x"}' \
  --date-start="2024-03" \
  --date-end="PRESENT"
```

### Method C: JSON File Execution & Dry-Run
```bash
# Execute using a JSON definition file
node .agent/skills/add-portfolio-project/scripts/add_project.mjs project.json

# Dry-run validation (no DB or R2 mutation)
node .agent/skills/add-portfolio-project/scripts/add_project.mjs --title="Preview" --tier="archive" --dry-run

# Update existing project in-place
node .agent/skills/add-portfolio-project/scripts/add_project.mjs --id=12 --tier="featured" --sort-order=0
```

---

## Environment Variables

| Variable | Description | Source |
|---|---|---|
| `NETLIFY_DATABASE_URL` / `REACT_APP_DATABASE_URL` | Neon PostgreSQL connection string (`postgres://...`) | `.env` / Neon Console |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 S3 Access Key ID | `.env` / Cloudflare Dashboard |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 S3 Secret Access Key | `.env` / Cloudflare Dashboard |
| `R2_BUCKET_NAME` | Cloudflare R2 bucket name | `.env` / Cloudflare Dashboard |
| `R2_ENDPOINT_URL` | S3 endpoint URL (`https://<account_id>.r2.cloudflarestorage.com`) | `.env` / Cloudflare Dashboard |
| `R2_PUBLIC_BASE_URL` | Public CDN base URL (`https://pub-<id>.r2.dev`) | `.env` / Cloudflare Dashboard |
