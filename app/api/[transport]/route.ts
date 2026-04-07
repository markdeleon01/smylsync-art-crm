import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

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

// MCP server
const handler = createMcpHandler(
    (server: any) => {
        server.registerTool(
            "get_all_patients",
            {
                title: "Get All Patients Information",
                description: "Use this tool to retrieve information about all patients.",
                annotations: { readOnlyHint: true },
            },
            async () => {
                // Implementation for retrieving all patients information
                const patients = await getAllPatients();
                //console.log('Retrieved patients:', patients);
                let patientsInfos = '';
                if (patients.length > 0) {
                    patientsInfos += `All patients information retrieved successfully.\n\n`;
                    for (const patient of patients) {
                        patientsInfos += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                    }
                } else {
                    patientsInfos += `No patients were found.`;
                }

                return {
                    content: [
                        {
                            type: "text", text: `${patientsInfos}`
                        }
                    ],
                };
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
                // Implementation for retrieving patient information by ID
                const patient = await getPatientById(id);
                //console.log('Retrieved patient:', patient);
                let patientInfo = '';
                if (patient) {
                    patientInfo += `Patient with id '${id}' information retrieved successfully.\nPatient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n`
                } else {
                    patientInfo += `No patient with id '${id}' was found.`;
                }

                return {
                    content: [
                        {
                            type: "text", text: `${patientInfo}`
                        }
                    ],
                };
            }
        );

        server.registerTool(
            "get_patients_by_lastname",
            {
                title: "Get Patients by Last Name",
                description: "Use this tool to retrieve information about patients given their last name.",
                annotations: { readOnlyHint: true },
                inputSchema: patientLastNameSchema
            },
            async ({ lastname }: { lastname: string }) => {
                // Implementation for retrieving patients by last name
                const patients = await getPatientsByLastName(lastname);
                //console.log('Retrieved patients:', patients);
                let patientsInfos = '';
                if (patients.length > 0) {
                    patientsInfos += `All patients with last name '${lastname}' information retrieved successfully.\n\n`;
                    for (const patient of patients) {
                        patientsInfos += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                    }
                } else {
                    patientsInfos += `No patients were found.`;
                }

                return {
                    content: [
                        {
                            type: "text", text: `${patientsInfos}`
                        }
                    ],
                };
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
                // Implementation for retrieving patients by first name
                const patients = await getPatientsByFirstName(firstname);
                //console.log('Retrieved patients:', patients);
                let patientsInfos = '';
                if (patients.length > 0) {
                    patientsInfos += `All patients with first name '${firstname}' information retrieved successfully.\n\n`;
                    for (const patient of patients) {
                        patientsInfos += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                    }
                } else {
                    patientsInfos += `No patients were found.`;
                }

                return {
                    content: [
                        {
                            type: "text", text: `${patientsInfos}`
                        }
                    ],
                };
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
                // Implementation for retrieving patient information by ID
                const patient = await getPatientByEmail(email);
                //console.log('Retrieved patient:', patient);
                let patientInfo = '';
                if (patient) {
                    patientInfo += `Patient with email '${email}' information retrieved successfully.\nPatient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n`

                } else {
                    patientInfo += `No patient with email '${email}' was found.`;
                }

                return {
                    content: [
                        {
                            type: "text", text: `${patientInfo}`
                        }
                    ],
                };
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
                // Implementation for updating patient first name in the database
                const updatedPatient = await updatePatientFirstName(id, firstname);
                //console.log('Updated patient:', updatedPatient);

                return {
                    content: [
                        {
                            type: "text", text: `Patient first name updated successfully.\nPatient ID: ${updatedPatient.id}\nNew First Name: ${updatedPatient.firstname}`
                        }
                    ],
                };
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
                // Implementation for updating patient last name in the database
                const updatedPatient = await updatePatientLastName(id, lastname);
                //console.log('Updated patient:', updatedPatient);

                return {
                    content: [
                        {
                            type: "text", text: `Patient last name updated successfully.\nPatient ID: ${updatedPatient.id}\nNew Last Name: ${updatedPatient.lastname}`
                        }
                    ],
                };
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
                // Implementation for updating patient email in the database
                const updatedPatient = await updatePatientEmail(id, email);
                //console.log('Updated patient:', updatedPatient);

                return {
                    content: [
                        {
                            type: "text", text: `Patient email updated successfully.\nPatient ID: ${updatedPatient.id}\nNew Email: ${updatedPatient.email}`
                        }
                    ],
                };
            }
        );

        server.registerTool(
            "create_new_patient",
            {
                title: "Create New Patient",
                description: "Use this tool when a user asks to create a new patient.  Ask for confirmation before creating a new patient.",
                inputSchema: createPatientSchema,
                annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, requiresConfirmation: true },
            },
            async ({ firstname, lastname, email }: { firstname: string; lastname: string; email: string }) => {
                // Implementation for creating new patient in the database
                const newPatient = await createPatient(firstname, lastname, email);
                console.log('Created patient:', newPatient);

                return {
                    content: [
                        {
                            type: "text", text: `Patient created successfully.\nPatient ID: ${newPatient.id}\nFirst Name: ${newPatient.firstname}\nLast Name: ${newPatient.lastname}\nEmail: ${newPatient.email}`
                        }
                    ],
                };
            }
        );

        server.registerTool(
            "delete_patient_by_id",
            {
                title: "Delete Patient Information by ID",
                description: "Use this tool to delete or remove a patient given their ID.  Ask for confirmation before deleting a patient.",
                inputSchema: patientIdSchema,
                annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, requiresConfirmation: true },
            },
            async ({ id }: { id: string }) => {
                // Implementation for retrieving patient information by ID
                const patient = await deletePatientById(id);
                //console.log('Retrieved patient:', patient);

                return {
                    content: [
                        {
                            type: "text", text: `Patient with id '${id}' information deleted successfully.\nPatient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n`
                        }
                    ],
                };
            }
        );

        server.registerTool(
            "delete_patient_by_lastname",
            {
                title: "Delete Patient Information by Last Name",
                description: "Use this tool to delete or remove a patient given their last name.  Ask for confirmation before deleting a patient.",
                inputSchema: patientLastNameSchema,
                annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, requiresConfirmation: true },
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

                return {
                    content: [
                        {
                            type: "text", text: result
                        }
                    ],
                };
            }
        );

        server.registerTool(
            "delete_patient_by_firstname",
            {
                title: "Delete Patient Information by First Name",
                description: "Use this tool to delete or remove a patient given their first name.  Ask for confirmation before deleting a patient.",
                inputSchema: patientFirstNameSchema,
                annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, requiresConfirmation: true },
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

                return {
                    content: [
                        {
                            type: "text", text: result
                        }
                    ],
                };
            }
        );

        server.registerTool(
            "delete_patient_by_email",
            {
                title: "Delete Patient Information by Email",
                description: "Use this tool to delete or remove a patient given their email address.  Ask for confirmation before deleting a patient.",
                inputSchema: patientEmailSchema,
                annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, requiresConfirmation: true },
            },
            async ({ email }: { email: string }) => {
                const patient = await deletePatientByEmail(email);
                let result = '';
                if (patient) {
                    result = `Patient with email '${email}' deleted successfully.\nPatient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n`;
                } else {
                    result = `No patient with email '${email}' was found to delete.`;
                }

                return {
                    content: [
                        {
                            type: "text", text: result
                        }
                    ],
                };
            }
        );
    },
    {},
    {
        basePath: "/api", // must match where [transport] is located
        maxDuration: 60,
        verboseLogs: true,
    }
);

export { handler as GET, handler as POST };
