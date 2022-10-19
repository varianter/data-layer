import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requestCv } from "../../src/cv";
import { getCachedEmployees } from "../../src/employees";


export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { email } = req.query;
    if(!email){
      return res.status(400).send("Query parameter 'email' not set");
    }

    const employees = await getCachedEmployees();
    const employee = employees.find(e => e.email.toLocaleLowerCase() === email);
    if(!employee) {
      return res.status(404).send('Employee not found');
    }

    try {
        const cv = await requestCv(employee.userId, employee.defaultCvId);    

        // Cache for 10 minutes
        res.setHeader("Cache-Control", "s-maxage=600");
        return res.status(200).json({ cv });
    } catch (error: any) {
        return res.status(error?.statusCode ?? 500).send(error?.statusText ?? 'Internal server error');
    }
}
