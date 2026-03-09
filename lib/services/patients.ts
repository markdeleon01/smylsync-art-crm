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

export const createPatient = async (firstname: string, lastname: string, email: string) => {

    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`INSERT INTO patients (firstname, lastname, email) VALUES (${firstname}, ${lastname}, ${email}) RETURNING *;`;
    return data[0];
}

export const deletePatientById = async (id: string) => {

    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`DELETE FROM patients WHERE id = ${id} RETURNING *;`;
    return data[0];
}

export const getPatientsByLastName = async (lastname: string) => {

    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`SELECT * FROM patients WHERE lastname = ${lastname};`;
    return data;
}

export const getPatientsByFirstName = async (firstname: string) => {

    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`SELECT * FROM patients WHERE firstname = ${firstname};`;
    return data;
}

export const getPatientByEmail = async (email: string) => {

    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`SELECT * FROM patients WHERE email = ${email};`;
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