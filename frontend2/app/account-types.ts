export type AccountRole = "candidate" | "recruiter";

export type AuthenticatedUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export type AccountProfile = {
  userId: string;
  email: string;
  displayName: string;
  role: AccountRole;
  professionalTitle: string;
  experienceYears: number;
  location: string;
  githubUsername: string;
  createdAt: number;
  updatedAt: number;
};

export type SessionResponse = {
  authenticated: boolean;
  user: AuthenticatedUser | null;
  profile: AccountProfile | null;
  error?: string;
};
