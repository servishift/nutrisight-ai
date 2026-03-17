// Admin panel type definitions

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'superadmin';
  avatar?: string;
}

export interface ManagedUser {
  uid: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
  disabled: boolean;
  role: string;
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
  analysesToday: number;
  proSubscribers: number;
  recentUsers: number;
  userGrowth: number;
  analysisGrowth: number;
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
  targetType: string;
  targetId: string;
  adminId: string;
  adminEmail: string;
  details: string;
  createdAt: string;
}
