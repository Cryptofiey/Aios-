import { Octokit } from '@octokit/rest';
import { ApiManager } from '../api-manager/ApiManager.js';

export interface GitHubRepoContext {
  owner: string;
  repo: string;
}

export class GitHubManager {
  private octokit: Octokit;
  
  constructor() {
    const apiManager = ApiManager.getInstance();
    let token = apiManager.getKey('github') || process.env.GITHUB_TOKEN;
    
    if (!token) {
      console.warn('[GitHubManager] No GitHub token found in ApiManager or environment variables. API calls may be rate-limited or fail for private repositories.');
    }

    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Получает содержимое файла (Base64 декодированное)
   */
  public async getFileContent(context: GitHubRepoContext, path: string, ref?: string): Promise<string> {
    try {
      const response = await this.octokit.repos.getContent({
        owner: context.owner,
        repo: context.repo,
        path,
        ref
      });

      if (Array.isArray(response.data)) {
        throw new Error(`[GitHubManager] Path ${path} is a directory, not a file.`);
      }

      if (response.data.type !== 'file' || !('content' in response.data)) {
        throw new Error(`[GitHubManager] Path ${path} does not point to a valid file with content.`);
      }

      return Buffer.from(response.data.content, 'base64').toString('utf-8');
    } catch (error: any) {
      throw new Error(`[GitHubManager] Error reading file ${path}: ${error.message}`);
    }
  }

  /**
   * Создает или обновляет файл в репозитории
   */
  public async createOrUpdateFile(
    context: GitHubRepoContext, 
    path: string, 
    content: string, 
    message: string, 
    branch?: string
  ): Promise<any> {
    try {
      // Пытаемся получить sha существующего файла
      let sha: string | undefined;
      try {
        const fileData = await this.octokit.repos.getContent({
          owner: context.owner,
          repo: context.repo,
          path,
          ref: branch
        });
        if (!Array.isArray(fileData.data) && 'sha' in fileData.data) {
          sha = fileData.data.sha;
        }
      } catch (e) {
        // Файл не существует, это нормально при создании нового
      }

      const response = await this.octokit.repos.createOrUpdateFileContents({
        owner: context.owner,
        repo: context.repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        sha,
        branch
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`[GitHubManager] Error updating file ${path}: ${error.message}`);
    }
  }

  /**
   * Создает Pull Request
   */
  public async createPullRequest(
    context: GitHubRepoContext,
    title: string,
    head: string,
    base: string,
    body?: string
  ): Promise<any> {
    try {
      const response = await this.octokit.pulls.create({
        owner: context.owner,
        repo: context.repo,
        title,
        head,
        base,
        body
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`[GitHubManager] Error creating PR: ${error.message}`);
    }
  }

  /**
   * Создает Ишью
   */
  public async createIssue(
    context: GitHubRepoContext,
    title: string,
    body?: string
  ): Promise<any> {
    try {
      const response = await this.octokit.issues.create({
        owner: context.owner,
        repo: context.repo,
        title,
        body
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`[GitHubManager] Error creating Issue: ${error.message}`);
    }
  }

  /**
   * Поиск репозиториев
   */
  public async searchRepositories(query: string, perPage: number = 10): Promise<any> {
    try {
      const response = await this.octokit.search.repos({
        q: query,
        per_page: perPage
      });
      return response.data.items;
    } catch (error: any) {
      throw new Error(`[GitHubManager] Error searching repositories: ${error.message}`);
    }
  }
}
