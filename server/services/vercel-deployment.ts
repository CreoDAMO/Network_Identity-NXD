import { Vercel } from '@vercel/sdk';
import { config } from 'dotenv';

config();

/**
 * Vercel Deployment Service
 * Handles automated deployments, domain management, and project operations
 */
export class VercelDeploymentService {
  private vercel?: Vercel;
  private teamId?: string;

  constructor() {
    const vercelToken = process.env.VERCEL_TOKEN;
    
    // Only initialize Vercel client if token is available
    if (vercelToken) {
      this.vercel = new Vercel({
        bearerToken: vercelToken,
      });
    }

    this.teamId = process.env.VERCEL_TEAM_ID;
  }

  private ensureVercelClient(): void {
    if (!this.vercel) {
      throw new Error('VERCEL_TOKEN environment variable is required for deployment operations. Please configure it in your environment.');
    }
  }

  /**
   * Create a new deployment
   */
  async createDeployment(projectId: string, deploymentConfig: any) {
    this.ensureVercelClient();
    try {
      const deployment = await this.vercel!.deployments.create({
        name: deploymentConfig.name || 'nxd-platform',
        gitSource: {
          type: 'github',
          repo: deploymentConfig.repo,
          ref: deploymentConfig.branch || 'main',
        },
        projectSettings: {
          framework: 'vite',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
          installCommand: 'npm install',
        },
        env: deploymentConfig.env || {},
        teamId: this.teamId,
        target: deploymentConfig.target || 'production',
      });

      return {
        success: true,
        deployment,
        url: `https://${deployment.url}`,
        inspectorUrl: deployment.inspectorUrl,
      };
    } catch (error) {
      console.error('Deployment creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string) {
    this.ensureVercelClient();
    try {
      const deployment = await this.vercel!.deployments.get({
        idOrUrl: deploymentId,
        teamId: this.teamId,
      });

      return {
        success: true,
        status: deployment.readyState,
        url: deployment.url,
        createdAt: deployment.createdAt,
        error: deployment.errorMessage,
      };
    } catch (error) {
      console.error('Failed to get deployment status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all deployments for a project
   */
  async listDeployments(projectId?: string, limit = 20) {
    this.ensureVercelClient();
    try {
      const params: any = {
        limit,
        teamId: this.teamId,
      };

      if (projectId) {
        params.projectId = projectId;
      }

      const response = await this.vercel!.deployments.list(params);

      return {
        success: true,
        deployments: response.deployments,
        pagination: response.pagination,
      };
    } catch (error) {
      console.error('Failed to list deployments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Cancel a deployment
   */
  async cancelDeployment(deploymentId: string) {
    this.ensureVercelClient();
    try {
      await this.vercel!.deployments.cancel({
        id: deploymentId,
        teamId: this.teamId,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to cancel deployment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create or update a project
   */
  async createProject(projectConfig: any) {
    this.ensureVercelClient();
    try {
      const project = await this.vercel!.projects.create({
        name: projectConfig.name,
        framework: 'vite',
        gitRepository: {
          repo: projectConfig.repo,
          type: 'github',
        },
        buildCommand: 'npm run build',
        outputDirectory: 'dist',
        installCommand: 'npm install',
        devCommand: 'npm run dev',
        environmentVariables: projectConfig.env || [],
        teamId: this.teamId,
      });

      return {
        success: true,
        project,
      };
    } catch (error) {
      console.error('Failed to create project:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get project details
   */
  async getProject(projectId: string) {
    this.ensureVercelClient();
    try {
      const project = await this.vercel!.projects.get({
        idOrName: projectId,
        teamId: this.teamId,
      });

      return {
        success: true,
        project,
      };
    } catch (error) {
      console.error('Failed to get project:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update project settings
   */
  async updateProject(projectId: string, updates: any) {
    this.ensureVercelClient();
    try {
      const project = await this.vercel!.projects.update({
        idOrName: projectId,
        teamId: this.teamId,
        ...updates,
      });

      return {
        success: true,
        project,
      };
    } catch (error) {
      console.error('Failed to update project:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add custom domain to project
   */
  async addDomain(projectId: string, domain: string) {
    this.ensureVercelClient();
    try {
      const domainResult = await this.vercel!.domains.create({
        name: domain,
        teamId: this.teamId,
      });

      // Add domain to project
      await this.vercel!.projects.createProjectDomain({
        idOrName: projectId,
        domain,
        teamId: this.teamId,
      });

      return {
        success: true,
        domain: domainResult,
      };
    } catch (error) {
      console.error('Failed to add domain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Remove domain from project
   */
  async removeDomain(projectId: string, domain: string) {
    this.ensureVercelClient();
    try {
      await this.vercel!.projects.removeProjectDomain({
        idOrName: projectId,
        domain,
        teamId: this.teamId,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to remove domain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(deploymentId: string) {
    this.ensureVercelClient();
    try {
      // Note: This would require additional setup for streaming logs
      // For now, we'll return the deployment details
      const deployment = await this.getDeploymentStatus(deploymentId);
      
      return {
        success: true,
        logs: [],
        deployment: deployment,
      };
    } catch (error) {
      console.error('Failed to get deployment logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get team information
   */
  async getTeamInfo() {
    this.ensureVercelClient();
    try {
      if (!this.teamId) {
        return {
          success: false,
          error: 'No team ID configured',
        };
      }

      const team = await this.vercel!.teams.get({
        idOrSlug: this.teamId,
      });

      return {
        success: true,
        team,
      };
    } catch (error) {
      console.error('Failed to get team info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get environment variables for a project
   */
  async getEnvironmentVariables(projectId: string) {
    this.ensureVercelClient();
    try {
      const envs = await this.vercel!.projects.getProjectEnvs({
        idOrName: projectId,
        teamId: this.teamId,
      });

      return {
        success: true,
        environmentVariables: envs,
      };
    } catch (error) {
      console.error('Failed to get environment variables:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create or update environment variable
   */
  async upsertEnvironmentVariable(
    projectId: string,
    key: string,
    value: string,
    target: 'production' | 'preview' | 'development' = 'production'
  ) {
    this.ensureVercelClient();
    try {
      const envVar = await this.vercel!.projects.createProjectEnv({
        idOrName: projectId,
        key,
        value,
        target: [target],
        type: 'encrypted',
        teamId: this.teamId,
      });

      return {
        success: true,
        environmentVariable: envVar,
      };
    } catch (error) {
      console.error('Failed to create environment variable:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const vercelDeploymentService = new VercelDeploymentService();