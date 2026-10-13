// --- FETCH DATA (Unified Serverless Endpoint) ---

export const fetchPortfolioData = async () => {
  const baseUrl = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';
  const response = await fetch(`${baseUrl}/api/portfolio`);
  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio data: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};

export const getProjects = async () => {
  const data = await fetchPortfolioData();
  return data.projects || [];
};

export const getCertificates = async () => {
  const data = await fetchPortfolioData();
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

// --- UPDATE DATA (Protected Admin Methods - to be migrated in Ticket #4) ---

const getAdminSql = async () => {
  const db = await import('./db');
  return db.default;
};

export const addProject = async (project) => {
  const sql = await getAdminSql();
  return await sql`
    INSERT INTO projects (title, description, link, date_start, date_end, image_url, tags)
    VALUES (${project.title}, ${project.description}, ${project.link}, ${project.date_start}, ${project.date_end}, ${project.image_url || null}, ${project.tags})
    RETURNING *
  `;
};

export const updateProject = async (id, project) => {
  const sql = await getAdminSql();
  return await sql`
    UPDATE projects 
    SET title = ${project.title}, 
        description = ${project.description}, 
        link = ${project.link}, 
        date_start = ${project.date_start}, 
        date_end = ${project.date_end}, 
        image_url = ${project.image_url || null},
        tags = ${project.tags}
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
  return await sql`
    INSERT INTO certificates (title, issuer, date, image_url, credential_id)
    VALUES (${cert.title}, ${cert.issuer || ''}, ${cert.date}, ${cert.image_url || null}, ${cert.credential_id || ''})
    RETURNING *
  `;
};

export const updateCertificate = async (id, cert) => {
  const sql = await getAdminSql();
  return await sql`
    UPDATE certificates 
    SET title = ${cert.title}, 
        issuer = ${cert.issuer || ''}, 
        date = ${cert.date}, 
        image_url = ${cert.image_url || null},
        credential_id = ${cert.credential_id || ''}
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
  return await sql`
    INSERT INTO experience (role, company, date_range, description)
    VALUES (${exp.role}, ${exp.company}, ${exp.date_range}, ${exp.description})
    RETURNING *
  `;
};

export const updateExperience = async (id, exp) => {
  const sql = await getAdminSql();
  return await sql`
    UPDATE experience 
    SET role = ${exp.role}, 
        company = ${exp.company}, 
        date_range = ${exp.date_range}, 
        description = ${exp.description}
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
