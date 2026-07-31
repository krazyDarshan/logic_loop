import type { CandidateBase } from "./talent-engine";

const clamp = (value: number) => Math.round(Math.min(100, Math.max(0, value)));

export async function extractFileText(file: File): Promise<string> {
  if (file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 20); pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
    }
    return pages.join("\n");
  }
  return file.text();
}

type GithubUserResponse = { name?: string | null; login: string };
type GithubRepoResponse = {
  fork: boolean;
  language?: string | null;
  full_name: string;
  pushed_at?: string | null;
  description?: string | null;
  stargazers_count: number;
};
type GithubEventResponse = { type: string; payload?: { size?: number } };
type GithubContentResponse = { name: string };

export async function fetchGithubEvidence(
  username: string,
): Promise<{ name?: string; github: CandidateBase["github"] }> {
  const headers = { Accept: "application/vnd.github+json" };
  const [userResponse, reposResponse, eventsResponse] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers }),
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`, { headers }),
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`, { headers }),
  ]);
  if (!userResponse.ok || !reposResponse.ok) {
    throw new Error(
      userResponse.status === 404
        ? "GitHub profile not found."
        : "GitHub rate limit reached. Try again later.",
    );
  }

  const user = (await userResponse.json()) as GithubUserResponse;
  const repos = (await reposResponse.json()) as GithubRepoResponse[];
  const events = eventsResponse.ok ? ((await eventsResponse.json()) as GithubEventResponse[]) : [];
  const originalRepos = repos.filter((repo) => !repo.fork);
  const languageCounts = new Map<string, number>();
  originalRepos.forEach((repo) => {
    if (repo.language) languageCounts.set(repo.language, (languageCounts.get(repo.language) || 0) + 1);
  });
  const languages = [...languageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);
  const topRepos = originalRepos.slice(0, 5);
  const contentResults = await Promise.allSettled(
    topRepos.map((repo) =>
      fetch(`https://api.github.com/repos/${repo.full_name}/contents`, { headers }).then(async (response) =>
        response.ok ? ((await response.json()) as GithubContentResponse[]) : [],
      ),
    ),
  );
  let testSignals = 0;
  let readmeSignals = 0;
  contentResults.forEach((result) => {
    if (result.status !== "fulfilled" || !Array.isArray(result.value)) return;
    const names = result.value.map((item) => String(item.name).toLowerCase());
    if (names.some((name) => /test|spec|pytest|__tests__|\.github/.test(name))) testSignals += 1;
    if (names.some((name) => /^readme/.test(name))) readmeSignals += 1;
  });
  const pushes = events.filter((event) => event.type === "PushEvent");
  const commits = pushes.reduce((sum, event) => sum + Number(event.payload?.size || 0), 0);
  const pullRequests = events.filter((event) => event.type === "PullRequestEvent").length;
  const activeMonths = new Set(
    originalRepos.map((repo) => String(repo.pushed_at || "").slice(0, 7)).filter(Boolean),
  ).size;
  const descriptionRatio = originalRepos.length
    ? originalRepos.filter((repo) => repo.description).length / originalRepos.length
    : 0;

  return {
    name: user.name || user.login,
    github: {
      username: user.login,
      repos: originalRepos.length,
      stars: originalRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      commits: Math.max(commits, originalRepos.length * 6),
      pullRequests: Math.max(pullRequests, Math.round(originalRepos.length * 0.8)),
      activeWeeks: Math.min(44, Math.max(activeMonths * 4, originalRepos.length * 2)),
      languages,
      tests: clamp(48 + (testSignals / Math.max(topRepos.length, 1)) * 48),
      documentation: clamp(45 + descriptionRatio * 28 + (readmeSignals / Math.max(topRepos.length, 1)) * 25),
      originality: clamp(70 + (originalRepos.length / Math.max(repos.length, 1)) * 28),
    },
  };
}
