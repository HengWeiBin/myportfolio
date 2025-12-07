import sql from './db';

// --- FETCH DATA ---

export const getProjects = async () => {
    return await sql`SELECT * FROM projects ORDER BY date_end DESC`;
};

export const getCertificates = async () => {
    return await sql`SELECT * FROM certificates ORDER BY date DESC`;
};

export const getSkills = async () => {
    // Group by category after fetching? Or fetch all and group in frontend.
    return await sql`SELECT * FROM skills`;
};

export const getExperience = async () => {
    return await sql`SELECT * FROM experience ORDER BY id DESC`; // Assuming higher ID is newer or add date column handling
};

// --- UPDATE DATA (Protected) ---

export const addProject = async (project) => {
    // project: { title, description, link, date_start, date_end, image_base64, tags }
    return await sql`
    INSERT INTO projects (title, description, link, date_start, date_end, image_base64, tags)
    VALUES (${project.title}, ${project.description}, ${project.link}, ${project.date_start}, ${project.date_end}, ${project.image_base64}, ${project.tags})
    RETURNING *
  `;
};

export const updateProject = async (id, project) => {
    return await sql`
    UPDATE projects 
    SET title = ${project.title}, 
        description = ${project.description}, 
        link = ${project.link}, 
        date_start = ${project.date_start}, 
        date_end = ${project.date_end}, 
        image_base64 = ${project.image_base64}, 
        tags = ${project.tags}
    WHERE id = ${id}
    RETURNING *
  `;
};

export const deleteProject = async (id) => {
    return await sql`DELETE FROM projects WHERE id = ${id}`;
};


export const addCertificate = async (cert) => {
    return await sql`
    INSERT INTO certificates (title, issuer, date, image_base64, credential_id)
    VALUES (${cert.title}, ${cert.issuer || ''}, ${cert.date}, ${cert.image_base64}, ${cert.credential_id || ''})
    RETURNING *
  `;
};

export const deleteCertificate = async (id) => {
    return await sql`DELETE FROM certificates WHERE id = ${id}`;
};
