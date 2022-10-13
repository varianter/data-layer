import handleImage from "./handleImage";
import { ApiEmployee, EmployeeItem } from "./types";
import fetch from "node-fetch";

export { deleteAll } from "./handleImage";

type EmployeeJSON = {
  user_id: string;
  _id: string;
  id: string;
  company_id: string;
  company_name: string;
  company_subdomains: string[];
  company_group_ids: any[];
  email: string;
  external_unique_id: null | string;
  upn: null | string;
  deactivated: boolean;
  deactivated_at: boolean | string;
  role: string;
  roles: string[];
  role_allowed_office_ids: string[];
  role_allowed_tag_ids: any[] | null;
  office_id: string;
  office_name: string;
  country_id: string;
  country_code: string;
  language_code: string;
  language_codes: string[];
  international_toggle: string;
  preferred_download_format: string;
  masterdata_languages: string[];
  expand_proposals_toggle: boolean;
  selected_office_ids: any[];
  include_officeless_reference_projects: boolean;
  selected_tag_ids: any[];
  override_language_code: null;
  default_cv_template_id: string;
  image: {
    url: string;
    thumb: {
      url: string;
    };
    fit_thumb: {
      url: string;
    };
    large: {
      url: string;
    };
    small_thumb: {
      url: string;
    };
  };
  name: string;
  telephone: string;
  default_cv_id: string;
};

export async function requestEmployees(): Promise<EmployeeItem[] | undefined> {
  if (!process.env.CV_PARTNER_API_SECRET) {
    throw new Error("Environment variable CV_PARTNER_API_SECRET is missing");
  }
  const request = await fetch("https://variant.cvpartner.com/api/v1/users", {
    headers: [
      [
        "Authorization",
        `Token token="${process.env.CV_PARTNER_API_SECRET || ""}"`,
      ],
    ],
  });

  if (!request.ok) {
    throw new Error(request.statusText);
  }
  const employeesJSON = (await request.json()) as EmployeeJSON[];

  const employeeList = employeesJSON.filter(
    (employee) =>
      !employee.deactivated &&
      employee.image.url &&
      // All employees that have started should be set
      // as countrymanager in cv-parter, when they start.
      employee.roles.some((role) => role === "countrymanager")
  );

  return await Promise.all<EmployeeItem>(
    employeeList
      .map(toApiEmployee)
      // .filter((employee) => employee.office_name?.toLowerCase() === officeName)
      .map(async (employee) => {
        const imageUrl = await handleImage(employee);
        return { ...massageEmployee(employee), imageUrl };
      })
  );
}

function massageEmployee(employee: ApiEmployee) {
  return {
    fullName: employee.name,
    name: employee.name.split(" ")[0],
    email: employee.email,
    telephone:
      (employee.telephone?.startsWith("+47")
        ? employee.telephone?.slice(3)
        : employee.telephone
      )
        ?.replace(/\s/g, "")
        ?.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/g, "$1 $2 $3 $4") ?? null,
    officeName: employee.office_name,
  };
}

function toApiEmployee(employee: EmployeeJSON): ApiEmployee {
  const { name, telephone, email, image, office_name } = employee;

  if (getFilteredIds().includes(employee.user_id)) {
    return {
      name,
      telephone: null,
      email,
      image,
      office_name,
    };
  }
  return { name, telephone, email, image, office_name };
}

function getFilteredIds(): string[] {
  try {
    return JSON.parse(process.env.FILTER_USERS ?? "[]") ?? [];
  } catch (e) {
    return [];
  }
}
