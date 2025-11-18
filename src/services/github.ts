import { Octokit } from '@octokit/rest';

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
  state: string;
  user: {
    login: string;
  };
}

export interface CreatePROptions {
  title: string;
  body: string;
  head: string;
  base: string;
  draft?: boolean;
}

export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  async getIssue(issueNumber: number): Promise<GitHubIssue> {
    const { data } = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber
    });

    return {
      number: data.number,
      title: data.title,
      body: data.body || '',
      labels: data.labels.map(l => typeof l === 'string' ? l : l.name || ''),
      state: data.state,
      user: {
        login: data.user?.login || 'unknown'
      }
    };
  }

  async addComment(issueNumber: number, comment: string): Promise<void> {
    await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body: comment
    });
  }

  async addLabel(issueNumber: number, label: string): Promise<void> {
    await this.octokit.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      labels: [label]
    });
  }

  async removeLabel(issueNumber: number, label: string): Promise<void> {
    try {
      await this.octokit.issues.removeLabel({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        name: label
      });
    } catch (error) {
      // Label might not exist, ignore
    }
  }

  async createBranch(branchName: string, baseBranch: string = 'main'): Promise<void> {
    // Get the base branch reference
    const { data: baseRef } = await this.octokit.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${baseBranch}`
    });

    // Create new branch
    await this.octokit.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${branchName}`,
      sha: baseRef.object.sha
    });
  }

  async createPullRequest(options: CreatePROptions): Promise<number> {
    const { data } = await this.octokit.pulls.create({
      owner: this.owner,
      repo: this.repo,
      title: options.title,
      body: options.body,
      head: options.head,
      base: options.base,
      draft: options.draft
    });

    return data.number;
  }

  async requestReview(prNumber: number, reviewers: string[]): Promise<void> {
    await this.octokit.pulls.requestReviewers({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      reviewers
    });
  }

  async getFileContent(path: string, ref?: string): Promise<string> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref
      });

      if ('content' in data && data.type === 'file') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      
      throw new Error(`Path ${path} is not a file`);
    } catch (error) {
      console.error(`Error reading file ${path}:`, error);
      return '';
    }
  }

  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    branch: string
  ): Promise<void> {
    try {
      // Try to get existing file
      const { data: existingFile } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: branch
      });

      // Update existing file
      if ('sha' in existingFile) {
        await this.octokit.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path,
          message,
          content: Buffer.from(content).toString('base64'),
          branch,
          sha: existingFile.sha
        });
      }
    } catch (error: any) {
      if (error.status === 404) {
        // Create new file
        await this.octokit.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path,
          message,
          content: Buffer.from(content).toString('base64'),
          branch
        });
      } else {
        throw error;
      }
    }
  }

  async applyArtifactsAndPush(
    artifacts: { files: Array<{ path: string; content: string; message?: string }>; commitMessage?: string },
    branch: string
  ): Promise<void> {
    if (!artifacts?.files?.length) {
      throw new Error('No artifacts to apply');
    }

    for (const file of artifacts.files) {
      await this.createOrUpdateFile(
        file.path,
        file.content,
        file.message || artifacts.commitMessage || 'chore: apply pipeline artifacts',
        branch
      );
    }
  }

  async listADRFiles(): Promise<string[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: 'docs/adr'
      });

      if (Array.isArray(data)) {
        return data
          .filter(file => file.name.endsWith('.md'))
          .map(file => file.name);
      }
    } catch (error) {
      console.error('Error listing ADR files:', error);
    }
    
    return [];
  }

  async compareBranches(base: string, head: string): Promise<{ totalCommits: number }> {
    try {
      const { data } = await this.octokit.repos.compareCommits({
        owner: this.owner,
        repo: this.repo,
        base,
        head
      });
      
      return { totalCommits: data.total_commits || 0 };
    } catch (error: any) {
      if (error.status === 404) {
        return { totalCommits: 0 };
      }
      throw error;
    }
  }

  async getComments(issueNumber: number): Promise<Array<{ id: number; body: string }>> {
    const { data } = await this.octokit.issues.listComments({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber
    });
    
    return data.map(comment => ({
      id: comment.id,
      body: comment.body || ''
    }));
  }

  async updateComment(commentId: number, body: string): Promise<void> {
    await this.octokit.issues.updateComment({
      owner: this.owner,
      repo: this.repo,
      comment_id: commentId,
      body
    });
  }
}
