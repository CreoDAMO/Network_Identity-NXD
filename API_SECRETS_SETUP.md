# Vercel Deployment Integration Setup

## Required Environment Variables

To use the Vercel deployment automation features, you'll need to set up the following environment variables:

### 1. Vercel API Token
- **Variable Name:** `VERCEL_TOKEN`
- **Description:** Your Vercel personal access token
- **How to get it:**
  1. Go to https://vercel.com/account/tokens
  2. Create a new token with appropriate scopes
  3. Copy the token value

### 2. Vercel Team ID (Optional)
- **Variable Name:** `VERCEL_TEAM_ID`
- **Description:** Your Vercel team ID if deploying to a team account
- **How to get it:**
  1. Go to your team settings in Vercel dashboard
  2. Copy the Team ID from the team settings page

### 3. GitHub Repository Configuration
Update the repository configuration in the deployment service to match your actual repository:
- Edit `server/services/vercel-deployment.ts`
- Update the `repo` field in the `createDeployment` method

## Features Available

Once configured, you'll have access to:

1. **Project Management**
   - Create and manage Vercel projects
   - View project details and settings

2. **Deployment Automation**
   - Trigger deployments from admin panel
   - Monitor deployment status in real-time
   - View deployment history and logs

3. **Domain Management**
   - Add custom domains to projects
   - Manage domain configurations
   - SSL certificate management

4. **Environment Variables**
   - Manage environment variables per project
   - Support for different targets (production, preview, development)
   - Secure variable storage

5. **Team Collaboration**
   - Team member management
   - Access control and permissions

## Usage

1. Access the deployment interface at `/deployment` (admin access required)
2. Configure your projects and environment variables
3. Deploy with one-click from the admin panel
4. Monitor deployment status and logs

## Security Notes

- Vercel tokens provide full access to your account - store them securely
- Use team-specific tokens when working with team accounts
- Regularly rotate access tokens for enhanced security
- Environment variables are encrypted in Vercel's infrastructure