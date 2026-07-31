import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

type AccountRole = "candidate" | "recruiter";

type StoredProfile = {
  user_id: string;
  email: string;
  display_name: string;
  role: AccountRole;
  professional_title: string;
  experience_years: number;
  location: string;
  github_username: string;
  created_at: number;
  updated_at: number;
};

const profileTableSql = `
  CREATE TABLE IF NOT EXISTS account_profiles (
    user_id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter')),
    professional_title TEXT NOT NULL DEFAULT '',
    experience_years INTEGER NOT NULL DEFAULT 0,
    location TEXT NOT NULL DEFAULT '',
    github_username TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`;

const emailIndexSql = `
  CREATE INDEX IF NOT EXISTS idx_account_profiles_email
  ON account_profiles(email)
`;

async function ensureProfileStorage() {
  if (!env.DB) throw new Error("Profile storage is unavailable.");
  await env.DB.batch([
    env.DB.prepare(profileTableSql),
    env.DB.prepare(emailIndexSql),
  ]);
}

function serializeProfile(row: StoredProfile | null) {
  if (!row) return null;
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    professionalTitle: row.professional_title,
    experienceYears: row.experience_years,
    location: row.location,
    githubUsername: row.github_username,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ authenticated: false, user: null, profile: null });

  try {
    await ensureProfileStorage();
    const row = await env.DB.prepare(
      "SELECT * FROM account_profiles WHERE user_id = ? LIMIT 1",
    ).bind(user.userId).first<StoredProfile>();

    return Response.json({ authenticated: true, user, profile: serializeProfile(row) });
  } catch (error) {
    return Response.json(
      {
        authenticated: true,
        user,
        profile: null,
        error: error instanceof Error ? error.message : "Profile storage failed.",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in is required." }, { status: 401 });

  const body = (await request.json()) as {
    displayName?: string;
    role?: string;
    professionalTitle?: string;
    experienceYears?: number;
    location?: string;
    githubUsername?: string;
  };

  const displayName = body.displayName?.trim().slice(0, 80) || user.displayName;
  const role = body.role === "candidate" || body.role === "recruiter" ? body.role : null;
  const professionalTitle = body.professionalTitle?.trim().slice(0, 100) || "";
  const experienceYears = Math.max(0, Math.min(50, Math.round(Number(body.experienceYears) || 0)));
  const location = body.location?.trim().slice(0, 80) || "";
  const githubUsername = body.githubUsername?.trim().replace(/^@/, "").slice(0, 39) || "";

  if (!role) return Response.json({ error: "Choose candidate or recruiter." }, { status: 400 });
  if (role === "candidate" && !professionalTitle) {
    return Response.json({ error: "Add your target professional role." }, { status: 400 });
  }

  try {
    await ensureProfileStorage();
    const now = Date.now();
    await env.DB.prepare(`
      INSERT INTO account_profiles (
        user_id, email, display_name, role, professional_title, experience_years,
        location, github_username, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        email = excluded.email,
        display_name = excluded.display_name,
        role = excluded.role,
        professional_title = excluded.professional_title,
        experience_years = excluded.experience_years,
        location = excluded.location,
        github_username = excluded.github_username,
        updated_at = excluded.updated_at
    `).bind(
      user.userId,
      user.email,
      displayName,
      role,
      professionalTitle,
      experienceYears,
      location,
      githubUsername,
      now,
      now,
    ).run();

    const row = await env.DB.prepare(
      "SELECT * FROM account_profiles WHERE user_id = ? LIMIT 1",
    ).bind(user.userId).first<StoredProfile>();

    return Response.json({ authenticated: true, user, profile: serializeProfile(row) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save your profile." },
      { status: 500 },
    );
  }
}
