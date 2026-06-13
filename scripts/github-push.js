// scripts/github-push.js
import { exec } from "child_process";
import { promisify } from "util";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const execAsync = promisify(exec);

async function pushToGitHub() {
  const token = process.env.GITHUB_TOKEN;
  let repoName = process.env.GITHUB_REPO; // e.g., "username/repo"

  if (!token || !repoName) {
    console.log("[GitHub Auto-Push] Skipped: GITHUB_TOKEN or GITHUB_REPO not defined in .env");
    return;
  }

  // Clean up repoName if user entered a full URL
  if (repoName.includes("github.com/")) {
    repoName = repoName.split("github.com/")[1];
  }
  repoName = repoName.replace(/\.git$/, "");

  try {
    console.log(`[GitHub Auto-Push] Starting auto-push to ${repoName}...`);

    // Ensure git is initialized
    if (!fs.existsSync(".git")) {
      console.log("[GitHub Auto-Push] Initializing new git repository...");
      await execAsync(`git init`);
      await execAsync(`git checkout -b main`);
    }

    await execAsync(`git config --global user.name "AI Studio Agent" || true`);
    await execAsync(`git config --global user.email "agent@aistudio.google.com" || true`);
    await execAsync(`git add .`);

    const { stdout: status } = await execAsync(`git status --porcelain`);
    if (!status.trim()) {
      console.log("[GitHub Auto-Push] No new changes to commit.");
      // Push anyway in case there are diverging branches but usually we just exit
    } else {
      const msg = `Auto-commit from AI Studio build - ${new Date().toISOString()}`;
      await execAsync(`git commit -m "${msg}"`);
      console.log("[GitHub Auto-Push] Committed changes.");
    }

    // Set remote if needed or just push directly to the remote URL
    const remoteUrl = `https://oauth2:${token}@github.com/${repoName}.git`;
    
    // Always good to know what branch we are on
    const { stdout: branchOut } = await execAsync(`git branch --show-current`);
    const currentBranch = branchOut.trim() || 'main';

    console.log(`[GitHub Auto-Push] Pushing to branch: ${currentBranch}`);
    // We add --force to ensure the template overwrites everything in the new repo
    await execAsync(`git push --force "${remoteUrl}" HEAD:${currentBranch}`);

    console.log(`[GitHub Auto-Push] Successfully pushed to ${repoName}!`);
  } catch (error) {
    // Hide token from logs
    let errMsg = error.message || String(error);
    if (token) {
      errMsg = errMsg.split(token).join("[HIDDEN_TOKEN]");
    }
    console.error("[GitHub Auto-Push] Error during push:", errMsg);
  }
}

pushToGitHub();
