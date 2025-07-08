import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Rocket,
  Settings,
  Globe,
  Activity,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface Deployment {
  id: string;
  url: string;
  readyState: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  createdAt: string;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
  };
}

interface Project {
  id: string;
  name: string;
  framework: string;
  createdAt: string;
  updatedAt: string;
}

interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  target: string[];
  configurationId?: string;
}

export function DeploymentAutomation() {
  const [projectId, setProjectId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRepo, setNewProjectRepo] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [newEnvTarget, setNewEnvTarget] = useState<'production' | 'preview' | 'development'>('production');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch deployments
  const { data: deploymentsData, isLoading: deploymentsLoading } = useQuery({
    queryKey: ['/api/vercel/deployments', projectId],
    enabled: !!projectId,
  });

  // Fetch projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/vercel/projects'],
  });

  // Fetch project details
  const { data: projectData } = useQuery({
    queryKey: ['/api/vercel/project', projectId],
    enabled: !!projectId,
  });

  // Fetch environment variables
  const { data: envVarsData } = useQuery({
    queryKey: ['/api/vercel/env-vars', projectId],
    enabled: !!projectId,
  });

  // Create deployment mutation
  const deployMutation = useMutation({
    mutationFn: async (deploymentConfig: any) => {
      const response = await fetch('/api/vercel/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...deploymentConfig,
        }),
      });
      if (!response.ok) throw new Error('Deployment failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Deployment Started',
        description: 'Your deployment is now building...',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vercel/deployments'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Deployment Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectConfig: any) => {
      const response = await fetch('/api/vercel/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectConfig),
      });
      if (!response.ok) throw new Error('Project creation failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Project Created',
        description: `Project ${data.project.name} created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vercel/projects'] });
      setNewProjectName('');
      setNewProjectRepo('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Project Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Add domain mutation
  const addDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      const response = await fetch('/api/vercel/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, domain }),
      });
      if (!response.ok) throw new Error('Domain addition failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Domain Added',
        description: 'Domain has been added to the project',
      });
      setNewDomain('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Domain Addition Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Add environment variable mutation
  const addEnvVarMutation = useMutation({
    mutationFn: async (envVar: any) => {
      const response = await fetch('/api/vercel/env-vars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...envVar,
        }),
      });
      if (!response.ok) throw new Error('Environment variable creation failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Environment Variable Added',
        description: 'Environment variable has been created',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vercel/env-vars'] });
      setNewEnvKey('');
      setNewEnvValue('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Environment Variable Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'READY':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'BUILDING':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'CANCELED':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'READY' ? 'default' : 
                   status === 'BUILDING' ? 'secondary' : 
                   status === 'ERROR' ? 'destructive' : 'outline';
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Deployment Automation</h2>
          <p className="text-white/60">Manage Vercel deployments and project settings</p>
        </div>
        <Button
          onClick={() => deployMutation.mutate({
            name: 'nxd-platform',
            branch: 'main',
            target: 'production'
          })}
          disabled={!projectId || deployMutation.isPending}
          className="bg-gradient-to-r from-purple-500 to-blue-500"
        >
          {deployMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Rocket className="w-4 h-4 mr-2" />
          )}
          Deploy Now
        </Button>
      </div>

      <Tabs defaultValue="deployments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="deployments" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Deployments
              </CardTitle>
              <CardDescription className="text-white/60">
                Monitor your deployment status and history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <Label htmlFor="project-select" className="text-white">Select Project</Label>
                <select
                  id="project-select"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  <option value="">Select a project...</option>
                  {projectsData?.projects?.map((project: Project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {deploymentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              ) : (
                <div className="space-y-3">
                  {deploymentsData?.deployments?.map((deployment: Deployment) => (
                    <div
                      key={deployment.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusBadge(deployment.readyState)}
                        <div>
                          <p className="text-white font-medium">{deployment.url}</p>
                          <p className="text-white/60 text-sm">
                            {deployment.meta?.githubCommitMessage || 'No commit message'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-sm">
                          {new Date(deployment.createdAt).toLocaleString()}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://${deployment.url}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Project Management
              </CardTitle>
              <CardDescription className="text-white/60">
                Create and manage your Vercel projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name" className="text-white">Project Name</Label>
                  <Input
                    id="project-name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="my-nxd-app"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-repo" className="text-white">GitHub Repository</Label>
                  <Input
                    id="project-repo"
                    value={newProjectRepo}
                    onChange={(e) => setNewProjectRepo(e.target.value)}
                    placeholder="username/repository"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={() => createProjectMutation.mutate({
                  name: newProjectName,
                  repo: newProjectRepo,
                })}
                disabled={!newProjectName || !newProjectRepo || createProjectMutation.isPending}
                className="w-full"
              >
                {createProjectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Project
              </Button>

              <div className="space-y-3">
                {projectsData?.projects?.map((project: Project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div>
                      <p className="text-white font-medium">{project.name}</p>
                      <p className="text-white/60 text-sm">Framework: {project.framework}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProjectId(project.id)}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Domain Management
              </CardTitle>
              <CardDescription className="text-white/60">
                Add custom domains to your projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="bg-white/10 border-white/20 text-white"
                />
                <Button
                  onClick={() => addDomainMutation.mutate(newDomain)}
                  disabled={!newDomain || !projectId || addDomainMutation.isPending}
                >
                  {addDomainMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {projectData?.project?.alias?.map((domain: string) => (
                <div
                  key={domain}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <span className="text-white">{domain}</span>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Environment Variables
              </CardTitle>
              <CardDescription className="text-white/60">
                Manage your project's environment variables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="env-key" className="text-white">Key</Label>
                  <Input
                    id="env-key"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value)}
                    placeholder="API_KEY"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="env-value" className="text-white">Value</Label>
                  <Input
                    id="env-value"
                    type="password"
                    value={newEnvValue}
                    onChange={(e) => setNewEnvValue(e.target.value)}
                    placeholder="your-secret-value"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="env-target" className="text-white">Target</Label>
                  <select
                    id="env-target"
                    value={newEnvTarget}
                    onChange={(e) => setNewEnvTarget(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  >
                    <option value="production">Production</option>
                    <option value="preview">Preview</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={() => addEnvVarMutation.mutate({
                  key: newEnvKey,
                  value: newEnvValue,
                  target: newEnvTarget,
                })}
                disabled={!newEnvKey || !newEnvValue || !projectId || addEnvVarMutation.isPending}
                className="w-full"
              >
                {addEnvVarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Environment Variable
              </Button>

              <div className="space-y-3">
                {envVarsData?.environmentVariables?.map((envVar: EnvironmentVariable) => (
                  <div
                    key={envVar.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div>
                      <p className="text-white font-medium">{envVar.key}</p>
                      <p className="text-white/60 text-sm">
                        Targets: {envVar.target.join(', ')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}