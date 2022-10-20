import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCachedCv } from "../../src/cv";
import { getCachedEmployees } from "../../src/employees";

export default async function handler(_: VercelRequest, res: VercelResponse) {
    console.time("warmup")
    
    const employees = await getCachedEmployees();

    for (let i = 0; i < employees.length; i++) {
        await getCachedCv(employees[i].email.toLowerCase());
        console.log(`${i+1}/${employees.length}`)
    }
    
    console.timeEnd("warmup");
    return res.status(200).send(`Done`);
}

