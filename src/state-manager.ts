import { PipelineState } from './orchestrator.js';
import { GitHubService } from './services/github.js';

const STATE_COMMENT_MARKER = '<!-- PIPELINE_STATE_V1 -->';

export class PipelineStateManager {
  constructor(private github: GitHubService) {}

  async savePipelineState(issueNumber: number, state: PipelineState): Promise<void> {
    const stateJson = JSON.stringify(state, null, 2);
    const comment = `${STATE_COMMENT_MARKER}\n\`\`\`json\n${stateJson}\n\`\`\``;
    
    // Try to update existing state comment
    const existingComment = await this.findStateComment(issueNumber);
    if (existingComment) {
      await this.github.updateComment(existingComment.id, comment);
    } else {
      await this.github.addComment(issueNumber, comment);
    }
  }

  async loadPipelineState(issueNumber: number): Promise<PipelineState | null> {
    const comment = await this.findStateComment(issueNumber);
    if (!comment) {
      return null;
    }

    const jsonMatch = comment.body.match(/```json\n([\s\S]+?)\n```/);
    if (!jsonMatch) {
      return null;
    }

    try {
      const state = JSON.parse(jsonMatch[1]);
      // Restore Date objects
      state.createdAt = new Date(state.createdAt);
      state.updatedAt = new Date(state.updatedAt);
      state.stages.forEach((stage: any) => {
        if (stage.startedAt) stage.startedAt = new Date(stage.startedAt);
        if (stage.completedAt) stage.completedAt = new Date(stage.completedAt);
      });
      return state;
    } catch (error) {
      console.error('Error parsing pipeline state:', error);
      return null;
    }
  }

  private async findStateComment(issueNumber: number): Promise<any> {
    const comments = await this.github.getComments(issueNumber);
    return comments.find(c => c.body.includes(STATE_COMMENT_MARKER));
  }
}
