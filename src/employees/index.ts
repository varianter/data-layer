import isBefore from "date-fns/isBefore";
import { EmployeeEndDate } from "../bemanning";
import { getBaseUrl } from "../shared/utils/baseUrl";
import handleImage from "./handleImage";
import { Employee } from "./types";
import { fetch } from '../shared/utils/fetch';

type CVPartnerEmployeeDto = {
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

/**
 * Calls the vercel api/employees endpoint to make use of the caching policy applied there
 */
export const getCachedEmployees = async (): Promise<Employee[]> => {
  const res = await fetch(`${getBaseUrl()}/api/employees`)
    .then(res => res.json());
  return res?.employees ?? [];
}

export async function requestEmployees(
  employeeStartDates: EmployeeEndDate
): Promise<Employee[] | undefined> {
  if (!process.env.CV_PARTNER_API_SECRET) {
    throw new Error("Environment variable CV_PARTNER_API_SECRET is missing");
  }
  const request = await fetch(
    "https://variant.cvpartner.com/api/v2/users/search?size=200&deactivated=false",
    {
      headers: [
        [
          "Authorization",
          `Token token="${process.env.CV_PARTNER_API_SECRET || ""}"`,
        ],
      ],
    }
  );

  if (!request.ok) {
    throw new Error(request.statusText);
  }
  const employeesJSON = (await request.json()) as CVPartnerEmployeeDto[];

  const isStarted = (employee: CVPartnerEmployeeDto) =>
    employeeStartDates[employee.email] &&
    isBefore(employeeStartDates[employee.email], new Date());

  const employeeList = employeesJSON.filter(
    (employee) => !employee.deactivated && isStarted(employee)
  );

  return await Promise.all<Employee>(
    employeeList.map(toAnonymizedTelephones).map(toEmployeeWithImage)
  );
}

async function toEmployeeWithImage(
  employee: CVPartnerEmployeeWithOptionalTelephoneDto
): Promise<Employee> {
  const imageUrl = await handleImage({
    name: employee.name,
    imageUrl: employee.image.large.url,
  });

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
    imageUrl,
    defaultCvId: employee.default_cv_id,
    userId: employee.user_id,
  };
}

type CVPartnerEmployeeWithOptionalTelephoneDto = Omit<
  CVPartnerEmployeeDto,
  "telephone"
> & { telephone: string | null };
function toAnonymizedTelephones(
  employee: CVPartnerEmployeeDto
): CVPartnerEmployeeWithOptionalTelephoneDto {
  if (getFilteredUserIds().includes(employee.user_id)) {
    return {
      ...employee,
      telephone: null,
    };
  }
  return employee;
}

function getFilteredUserIds(): string[] {
  try {
    return JSON.parse(process.env.FILTER_USERS ?? "[]") ?? [];
  } catch (e) {
    return [];
  }
}
