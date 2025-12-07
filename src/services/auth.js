import sql from './db';

// Simple client-side auth service
// WARNING: This is not secure for high-stakes applications as logic is exposed in client bundle.
// Sufficient for personal portfolio as requested.

export const login = async (email, password) => {
    try {
        const result = await sql`
      SELECT * FROM admins 
      WHERE email = ${email} AND password = ${password}
    `;

        if (result.length > 0) {
            // Return user info (excluding password ideally, but here we just pass the record)
            return {
                success: true,
                user: { email: result[0].email, id: result[0].id }
            };
        }
        return { success: false, message: 'Invalid credentials' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Database connection failed' };
    }
};

export const checkSession = () => {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
};

export const logout = () => {
    localStorage.removeItem('admin_user');
};
