export interface TeamProfilePayload {
  role?: string;
  permission_group?: string | null;
  employment_type?: string | null;
  is_system_admin?: number | boolean | null;
  status?: string;
  name?: string;
  phone?: string | null;
  personal_email?: string | null;
  company_email?: string | null;
  personal_email_summary_enabled?: number | boolean | null;
  position_applied_for?: string | null;
  job_title?: string | null;
  department?: string | null;
  start_date?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

export interface TeamSessionPayload {
  userId: string;
  email: string;
  personalEmail?: string | null;
  preferredEmail?: string | null;
  name?: string;
  globalRole?: string;
  services?: { cloud: string | null; team: string | null };
  teamProfile?: TeamProfilePayload | null;
}

export interface EmbeddedTeamUser {
  id: string;
  email: string;
  personal_email?: string | null;
  name: string;
  globalRole: string;
  services: { cloud: string | null; team: string | null };
  role: "employee" | "contractor" | "admin";
  employment_type: "employee" | "contractor";
  is_system_admin: boolean;
  status: string;
  position_applied_for?: string | null;
  job_title: string | null;
  department: string | null;
  company_email?: string | null;
  personal_email_summary_enabled?: boolean;
  phone?: string | null;
  start_date?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

export function mapTeamSessionToUser(
  data: TeamSessionPayload,
): EmbeddedTeamUser {
  const services = data.services;
  const teamRole = services?.team;
  const profile = data.teamProfile || undefined;

  const isSystemAdmin =
    Boolean(profile?.is_system_admin) || teamRole === "system_admin";
  const permissionGroup =
    profile?.permission_group === "admin" ||
    (profile?.role === "admin" && !profile?.permission_group) ||
    teamRole === "admin"
      ? "admin"
      : profile?.permission_group === "contractor" ||
          (profile?.role === "contractor" && !profile?.permission_group) ||
          teamRole === "contractor"
        ? "contractor"
        : "employee";
  const employmentType =
    profile?.employment_type === "contractor" ? "contractor" : "employee";
  const personalEmail =
    profile?.personal_email || data.personalEmail || data.email;
  const companyEmail = profile?.company_email || data.preferredEmail || null;

  return {
    id: data.userId,
    email: companyEmail || personalEmail,
    personal_email: personalEmail,
    name: profile?.name || data.name || "",
    globalRole: data.globalRole || "user",
    services: services || { cloud: null, team: null },
    role: permissionGroup,
    employment_type: employmentType,
    is_system_admin: isSystemAdmin,
    status: profile?.status || "active",
    position_applied_for: profile?.position_applied_for || null,
    job_title: profile?.job_title || null,
    department: profile?.department || null,
    company_email: companyEmail,
    personal_email_summary_enabled: Boolean(
      profile?.personal_email_summary_enabled,
    ),
    phone: profile?.phone || null,
    start_date: profile?.start_date,
    avatar_url: profile?.avatar_url,
    created_at: profile?.created_at,
  };
}
