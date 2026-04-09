import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { NextRequest } from "next/server";

import { getAllPatients, getPatientById, updatePatientFirstName, updatePatientLastName, updatePatientEmail, getPatientsByFirstName, getPatientsByLastName, getPatientByEmail, createPatient, deletePatientById, deletePatientByLastName, deletePatientByFirstName, deletePatientByEmail } from "@/lib/services/patients";

// Define schemas outside to help with type inference
const patientIdSchema = z.object({ id: z.string() });
const patientEmailSchema = z.object({ email: z.string() });
const patientFirstNameSchema = z.object({ firstname: z.string().max(255) });
const patientLastNameSchema = z.object({ lastname: z.string().max(255) });
const updateFirstNameSchema = z.object({ id: z.string(), firstname: z.string().max(255) });
const updateLastNameSchema = z.object({ id: z.string(), lastname: z.string().max(255) });
const updateEmailSchema = z.object({ id: z.string(), email: z.string().max(255) });
const createPatientSchema = z.object({ firstname: z.string().max(255), lastname: z.string().max(255), email: z.string().max(255) });

function createMcpServer() {
    const server = new McpServer({ name: "smylsync-mcp", version: "1.0.0" });

    server.registerTool(
        "get_all_patients",
        {
            title: "Get All Patients Information",
            description: "Use this tool to retrieve information about all patients.",
            annotations: { readOnlyHint: true },
        },
        async () => {
            const patients = await getAllPatients();
            let patientsInfos = '';
            if (patients.length > 0) {
                patientsInfos += `All patients information retrieved successfully.\n\n`;
                for (const patient of patients) {
                    patientsInfos += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                }
            } else {
                patientsInfos += `No patients were found.`;
            }
            return { content: [{ type: "text", text: patientsInfos }] };
        }
    );

    server.registerTool(
        "get_patient_by_id",
        {
            title: "Get Patient Information by ID",
            description: "Use this tool to retrieve information about a patient given their ID.",
            inputSchema: patientIdSchema,
            annotations: { readOnlyHint: true },
        },
        async ({ id }: { id: string }) => {
            const patient = await getPatientById(id);
            let patientInfo = '';
            if (patient) {
                patientInfo = `Patient with id '${id}' information retrieved successfully.\nPatient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n`;
            } else {
                patientInfo = `No patient with id '${id}' was found.`;
            }
            return { content: [{ type: "text", text: patientInfo }] };
        }
    );

    server.registerTool(
        "get_patients_by_lastname",
        {
            title: "Get Patients by Last Name",
            description: "Use this tool to retrieve information about patients given their last name.",
            inputSchema: patientLastNameSchema,
            annotations: { readOnlyHint: true },
        },
        async ({ lastname }: { lastname: string }) => {
            const patients = await getPatientsByLastName(lastname);
            let patientsInfos = '';
            if (patients.length > 0) {
                patientsInfos += `All patients with last name '${lastname}' information retrieved successfully.\n\n`;
                for (const patient of patients) {
                    patientsInfos += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                }
            } else {
                patientsInfos = `No patients were found.`;
            }
            return { content: [{ type: "text", text: patientsInfos }] };
        }
    );

    server.registerTool(
        "get_patients_by_firstname",
        {
            title: "Get Patients by First Name",
            description: "Use this tool to retrieve information about patients given their first name.",
            inputSchema: patientFirstNameSchema,
            annotations: { readOnlyHint: true },
        },
        async ({ firstname }: { firstname: string }) => {
            const patients = await getPatientsByFirstName(firstname);
            let patientsInfos = '';
            if (patients.length > 0) {
                patientsInfos += `All patients with first name '${firstname}' information retrieved successfully.\n\n`;
                for (const patient of patients) {
                    patientsInfos += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                }
            } else {
                patientsInfos = `No patients were found.`;
            }
            return { content: [{ type: "text", text: patientsInfos }] };
        }
    );

    server.registerTool(
        "get_patient_by_email",
        {
            title: "Get Patient Information by Email",
            description: "Use this tool to retrieve information about a patient given their email address.",
            inputSchema: patientEmailSchema,
            annotations: { readOnlyHint: true },
        },
        async ({ email }: { email: string }) => {
            const patient = await getPatientByEmail(email);
            let patientInfo = '';
            if (patient) {
                patientInfo = `Patient with email '${email}' information retrieved successfully.\nPatient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n`;
            } else {
                patientInfo = `No patient with email '${email}' was found.`;
            }
            return { content: [{ type: "text", text: patientInfo }] };
        }
    );

    server.registerTool(
        "update_patient_firstname",
        {
            title: "Update Patient First Name",
            description: "Use this tool when a user asks to change or correct a patient's first name given their ID.",
            inputSchema: updateFirstNameSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ id, firstname }: { id: string; firstname: string }) => {
            const updatedPatient = await updatePatientFirstName(id, firstname);
            return { content: [{ type: "text", text: `Patient first name updated successfully.\nPatient ID: ${updatedPatient.id}\nNew First Name: ${updatedPatient.firstname}` }] };
        }
    );

    server.registerTool(
        "update_patient_lastname",
        {
            title: "Update Patient Last Name",
            description: "Use this tool when a user asks to change or correct a patient's last name given their ID.",
            inputSchema: updateLastNameSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ id, lastname }: { id: string; lastname: string }) => {
            const updatedPatient = await updatePatientLastName(id, lastname);
            return { content: [{ type: "text", text: `Patient last name updated successfully.\nPatient ID: ${updatedPatient.id}\nNew Last Name: ${updatedPatient.lastname}` }] };
        }
    );

    server.registerTool(
        "update_patient_email",
        {
            title: "Update Patient Email",
            description: "Use this tool when a user asks to change or correct a patient's email given their ID.",
            inputSchema: updateEmailSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ id, email }: { id: string; email: string }) => {
            const updatedPatient = await updatePatientEmail(id, email);
            return { content: [{ type: "text", text: `Patient email updated successfully.\nPatient ID: ${updatedPatient.id}\nNew Email: ${updatedPatient.email}` }] };
        }
    );

    server.registerTool(
        "create_new_patient",
        {
            title: "Create New Patient",
            description: "Use this tool when a user asks to create a new patient.  Ask for confirmation before creating a new patient.",
            inputSchema: createPatientSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
        },
        async ({ firstname, lastname, email }: { firstname: string; lastname: string; email: string }) => {
            const newPatient = await createPatient(firstname, lastname, email);
            return { content: [{ type: "text", text: `Patient created successfully.\nPatient ID: ${newPatient.id}\nFirst Name: ${newPatient.firstname}\nLast Name: ${newPatient.lastname}\nEmail: ${newPatient.email}` }] };
        }
    );

    server.registerTool(
        "delete_patient_by_id",
        {
            title: "Delete Patient Information by ID",
            description: "Use this tool to delete or remove a patient given their ID.  Ask for confirmation before deleting a patient.",
            inputSchema: patientIdSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ id }: { id: string }) => {
            const patient = await deletePatientById(id);
            return { content: [{ type: "text", text: `Patient with id '${id}' deleted successfully.\nPatient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n` }] };
        }
    );

    server.registerTool(
        "delete_patient_by_lastname",
        {
            title: "Delete Patient Information by Last Name",
            description: "Use this tool to delete or remove a patient given their last name.  Ask for confirmation before deleting a patient.",
            inputSchema: patientLastNameSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ lastname }: { lastname: string }) => {
            const patients = await deletePatientByLastName(lastname);
            let result = '';
            if (Array.isArray(patients) && patients.length > 0) {
                result = `${patients.length} patient(s) with last name '${lastname}' deleted successfully.\n`;
                for (const patient of patients) {
                    result += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                }
            } else {
                result = `No patients with last name '${lastname}' were found to delete.`;
            }
            return { content: [{ type: "text", text: result }] };
        }
    );

    server.registerTool(
        "delete_patient_by_firstname",
        {
            title: "Delete Patient Information by First Name",
            description: "Use this tool to delete or remove a patient given their first name.  Ask for confirmation before deleting a patient.",
            inputSchema: patientFirstNameSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ firstname }: { firstname: string }) => {
            const patients = await deletePatientByFirstName(firstname);
            let result = '';
            if (Array.isArray(patients) && patients.length > 0) {
                result = `${patients.length} patient(s) with first name '${firstname}' deleted successfully.\n`;
                for (const patient of patients) {
                    result += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                }
            } else {
                result = `No patients with first name '${firstname}' were found to delete.`;
            }
            return { content: [{ type: "text", text: result }] };
        }
    );

    server.registerTool(
        "delete_patient_by_email",
        {
            title: "Delete Patient Information by Email",
            description: "Use this tool to delete or remove a patient given their email address.  Ask for confirmation before deleting a patient.",
            inputSchema: patientEmailSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ email }: { email: string }) => {
            const patient = await deletePatientByEmail(email);
            let result = '';
            if (patient) {
                result = `Patient with email '${email}' deleted successfully.\nPatient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n`;
            } else {
                result = `No patient with email '${email}' was found to delete.`;
            }
            return { content: [{ type: "text", text: result }] };
        }
    );

    return server;
}

async function handleMcpRequest(req: NextRequest): Promise<Response> {
    // Stateless mode: create a fresh server + transport per request (no Redis needed)
    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
    const server = createMcpServer();
    await server.connect(transport);
    return transport.handleRequest(req);
}

export async function GET(req: NextRequest) {
    try {
        return await handleMcpRequest(req);
    } catch (error) {
        console.error("MCP GET error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        return await handleMcpRequest(req);
    } catch (error) {
        console.error("MCP POST error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        return await handleMcpRequest(req);
    } catch (error) {
        console.error("MCP DELETE error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}