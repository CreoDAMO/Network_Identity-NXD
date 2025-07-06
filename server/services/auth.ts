
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface AdminUser {
  id: string;
  walletAddress: string;
  role: 'founder' | 'white_label';
  permissions: string[];
  lastLogin?: Date;
  sessionId?: string;
}

interface LoginAttempt {
  ip: string;
  timestamp: Date;
  success: boolean;
}

class AdminAuthService {
  private static instance: AdminAuthService;
  private adminUsers: Map<string, AdminUser> = new Map();
  private loginAttempts: Map<string, LoginAttempt[]> = new Map();
  private activeSessions: Map<string, { adminId: string; expiresAt: Date }> = new Map();
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'nxd-admin-secret-2025';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

  // Admin credentials - In production, these would be in a secure database
  private readonly ADMIN_CREDENTIALS = {
    founder: {
      address: "0xCc380FD8bfbdF0c020de64075b86C84c2BB0AE79".toLowerCase(),
      passwordHash: "", // Will be set in constructor
      role: 'founder' as const,
      permissions: ['*'] // Full access
    },
    whiteLabelAdmin1: {
      address: "0x742d35cc6635c0532925a3b8d2b3c37b3fd5f4f3".toLowerCase(),
      passwordHash: "", // Will be set in constructor
      role: 'white_label' as const,
      permissions: ['users:read', 'users:manage', 'whitelabel:*', 'export:users']
    }
  };

  constructor() {
    this.initializeAdmins();
  }

  static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  private async initializeAdmins() {
    // Hash default passwords
    const founderPassword = await bcrypt.hash('NXD_FOUNDER_2025_SECURE!@#', 12);
    const whiteLabelPassword = await bcrypt.hash('NXD_ADMIN_2025_SECURE!@#', 12);

    this.ADMIN_CREDENTIALS.founder.passwordHash = founderPassword;
    this.ADMIN_CREDENTIALS.whiteLabelAdmin1.passwordHash = whiteLabelPassword;

    // Initialize admin users
    this.adminUsers.set(this.ADMIN_CREDENTIALS.founder.address, {
      id: 'founder',
      walletAddress: this.ADMIN_CREDENTIALS.founder.address,
      role: 'founder',
      permissions: this.ADMIN_CREDENTIALS.founder.permissions
    });

    this.adminUsers.set(this.ADMIN_CREDENTIALS.whiteLabelAdmin1.address, {
      id: 'whiteLabelAdmin1',
      walletAddress: this.ADMIN_CREDENTIALS.whiteLabelAdmin1.address,
      role: 'white_label',
      permissions: this.ADMIN_CREDENTIALS.whiteLabelAdmin1.permissions
    });
  }

  async authenticateAdmin(walletAddress: string, password: string, ip: string): Promise<{ success: boolean; token?: string; admin?: AdminUser; error?: string }> {
    const normalizedAddress = walletAddress.toLowerCase();

    // Check for rate limiting
    if (this.isRateLimited(ip)) {
      return { success: false, error: 'Too many login attempts. Please try again later.' };
    }

    // Find admin credentials
    const adminCred = Object.values(this.ADMIN_CREDENTIALS).find(
      cred => cred.address === normalizedAddress
    );

    if (!adminCred) {
      this.recordLoginAttempt(ip, false);
      return { success: false, error: 'Invalid credentials' };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminCred.passwordHash);
    if (!isValidPassword) {
      this.recordLoginAttempt(ip, false);
      return { success: false, error: 'Invalid credentials' };
    }

    // Success - get admin user
    const admin = this.adminUsers.get(normalizedAddress);
    if (!admin) {
      return { success: false, error: 'Admin user not found' };
    }

    // Generate session token
    const sessionId = this.generateSessionId();
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        walletAddress: normalizedAddress, 
        role: admin.role,
        sessionId 
      },
      this.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store session
    this.activeSessions.set(sessionId, {
      adminId: admin.id,
      expiresAt: new Date(Date.now() + this.SESSION_DURATION)
    });

    // Update admin
    admin.lastLogin = new Date();
    admin.sessionId = sessionId;

    this.recordLoginAttempt(ip, true);

    return { success: true, token, admin };
  }

  verifyToken(token: string): { valid: boolean; admin?: AdminUser; error?: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      // Check if session is still active
      const session = this.activeSessions.get(decoded.sessionId);
      if (!session || session.expiresAt < new Date()) {
        this.activeSessions.delete(decoded.sessionId);
        return { valid: false, error: 'Session expired' };
      }

      const admin = this.adminUsers.get(decoded.walletAddress.toLowerCase());
      if (!admin || admin.sessionId !== decoded.sessionId) {
        return { valid: false, error: 'Invalid session' };
      }

      return { valid: true, admin };
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  hasPermission(admin: AdminUser, permission: string): boolean {
    // Founder has all permissions
    if (admin.role === 'founder' || admin.permissions.includes('*')) {
      return true;
    }

    // Check specific permission
    return admin.permissions.some(perm => {
      if (perm.endsWith('*')) {
        const prefix = perm.slice(0, -1);
        return permission.startsWith(prefix);
      }
      return perm === permission;
    });
  }

  revokeSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }

  revokeAllSessions(adminId: string): void {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.adminId === adminId) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  async changePassword(adminId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const admin = Array.from(this.adminUsers.values()).find(a => a.id === adminId);
    if (!admin) {
      return { success: false, error: 'Admin not found' };
    }

    const adminCred = Object.values(this.ADMIN_CREDENTIALS).find(
      cred => cred.address === admin.walletAddress
    );

    if (!adminCred) {
      return { success: false, error: 'Admin credentials not found' };
    }

    // Verify current password
    const isValidCurrent = await bcrypt.compare(currentPassword, adminCred.passwordHash);
    if (!isValidCurrent) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Validate new password strength
    if (!this.isStrongPassword(newPassword)) {
      return { success: false, error: 'Password must be at least 12 characters with uppercase, lowercase, numbers, and special characters' };
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    adminCred.passwordHash = newPasswordHash;

    // Revoke all sessions to force re-login
    this.revokeAllSessions(adminId);

    return { success: true };
  }

  private isStrongPassword(password: string): boolean {
    // At least 12 characters, uppercase, lowercase, number, special char
    const minLength = password.length >= 12;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  }

  private isRateLimited(ip: string): boolean {
    const attempts = this.loginAttempts.get(ip) || [];
    const recentFailures = attempts.filter(
      attempt => 
        !attempt.success && 
        (Date.now() - attempt.timestamp.getTime()) < this.LOCKOUT_DURATION
    );

    return recentFailures.length >= this.MAX_LOGIN_ATTEMPTS;
  }

  private recordLoginAttempt(ip: string, success: boolean): void {
    const attempts = this.loginAttempts.get(ip) || [];
    attempts.push({ ip, timestamp: new Date(), success });

    // Keep only recent attempts (last 24 hours)
    const recent = attempts.filter(
      attempt => (Date.now() - attempt.timestamp.getTime()) < 24 * 60 * 60 * 1000
    );

    this.loginAttempts.set(ip, recent);
  }

  private generateSessionId(): string {
    const randomBytes = crypto.randomBytes(16).toString('hex'); // Generate 16 random bytes and convert to hex
    return randomBytes + Date.now().toString(36); // Append current timestamp for uniqueness
  }

  // Get admin statistics
  getAdminStats() {
    return {
      totalAdmins: this.adminUsers.size,
      activeSessions: this.activeSessions.size,
      loginAttempts: Array.from(this.loginAttempts.values()).flat().length
    };
  }
}

// Middleware for admin authentication
export const requireAdmin = (permission?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const auth = AdminAuthService.getInstance();
    const verification = auth.verifyToken(token);

    if (!verification.valid || !verification.admin) {
      return res.status(401).json({ error: verification.error || 'Invalid authentication' });
    }

    // Check specific permission if required
    if (permission && !auth.hasPermission(verification.admin, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.admin = verification.admin;
    next();
  };
};

export default AdminAuthService;
