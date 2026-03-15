import { getAllPatients } from "@/lib/services/patients";

export async function GET () {

    const patients = await getAllPatients();
    return Response.json( patients );

}