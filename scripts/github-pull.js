// scripts/github-pull.js
import { exec } from "child_process";
import { promisify } from "util";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const execAsync = promisify(exec);

async function pullFromGitHub() {
  const token = process.env.GITHUB_TOKEN;
  let repoName = process.env.GITHUB_REPO; // e.g., "username/repo"

  if (!token || !repoName) {
    console.log("[GitHub Auto-Pull] Skipped: GITHUB_TOKEN or GITHUB_REPO not defined in .env");
    return;
  }

  if (repoName.includes("github.com/")) {
    repoName = repoName.split("github.com/")[1];
  }
  repoName = repoName.replace(/\.git$/, "");

  try {
    console.log(`[GitHub Auto-Pull] Starting auto-pull from ${repoName}...`);

    if (!fs.existsSync(".git")) {
      console.log("[GitHub Auto-Pull] Repository not initialized. Initializing...");
      await execAsync(`git init`);
      await execAsync(`git checkout -b main`);
    }

    const remoteUrl = `https://oauth2:${token}@github.com/${repoName}.git`;
    
    // Add remote if it doesn't exist, or set its URL
    try {
      await execAsync(`git remote add origin "${remoteUrl}"`);
    } catch {
      await execAsync(`git remote set-url origin "${remoteUrl}"`);
    }

    // Unshallow if needed, but usually just fetch
    await execAsync(`git fetch origin main`);
    
    // Hard reset to origin main or pull with rebase
    // We will pull and rebase to merge external changes cleanly
    console.log("[GitHub Auto-Pull] Pulling latest changes...");
    await execAsync(`git pull origin main --rebase`);

    console.log(`[GitHub Auto-Pull] Successfully synced with ${repoName}!`);
  } catch (error) {
    let errMsg = error.message || String(error);
    if (token) {
      errMsg = errMsg.split(token).join("[HIDDEN_TOKEN]");
    }
    console.error("[GitHub Auto-Pull] Error during pull:", errMsg);
  }
}

pullFromGitHub();
