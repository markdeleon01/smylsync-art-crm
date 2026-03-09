import { neon } from '@neondatabase/serverless';


export const getAllPatients = async () => {

    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`SELECT * FROM patients;`;
    return data;
}

export const getPatientById = async (id: string) => {

    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`SELECT * FROM patients WHERE id = ${id};`;
    return data[0];
}

export const updatePatientFirstName = async (id: string, firstname: string) => {

    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`UPDATE patients SET firstname = ${firstname} WHERE id = ${id} RETURNING *;`;
    return data[0];
}

export const updatePatientLastName = async (id: string, lastname: string) => {

    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`UPDATE patients SET lastname = ${lastname} WHERE id = ${id} RETURNING *;`;
    return data[0];
}

export const updatePatientEmail = async (id: string, email: string) => {

    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`UPDATE patients SET email = ${email} WHERE id = ${id} RETURNING *;`;
    return data[0];
}