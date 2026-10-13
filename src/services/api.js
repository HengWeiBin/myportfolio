// --- FETCH DATA (Unified Serverless Endpoint) ---

export const fetchPortfolioData = async (options = {}) => {
  const baseUrl = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';
  const query = options?.tier ? `?tier=${encodeURIComponent(options.tier)}` : '';
  const response = await fetch(`${baseUrl}/api/portfolio${query}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio data: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};

export const getProjects = async (options = {}) => {
  const data = await fetchPortfolioData(options);
  return data.projects || [];
};

export const getTieredProjects = async () => {
  const data = await fetchPortfolioData();
  return data.tiered_projects || data.tiered?.projects || {};
};

export const getCertificates = async (options = {}) => {
  const data = await fetchPortfolioData(options);
  return data.certificates || [];
};

export const getSkills = async () => {
  const data = await fetchPortfolioData();
  return data.skills || [];
};

export const getExperience = async () => {
  const data = await fetchPortfolioData();
  return data.experience || [];
};

export const getProfile = async () => {
  const data = await fetchPortfolioData();
  return data.profile || {};
};

// --- UPDATE DATA (Protected Admin Methods) ---

const getAdminSql = async () => {
  const db = await import('./db');
  return db.default;
};

export const addProject = async (project) => {
  const sql = await getAdminSql();
  const tier = project.tier || 'standard';
  const sort_order = project.sort_order !== undefined && project.sort_order !== '' ? Number(project.sort_order) : 0;
  const visual_type = project.visual_type || 'image';
  const is_confidential = Boolean(project.is_confidential);
  const repo_visibility = project.repo_visibility || 'public';
  const metrics = typeof project.metrics === 'object' && project.metrics !== null 
    ? JSON.stringify(project.metrics) 
    : (project.metrics || '{}');

  return await sql`
    INSERT INTO projects (title, description, link, date_start, date_end, image_url, tags, tier, sort_order, visual_type, is_confidential, repo_visibility, metrics)
    VALUES (${project.title}, ${project.description}, ${project.link}, ${project.date_start}, ${project.date_end}, ${project.image_url || null}, ${project.tags || []}, ${tier}, ${sort_order}, ${visual_type}, ${is_confidential}, ${repo_visibility}, ${metrics})
    RETURNING *
  `;
};

export const updateProject = async (id, project) => {
  const sql = await getAdminSql();
  const tier = project.tier || 'standard';
  const sort_order = project.sort_order !== undefined && project.sort_order !== '' ? Number(project.sort_order) : 0;
  const visual_type = project.visual_type || 'image';
  const is_confidential = Boolean(project.is_confidential);
  const repo_visibility = project.repo_visibility || 'public';
  const metrics = typeof project.metrics === 'object' && project.metrics !== null 
    ? JSON.stringify(project.metrics) 
    : (project.metrics || '{}');

  return await sql`
    UPDATE projects 
    SET title = ${project.title}, 
        description = ${project.description}, 
        link = ${project.link}, 
        date_start = ${project.date_start}, 
        date_end = ${project.date_end}, 
        image_url = ${project.image_url || null},
        tags = ${project.tags || []},
        tier = ${tier},
        sort_order = ${sort_order},
        visual_type = ${visual_type},
        is_confidential = ${is_confidential},
        repo_visibility = ${repo_visibility},
        metrics = ${metrics}
    WHERE id = ${id}
    RETURNING *
  `;
};

export const deleteProject = async (id) => {
  const sql = await getAdminSql();
  return await sql`DELETE FROM projects WHERE id = ${id}`;
};

export const addCertificate = async (cert) => {
  const sql = await getAdminSql();
  const category = cert.category || 'Certificate';
  const tier = cert.tier || 'standard';
  const sort_order = cert.sort_order !== undefined && cert.sort_order !== '' ? Number(cert.sort_order) : 0;

  return await sql`
    INSERT INTO certificates (title, issuer, date, image_url, credential_id, category, tier, sort_order)
    VALUES (${cert.title}, ${cert.issuer || ''}, ${cert.date}, ${cert.image_url || null}, ${cert.credential_id || ''}, ${category}, ${tier}, ${sort_order})
    RETURNING *
  `;
};

export const updateCertificate = async (id, cert) => {
  const sql = await getAdminSql();
  const category = cert.category || 'Certificate';
  const tier = cert.tier || 'standard';
  const sort_order = cert.sort_order !== undefined && cert.sort_order !== '' ? Number(cert.sort_order) : 0;

  return await sql`
    UPDATE certificates 
    SET title = ${cert.title}, 
        issuer = ${cert.issuer || ''}, 
        date = ${cert.date}, 
        image_url = ${cert.image_url || null}, 
        credential_id = ${cert.credential_id || ''},
        category = ${category},
        tier = ${tier},
        sort_order = ${sort_order}
    WHERE id = ${id}
    RETURNING *
  `;
};

export const deleteCertificate = async (id) => {
  const sql = await getAdminSql();
  return await sql`DELETE FROM certificates WHERE id = ${id}`;
};

// --- SKILLS CRUD ---

export const addSkill = async (skill) => {
  const sql = await getAdminSql();
  return await sql`
    INSERT INTO skills (category, name)
    VALUES (${skill.category}, ${skill.name})
    RETURNING *
  `;
};

export const updateSkill = async (id, skill) => {
  const sql = await getAdminSql();
  return await sql`
    UPDATE skills 
    SET category = ${skill.category}, 
        name = ${skill.name}
    WHERE id = ${id}
    RETURNING *
  `;
};

export const deleteSkill = async (id) => {
  const sql = await getAdminSql();
  return await sql`DELETE FROM skills WHERE id = ${id}`;
};

// --- EXPERIENCE CRUD ---

export const addExperience = async (exp) => {
  const sql = await getAdminSql();
  const sort_order = exp.sort_order !== undefined && exp.sort_order !== '' ? Number(exp.sort_order) : 0;
  return await sql`
    INSERT INTO experience (role, company, date_range, description, sort_order)
    VALUES (${exp.role}, ${exp.company}, ${exp.date_range}, ${exp.description}, ${sort_order})
    RETURNING *
  `;
};

export const updateExperience = async (id, exp) => {
  const sql = await getAdminSql();
  const sort_order = exp.sort_order !== undefined && exp.sort_order !== '' ? Number(exp.sort_order) : 0;
  return await sql`
    UPDATE experience 
    SET role = ${exp.role}, 
        company = ${exp.company}, 
        date_range = ${exp.date_range}, 
        description = ${exp.description},
        sort_order = ${sort_order}
    WHERE id = ${id}
    RETURNING *
  `;
};

export const deleteExperience = async (id) => {
  const sql = await getAdminSql();
  return await sql`DELETE FROM experience WHERE id = ${id}`;
};

// --- PROFILE CRUD ---

export const updateProfile = async (profile) => {
  const sql = await getAdminSql();
  if (profile.id) {
    return await sql`
      UPDATE profile 
      SET name = ${profile.name}, 
          title = ${profile.title}, 
          email = ${profile.email}, 
          phone = ${profile.phone}, 
          bio = ${profile.bio},
          github = ${profile.github},
          linkedin = ${profile.linkedin},
          instagram = ${profile.instagram},
          facebook = ${profile.facebook},
          resume_link = ${profile.resume_link || null}
      WHERE id = ${profile.id}
      RETURNING *
    `;
  } else {
    return await sql`
      INSERT INTO profile (name, title, email, phone, bio, github, linkedin, instagram, facebook, resume_link)
      VALUES (${profile.name}, ${profile.title}, ${profile.email}, ${profile.phone}, ${profile.bio}, ${profile.github}, ${profile.linkedin}, ${profile.instagram}, ${profile.facebook}, ${profile.resume_link || null})
      RETURNING *
    `;
  }
};
