import { neon } from '@neondatabase/serverless';


export const getAllPatients = async () => {

    const sql = neon(process.env.POSTGRES_URL!);
    const data = await sql`SELECT * FROM patients;`;
    //console.log('getAllPatients=', data);
    return data;
}

export const getPatientById = async (id: string) => {

    const sql = neon(process.env.POSTGRES_URL!);
    const data = await sql`SELECT * FROM patients WHERE id = ${id};`;
    //console.log('getPatientById=', data);
    return data[0];
}

export const createPatient = async (firstname: string, lastname: string, email: string, phone?: string) => {

    const sql = neon(process.env.POSTGRES_URL!);
    const id = crypto.randomUUID();
    const data = await sql`INSERT INTO patients (id, firstname, lastname, email, phone) VALUES (${id}, ${firstname}, ${lastname}, ${email}, ${phone ?? null}) RETURNING *;`;
    return data[0];
}

export const deletePatientById = async (id: string) => {

    const sql = neon(process.env.POSTGRES_URL!);
    const data = await sql`DELETE FROM patients WHERE id = ${id} RETURNING *;`;
    //console.log('deletePatientById=', data);
    return data[0];
}

export const getPatientsByLastName = async (lastname: string) => {

    const sql = neon(process.env.POSTGRES_URL!);
    const data = await sql`SELECT * FROM patients WHERE lastname = ${lastname};`;
    //console.log('getPatientsByLastName=', data);
    return data;
}

export const getPatientsByFirstName = async (firstname: string) => {

    const sql = neon(process.env.POSTGRES_URL!);
    const data = await sql`SELECT * FROM patients WHERE firstname = ${firstname};`;
    //console.log('getPatientsByFirstName=', data);
    return data;
}

export const getPatientByEmail = async (email: string) => {

    const sql = neon(process.env.POSTGRES_URL!);
    const data = await sql`SELECT * FROM patients WHERE email = ${email};`;
    //console.log('getPatientByEmail=', data);
    return data[0];
}

export const updatePatientFirstName = async (id: string, firstname: string) => {

    const sql = neon(process.env.POSTGRES_URL!);
    const data = await sql`UPDATE patients SET firstname = ${firstname} WHERE id = ${id} RETURNING *;`;
    //console.log('updatePatientFirstName=', data);
    return data[0];
}

export const updatePatientLastName = async (id: string, lastname: string) => {

    const sql = neon(process.env.POSTGRES_URL!);
    const data = await sql`UPDATE patients SET lastname = ${lastname} WHERE id = ${id} RETURNING *;`;
    //console.log('updatePatientLastName=', data);
    return data[0];
}

export const updatePatientEmail = async (id: string, email: string) => {

    const sql = neon(process.env.POSTGRES_URL!);
    const data = await sql`UPDATE patients SET email = ${email} WHERE id = ${id} RETURNING *;`;
    //console.log('updatePatientEmail=', data);
    return data[0];
}

export const updatePatientPhone = async (id: string, phone: string) => {

    const sql = neon(process.env.POSTGRES_URL!);
    const data = await sql`UPDATE patients SET phone = ${phone} WHERE id = ${id} RETURNING *;`;
    return data[0];
}

export const deletePatientByLastName = async (lastname: string) => {

    const sql = neon(process.env.POSTGRES_URL!);
    const data = await sql`DELETE FROM patients WHERE lastname = ${lastname} RETURNING *;`;
    //console.log('deletePatientByLastName=', data);
    return data;
}

export const deletePatientByFirstName = async (firstname: string) => {

    const sql = neon(process.env.POSTGRES_URL!);
    const data = await sql`DELETE FROM patients WHERE firstname = ${firstname} RETURNING *;`;
    //console.log('deletePatientByFirstName=', data);
    return data;
}

export const deletePatientByEmail = async (email: string) => {

    const sql = neon(process.env.POSTGRES_URL!);
    const data = await sql`DELETE FROM patients WHERE email = ${email} RETURNING *;`;
    //console.log('deletePatientByEmail=', data);
    return data[0];
}