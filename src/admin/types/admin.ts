// Admin panel type definitions

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'superadmin';
  avatar?: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  emailVerified: boolean;
  isActive: boolean;
  role: 'user' | 'pro' | 'enterprise';
  plan: 'free' | 'pro' | 'enterprise';
  analysisCount: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface Additive {
  id: string;
  code: string;        // e.g. "E100"
  name: string;
  category: 'preservative' | 'color' | 'sweetener' | 'emulsifier' | 'antioxidant' | 'flavor' | 'stabilizer' | 'other';
  riskLevel: 'low' | 'moderate' | 'high';
  description: string;
  source: string;
  bannedIn: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalAnalyses: number;
  proSubscribers: number;
  revenueThisMonth: number;
  userGrowth: number;       // percentage
  analysisGrowth: number;   // percentage
}

export interface AnalyticsData {
  date: string;
  users: number;
  analyses: number;
  revenue: number;
}

export interface AuditLog {
  id: string;
  action: string;
  targetType: 'user' | 'additive' | 'setting';
  targetId: string;
  adminId: string;
  adminEmail: string;
  details: string;
  createdAt: string;
}
