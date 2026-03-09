import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import { getAllPatients, getPatientById, updatePatientFirstName, updatePatientLastName, updatePatientEmail } from "@/lib/services/patients";

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
                console.log('Retrieved patients:', patients);
                let patientInfo = '';
                for (const patient of patients) {
                    patientInfo += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                }

                return {
                    content: [
                        {
                            type: "text", text: `All patients information retrieved successfully.\n${patientInfo}`
                        }
                    ],
                };
            }
        );

        server.registerTool(
            "get_patient_info_by_id",
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
                console.log('Retrieved patient:', patient);

                return {
                    content: [
                        {
                            type: "text", text: `Patient information retrieved successfully.\n
                            Patient ID: ${patient.id}\n
                            First Name: ${patient.firstname}\n
                            Last Name: ${patient.lastname}\n
                            Email: ${patient.email}\n`
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
                console.log('Updated patient:', updatedPatient);

                return {
                    content: [
                        {
                            type: "text", text: `Patient first name updated successfully.\n
                            Patient ID: ${updatedPatient.id}\n
                            New First Name: ${updatedPatient.firstname}`
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
                console.log('Updated patient:', updatedPatient);

                return {
                    content: [
                        {
                            type: "text", text: `Patient last name updated successfully.\n
                            Patient ID: ${updatedPatient.id}\n
                            New Last Name: ${updatedPatient.lastname}`
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
                console.log('Updated patient:', updatedPatient);

                return {
                    content: [
                        {
                            type: "text", text: `Patient email updated successfully.\n
                            Patient ID: ${updatedPatient.id}\n
                            New Email: ${updatedPatient.email}`
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
