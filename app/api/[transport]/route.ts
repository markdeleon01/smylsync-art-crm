import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import { getAllPatients, getPatientById, updatePatientFirstName, updatePatientLastName, updatePatientEmail, getPatientsByFirstName, getPatientsByLastName, getPatientByEmail, createPatient, deletePatientById } from "@/lib/services/patients";

// MCP server
const handler = createMcpHandler(
    (server) => {
        server.registerTool(
            "get_all_patients",
            {
                title: "Get All Patients Information",
                description: "Use this tool to retrieve information about all patients.",
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
                    patientsInfos += `${patientsInfos}`;
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
                inputSchema: {
                    id: z.string()
                },
            },
            async ({ id }) => {
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
                inputSchema: {
                    lastname: z.string().max(255)
                }
            },
            async ({ lastname }) => {
                // Implementation for retrieving patients by last name
                const patients = await getPatientsByLastName(lastname);
                //console.log('Retrieved patients:', patients);
                let patientsInfos = '';
                if (patients.length > 0) {
                    patientsInfos += `All patients with last name '${lastname}' information retrieved successfully.\n\n`;
                    for (const patient of patients) {
                        patientsInfos += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                    }
                    patientsInfos += `${patientsInfos}`;
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
                inputSchema: {
                    firstname: z.string().max(255)
                }
            },
            async ({ firstname }) => {
                // Implementation for retrieving patients by first name
                const patients = await getPatientsByFirstName(firstname);
                //console.log('Retrieved patients:', patients);
                let patientsInfos = '';
                if (patients.length > 0) {
                    patientsInfos += `All patients with first name '${firstname}' information retrieved successfully.\n\n`;
                    for (const patient of patients) {
                        patientsInfos += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                    }
                    patientsInfos += `${patientsInfos}`;
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
                inputSchema: {
                    email: z.string()
                },
            },
            async ({ email }) => {
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
                inputSchema: {
                    id: z.string(),
                    firstname: z.string().max(255),
                },
            },
            async ({ id, firstname }) => {
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
                inputSchema: {
                    id: z.string(),
                    lastname: z.string().max(255),
                },
            },
            async ({ id, lastname }) => {
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
                inputSchema: {
                    id: z.string(),
                    email: z.string().max(255),
                },
            },
            async ({ id, email }) => {
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
                description: "Use this tool when a user asks to create a new patient.",
                inputSchema: {
                    firstname: z.string().max(255),
                    lastname: z.string().max(255),
                    email: z.string().max(255),
                },
            },
            async ({ firstname, lastname, email }) => {
                // Implementation for creating new patient in the database
                const patient = await createPatient(firstname, lastname, email);
                //console.log('Updated patient:', updatedPatient);

                return {
                    content: [
                        {
                            type: "text", text: `Patient created successfully.\nPatient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}`
                        }
                    ],
                };
            }
        );

        server.registerTool(
            "delete_patient_by_id",
            {
                title: "Delete Patient Information by ID",
                description: "Use this tool to delete or remove a patient given their ID.",
                inputSchema: {
                    id: z.string()
                },
            },
            async ({ id }) => {
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
    },
    {},
    {
        basePath: "/api", // must match where [transport] is located
        maxDuration: 60,
        verboseLogs: true,
    }
);

export { handler as GET, handler as POST };
