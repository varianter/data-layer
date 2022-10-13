import type { VercelRequest, VercelResponse } from "@vercel/node";
import { deleteAll, requestEmployees } from "../../src/employees";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (
    !process.env.REVALIDATE_TOKEN ||
    req.headers.authorization !== process.env.REVALIDATE_TOKEN
  ) {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    await deleteAll();
    const employees = await requestEmployees();
    res.status(200).json({ employees });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error revalidating");
  }
}
