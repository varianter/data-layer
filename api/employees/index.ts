import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requestEmployees } from "../src/employees";

export default async function handler(_: VercelRequest, res: VercelResponse) {
  const employees = await requestEmployees();

  // Cache for 10 seconds
  res.setHeader("Cache-Control", "s-maxage=600");
  res.status(200).json({ employees });
}
