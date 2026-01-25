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

// ... previous code

export const updateCertificate = async (id, cert) => {
    return await sql`
    UPDATE certificates 
    SET title = ${cert.title}, 
        issuer = ${cert.issuer || ''}, 
        date = ${cert.date}, 
        image_base64 = ${cert.image_base64}, 
        credential_id = ${cert.credential_id || ''}
    WHERE id = ${id}
    RETURNING *
  `;
};

export const deleteCertificate = async (id) => {
    return await sql`DELETE FROM certificates WHERE id = ${id}`;
};

// --- EXPERIENCE CRUD ---

export const addExperience = async (exp) => {
    return await sql`
    INSERT INTO experience (role, company, date_range, description)
    VALUES (${exp.role}, ${exp.company}, ${exp.date_range}, ${exp.description})
    RETURNING *
  `;
};

export const updateExperience = async (id, exp) => {
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
    return await sql`DELETE FROM experience WHERE id = ${id}`;
};

// --- PROFILE CRUD ---

export const getProfile = async () => {
    // Assuming single row with ID 1 or fetch first
    const result = await sql`SELECT * FROM profile LIMIT 1`;
    return result[0];
};

export const updateProfile = async (profile) => {
    // Upsert logic if id exists, otherwise insert
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
            facebook = ${profile.facebook}
        WHERE id = ${profile.id}
        RETURNING *
        `;
    } else {
        return await sql`
        INSERT INTO profile (name, title, email, phone, bio, github, linkedin, instagram, facebook)
        VALUES (${profile.name}, ${profile.title}, ${profile.email}, ${profile.phone}, ${profile.bio}, ${profile.github}, ${profile.linkedin}, ${profile.instagram}, ${profile.facebook})
        RETURNING *
        `;
    }
};
