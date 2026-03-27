import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const org = process.env.GITHUB_ORG || "Shiryu-Studios-LLC";
const sdkPackageName = process.env.SDK_PACKAGE_NAME || "@shiryustudios/team-app-sdk";
const sdkVersion = process.env.SDK_VERSION?.replace(/^v/, "");
const githubToken = process.env.APPS_REPO_TOKEN;

if (!sdkVersion) {
  throw new Error("SDK_VERSION is required.");
}

if (!githubToken) {
  throw new Error("APPS_REPO_TOKEN is required.");
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    stdio: "pipe",
    encoding: "utf8",
    ...options,
  }).trim();
}

function runNpm(args, options = {}) {
  if (process.platform === "win32") {
    return run("cmd.exe", ["/c", "npm", ...args], options);
  }

  return run("npm", args, options);
}

async function listAppRepos() {
  const response = await fetch(`https://api.github.com/orgs/${org}/repos?per_page=100`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "shiryu-team-app-sdk-sync",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list org repos: ${response.status} ${response.statusText}`);
  }

  const repos = await response.json();
  return repos
    .filter((repo) => repo.name.startsWith("Shiryu.Team.Apps."))
    .map((repo) => ({
      name: repo.name,
      cloneUrl: `https://x-access-token:${githubToken}@github.com/${repo.full_name}.git`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function repoUsesSdk(repoDir) {
  const packageJsonPath = path.join(repoDir, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const deps = packageJson.dependencies || {};
  const devDeps = packageJson.devDependencies || {};
  return sdkPackageName in deps || sdkPackageName in devDeps;
}

function updateRepo(repo) {
  const cloneRoot = mkdtempSync(path.join(tmpdir(), "shiryu-app-sdk-"));
  const repoDir = path.join(cloneRoot, repo.name);

  try {
    console.log(`Cloning ${repo.name}`);
    run("git", ["clone", "--depth", "1", repo.cloneUrl, repoDir]);

    if (!repoUsesSdk(repoDir)) {
      console.log(`Skipping ${repo.name}: SDK not in package.json`);
      return { repo: repo.name, updated: false, reason: "no-sdk" };
    }

    console.log(`Updating ${repo.name} to ${sdkPackageName}@${sdkVersion}`);
    runNpm(["install", `${sdkPackageName}@${sdkVersion}`], { cwd: repoDir });

    const status = run("git", ["status", "--short"], { cwd: repoDir });
    if (!status) {
      console.log(`No changes for ${repo.name}`);
      return { repo: repo.name, updated: false, reason: "no-change" };
    }

    run("git", ["config", "user.name", "Shiryu Automation"], { cwd: repoDir });
    run("git", ["config", "user.email", "automation@shiryustudios.com"], { cwd: repoDir });
    run("git", ["add", "package.json", "package-lock.json"], { cwd: repoDir });
    run("git", ["commit", "-m", `Update team app sdk to ${sdkVersion}`], { cwd: repoDir });
    run("git", ["push", "origin", "main"], { cwd: repoDir });

    return { repo: repo.name, updated: true };
  } finally {
    rmSync(cloneRoot, { recursive: true, force: true });
  }
}

const repos = await listAppRepos();
const results = [];

for (const repo of repos) {
  try {
    results.push(updateRepo(repo));
  } catch (error) {
    console.error(`Failed updating ${repo.name}:`, error instanceof Error ? error.message : error);
    results.push({ repo: repo.name, updated: false, reason: "error" });
  }
}

const updatedRepos = results.filter((result) => result.updated).map((result) => result.repo);
console.log(`Updated repos: ${updatedRepos.length ? updatedRepos.join(", ") : "none"}`);
