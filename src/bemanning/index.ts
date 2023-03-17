import ServerlessClient from "serverless-postgres";

const NOT_STARTED_ID = "6b402b81-44c7-40d2-8a89-3d2c7a57b777"; // could be moved to env

const client = new ServerlessClient({
  connectionString: process.env.BEMANNING_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false,
  },
});

type EmployeeEndYearWeekDto = {
  email: string;
  startWeek: string;
};
export type EmployeeEndDate = Record<string, Date>;

export default async function listStartEndTimeConsultant(): Promise<EmployeeEndDate> {
  try {
    await client.connect();
    const result = await client.query(`
  SELECT c."Email" as email, MAX(s."YearWeek") as "startWeek" FROM "Consultant" as c
  LEFT JOIN "Staffing" s ON c.id = s."ConsultantId" AND s."Hours" <> 0 AND s."EngagementId" = '${NOT_STARTED_ID}'
  WHERE c."EndDate" IS NULL OR c."EndDate" > now()
  GROUP BY c.id
`);
    await client.clean();
    if (!Array.isArray(result.rows)) {
      return {};
    }

    let data: EmployeeEndDate = {};
    for (let employee of result.rows as EmployeeEndYearWeekDto[]) {
      if (employee.email) {
        data[employee.email] = yearWeekToDate(employee.startWeek);
      }
    }
    return data;
  } catch (e) {
    console.error(e);
    return {};
  }
}

// From https://stackoverflow.com/questions/17855064/how-to-get-a-javascript-date-from-a-week-number
function yearWeekToDate(str: string) {
  if (!str) {
    // Min date
    return new Date(-8640000000000000);
  }
  const year = parseInt(str.substring(0, 4), 10);
  const week = parseInt(str.substring(4), 10);

  const d = new Date(year, 0, 1);
  const dayNum = d.getDay();
  let requiredDate = (week - 1) * 7;

  if (dayNum != 0 || dayNum > 4) {
    requiredDate += 7;
  }

  d.setDate(1 - d.getDay() + (requiredDate + 1));
  return d;
}
