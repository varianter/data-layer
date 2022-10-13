import type { VercelRequest, VercelResponse } from "@vercel/node";
import listStartEndTimeConsultant from "../../src/bemanning";
import { requestEmployees } from "../../src/employees";

export default async function handler(_: VercelRequest, res: VercelResponse) {
  const employeeStartDates = await listStartEndTimeConsultant();
  const employees = await requestEmployees(employeeStartDates);

  // Cache for 10 seconds
  res.setHeader("Cache-Control", "s-maxage=600");
  res.status(200).json({ employees });
}
