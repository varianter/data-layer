import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requestCv } from "../../src/cvs";


export default async function handler(req: VercelRequest, res: VercelResponse) {
    const ids = req.query["ids"];
    const cv = await requestCv(ids[0], ids[1]);

    // Cache for 10 minutes
    res.setHeader("Cache-Control", "s-maxage=600");
    res.status(200).json({ cv });
}
