---
name: add-portfolio-project
description: "Adds or updates portfolio projects directly in Neon PostgreSQL database and uploads project images to Cloudflare R2 without modifying application source code. Trigger when user wants to add a new project from a GitHub URL or add a project to portfolio."
---

# Add Portfolio Project Skill

This skill provides an automated, non-invasive workflow for adding and updating Machine Learning and software projects in the portfolio website. All data is persisted directly to the Neon serverless PostgreSQL database, and media assets are synchronized to Cloudflare R2 object storage. **No application source code or Git history is modified.**

---

## Architecture & Core Directives

1. **Direct Data Layer Synchronization**:
   - Project metadata is stored in the `projects` table in Neon PostgreSQL.
   - Images and graphics are hosted on Cloudflare R2 and served via CDN.
   - Frontend components (`Projects.js`, `ProjectCard.js`, `Hero.js`) dynamically consume this data through the `/api/portfolio` serverless endpoint.
2. **Strict R2 CDN Policy (NO Raw GitHub URLs)**:
   - **CRITICAL**: Never save `raw.githubusercontent.com` or `github.com/.../raw/...` URLs directly to the database. These URLs fail in web browsers due to CORS headers, anti-hotlinking referrer policies, and token expirations.
   - All external images must be fetched and uploaded to Cloudflare R2 via the bundled script `scripts/add_project.mjs`.
3. **Clean Git Tree Mandate**:
   - Do NOT edit `.js`, `.json`, or component files to register new projects.
   - Verify `git status` remains clean after project creation.
4. **Two-Phase Execution & Mandatory Human Confirmation Gate (Strict Auto-Continue Exception)**:
   - Modifying remote database records and uploading CDN assets are mutating operations.
   - Agents executing this skill MUST operate under a strict two-phase protocol:
     - **Phase 1: Exploration, Extraction, Schema Formatting & Dry-Run Validation**.
     - **MANDATORY HUMAN CONFIRMATION GATE (STOP & ASK)**: This is a **strict, mandatory exception** to the generic auto-continue policy. The agent MUST pause, present the drafted project metadata in Traditional Chinese, and wait for human approval before mutating any state.
     - **Phase 2: Execution upon Approval** (R2 Upload, Neon DB insertion, End-to-End Verification, and Scratch Cleanup).

---

## Two-Phase Operational Workflow

```
========================================================================
 PHASE 1: DRAFTING & VALIDATION (Read-Only / No External Mutations)
========================================================================
[Step 1: Extract Repo Info & Assets from GitHub]
         │
         ▼
[Step 2: Schema Formatting & Dry-Run Validation]
         │
         ▼
========================================================================
 🛑 MANDATORY HUMAN CONFIRMATION GATE (STOP & ASK)
 Strict Auto-Continue Exception: Present Comparison Table & Await Confirmation
========================================================================
         │ (User provides explicit approval or revisions)
         ▼
========================================================================
 PHASE 2: MUTATION & VERIFICATION (Execution Upon Approval)
========================================================================
[Step 3: Image Hosting via Cloudflare R2]
         │
         ▼
[Step 4: Neon PostgreSQL Insertion (Atomic Rank Shift)]
         │
         ▼
[Step 5: End-to-End Verification & Scratch Cleanup]
```

### Phase 1: Drafting & Validation

#### Step 1: Extract Project Information from GitHub Repository
When given a GitHub repository URL (e.g., `https://github.com/hengweibin/example-project`):
1. Inspect the repository using GitHub API, `gh repo view`, or web fetching:
   - **README**: Summary, motivation, architecture diagrams, training pipeline, and evaluation results.
   - **Tags & Topics**: Tech stack keywords (e.g., PyTorch, CUDA, Docker, TensorRT).
   - **Commit / Release Dates**: Determine `date_start` (first commit/milestone) and `date_end` (latest commit or 'PRESENT').
   - **Architecture Figures & Results**: Locate visual assets (e.g., architecture SVG/PNG, loss curves, inference demos).
   - **Benchmark Metrics**: Extract quantifiable results (e.g., accuracy, mAP, latency, throughput, model parameters).

#### Step 2: Schema Formatting & Dry-Run Validation
Structure the extracted information according to the schema specifications (see [references/database_schema.md](references/database_schema.md)):

| Field | Example Value | Notes |
|---|---|---|
| `title` | `"Real-Time Multi-Object Tracking Engine"` | Descriptive, high-impact ML title |
| `description` | `"Engineered a sub-10ms tracking pipeline..."` | Technical markdown summary |
| `link` | `"https://github.com/hengweibin/mot-engine"` | Public repository or demo link |
| `date_start` | `"2024-02"` | `YYYY-MM` format |
| `date_end` | `"2024-09"` (or `"PRESENT"`) | `YYYY-MM` or `'PRESENT'` |
| `tags` | `["PyTorch", "TensorRT", "CUDA", "YOLOv8"]` | Array of strings |
| `tier` | `"featured"` or `"standard"` | Featured projects display at the top |
| `sort_order` | `0` | Rank weight (0 = top flagship project) |
| `visual_type` | `"image"`, `"ResultViz"`, `"NeuralArch"`, `"CodeBlock"` | Frontend renderer type |
| `is_confidential` | `false` | Set `true` if enterprise NDA / proprietary |
| `repo_visibility` | `"public"` or `"private"` | Code availability |
| `metrics` | `{"FPS": "120", "mAP50": "84.2%", "Latency": "8.3ms"}` | JSONB key-value benchmarks |
| `image_url` | `"https://raw.githubusercontent.com/.../demo.png"` | Source image to be imported |

Perform optional dry-run parameter validation using `scripts/add_project.mjs --dry-run` or inspecting the payload without uploading.

---

### 🛑 MANDATORY HUMAN CONFIRMATION GATE (STOP & ASK)

> [!IMPORTANT]
> **STRICT AUTO-CONTINUE EXCEPTION**: This gate overrides any generic rule to automatically proceed without asking. The agent **MUST NOT** proceed to Step 3 (R2 upload) or Step 4 (Neon DB insert) until explicit user confirmation is received.

#### Protocol:
1. **Present Extracted Metadata**: Output a clear review table in **Traditional Chinese** detailing the proposed project attributes:
   | 欄位 (Field) | 提議內容 (Proposed Value) | 說明 (Notes) |
   |---|---|---|
   | **專案名稱 (Title)** | `[Project Title]` | 專案標題 |
   | **專案描述 (Description)** | `[Technical summary]` | 技術亮點與成果概述 |
   | **技術標籤 (Tags)** | `["Tag1", "Tag2", ...]` | 關鍵字陣列 |
   | **專案層級 (Tier)** | `featured` 或 `standard` | 是否為精選置頂專案 |
   | **排序權重 (Sort Order)** | `0` (置頂旗艦) 或 `1`, `2`... | 排序權重 (設為 0 會自動後移其他專案) |
   | **前端視覺元件 (Visual Type)** | `NeuralArch` / `ResultViz` / `image` / `CodeBlock` | 卡片視覺化渲染組件 |
   | **基準指標 (Metrics)** | `{"指標1": "數值", ...}` | 量化評測指標 (JSONB) |
   | **影像來源 (Image URL)** | `https://...` | 來源圖片 (待於 Phase 2 上傳至 R2 CDN) |
   | **起訖日期 (Date Range)** | `YYYY-MM ~ PRESENT` | 專案開發期間 |
   | **開源狀態 / 機密** | `public` / `false` | 權限設定 |

2. **Wait for Explicit Confirmation**: Ask the user in Traditional Chinese:
   > 「已為您完成儲存庫內容解析與資料結構格式化（如上表）。為確保發布內容準確無誤，在正式上傳至 Cloudflare R2 與寫入 Neon 資料庫前，請確認以上內容。如有任何欲調整的欄位（如標籤、摘要、排序或視覺組件），請隨時告知；若確認無誤，請回覆『確認』或『proceed』，我將立即接續執行 Phase 2。」

3. **Gate Enforcement**:
   - If the user requests modifications, update the draft and re-verify.
   - **DO NOT proceed to Step 3 or Step 4** until the user gives explicit confirmation (e.g., "確認", "proceed", "LGTM", "OK", or approves revised fields).

---

### Phase 2: Execution upon Approval

#### Step 3: Image Hosting via Cloudflare R2
The bundled script automatically downloads the source image and uploads it to Cloudflare R2:
- Generates key: `projects/{filename}_{timestamp}.{ext}`
- Content-Type is inferred automatically (`image/png`, `image/jpeg`, `image/webp`, etc.)
- Uploads directly to `R2_BUCKET_NAME` using S3 API credentials.
- Resolves public CDN access URL (`${R2_PUBLIC_BASE_URL}/projects/...`).
- Verifies public reachability via HTTP HEAD request.

#### Step 4: Database Insertion via Neon PostgreSQL
Run `scripts/add_project.mjs` to execute the database transaction:
- **Automatic Sort Order Shift**: If `sort_order` is set to `0`, the script executes:
  ```sql
  UPDATE projects SET sort_order = sort_order + 1 WHERE sort_order >= 0;
  ```
  This cleanly promotes the new project to top flagship status while preserving relative ordering of prior projects.
- **Tagged Template Safety**: Database operations use parameterized queries (`sql`...``) from `@netlify/neon` to prevent SQL injection.

#### Step 5: Verification Checklist & Cleanup
Verify each of the following before concluding the task:
1. **R2 Image Verification**: Send HTTP HEAD/GET request to ensure public URL returns `HTTP 200 OK`.
2. **Database Verification**: Query the row from `projects` table using `id` to ensure fields, tags, and JSONB metrics match.
3. **Git Cleanliness**: Run `git status` and verify that **no working tree files were modified**.
4. **Scratch Cleanup**: Clean up any temporary `.json` definition files created during the workflow.
5. **Local Preview** (Optional): If dev server is running on port 3000, verify the project renders properly in the UI.

---

## Execution Commands

### Method A: Using CLI Arguments Directly
```bash
node .agent/skills/add-portfolio-project/scripts/add_project.mjs \
  --title="Low-Latency Vision-Language Transformer" \
  --description="High-throughput inference pipeline integrating TensorRT-LLM and FlashAttention-2." \
  --link="https://github.com/hengweibin/vlm-inference" \
  --image-url="https://github.com/hengweibin/vlm-inference/raw/main/assets/arch.png" \
  --tier="featured" \
  --sort-order=0 \
  --visual-type="NeuralArch" \
  --tags="TensorRT,PyTorch,CUDA,FlashAttention" \
  --metrics='{"Latency":"14.2ms","Throughput":"185 tok/s","Speedup":"2.8x"}' \
  --date-start="2024-03" \
  --date-end="PRESENT"
```

### Method B: Using a JSON Definition File
Create a temporary JSON file (or pass from `.scratch/`):
```json
{
  "title": "Autonomous Drone Path Planner via DRL",
  "description": "Deep reinforcement learning navigation stack using Soft Actor-Critic (SAC) and customized ROS2 Gazebo simulation environment.",
  "link": "https://github.com/hengweibin/drone-rl-planner",
  "image": "assets/drone_sim.png",
  "tier": "standard",
  "sort_order": 1,
  "visual_type": "ResultViz",
  "tags": ["Reinforcement Learning", "PyTorch", "ROS2", "Gazebo", "Python"],
  "metrics": {
    "Success Rate": "96.4%",
    "Collision Rate": "< 1.2%",
    "Avg Episode Reward": "+342"
  },
  "date_start": "2023-09",
  "date_end": "2024-02",
  "is_confidential": false,
  "repo_visibility": "public"
}
```

Execute with file argument:
```bash
node .agent/skills/add-portfolio-project/scripts/add_project.mjs drone_project.json
```

### Method C: Dry-Run Mode (Validation without Database Mutation)
```bash
node .agent/skills/add-portfolio-project/scripts/add_project.mjs \
  --title="Dry Run Project" \
  --image-url="https://example.com/demo.png" \
  --dry-run
```

---

## Environment Variable Requirements

The script reads connection strings from `.env` or system environment variables:

| Variable | Description | Source |
|---|---|---|
| `NETLIFY_DATABASE_URL` or `REACT_APP_DATABASE_URL` | Neon PostgreSQL connection string (`postgres://...`) | Neon Console / Netlify |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 S3 Access Key ID | Cloudflare Dashboard |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 S3 Secret Access Key | Cloudflare Dashboard |
| `R2_BUCKET_NAME` | Cloudflare R2 bucket name | Cloudflare Dashboard |
| `R2_ENDPOINT_URL` | S3 endpoint URL (`https://<account_id>.r2.cloudflarestorage.com`) | Cloudflare Dashboard |
| `R2_PUBLIC_BASE_URL` | Public CDN base URL (`https://pub-<id>.r2.dev`) | Cloudflare Dashboard |

---

## Troubleshooting & Edge Cases

- **Missing R2 Credentials**: If R2 credentials are not set, the script warns immediately before touching the database. Provide a direct R2 CDN URL or set the required environment variables in `.env`.
- **Image URL Returns 403 / 404**: Verify the remote URL is publicly accessible. For private GitHub repos, provide a local image file path via `--image-url="./local-screenshot.png"`.
- **Duplicate Sort Order**: Setting `--sort-order=0` automatically shifts all other projects. For manual sorting, specify explicit sort weights (`--sort-order=1`, `2`, `3`...).
- **Updating Existing Projects**: Pass `--id=<existing_project_id>` along with updated parameters to modify a project in-place without creating a duplicate record.
