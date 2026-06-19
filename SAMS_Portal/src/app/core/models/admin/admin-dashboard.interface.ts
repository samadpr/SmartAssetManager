export interface AdminKpiStatItem {
  value: number;
  trend: number;
  sparkline: number[];
}
 
export interface AdminKpiStats {
  totalCompanies: AdminKpiStatItem;
  activeCompanies: AdminKpiStatItem;
  expiredCompanies: AdminKpiStatItem;
  totalRevenue: AdminKpiStatItem;
  monthlyRevenue: AdminKpiStatItem;
  totalAssets: AdminKpiStatItem;
  totalUsers: AdminKpiStatItem;
  companyAdmins: AdminKpiStatItem;
  systemLoginUsers: AdminKpiStatItem;
  totalSubscriptions: AdminKpiStatItem;
  pendingActivations: AdminKpiStatItem;
  avgAssetsPerCompany: AdminKpiStatItem;
}
 
export interface RevenueOverview {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowthPct: number;
  averageRevenuePerCompany: number;
  highestPlanAmount: number;
  highestPlanName: string;
  activeSubscriptions: number;
  expiredSubscriptions: number;
}
 
export interface CompanyRevenue {
  companyId: number;
  companyName: string;
  logo?: string;
  planName?: string;
  planAmount: number;
  subscriptionDate?: string;
  expiryDate?: string;
  subscriptionStatus: string;
  assetCount: number;
  userCount: number;
  rank: number;
  revenueShare: number;
}
 
export interface MonthlyRevenue {
  month: string;
  revenue: number;
  newCompanies: number;
  renewedCompanies: number;
}
 
export interface SubscriptionPlanDistribution {
  planId: number;
  planName: string;
  planAmount: number;
  companyCount: number;
  totalRevenue: number;
  percentage: number;
}
 
export interface AdminRecentCompany {
  id: number;
  organizationId: string;
  name?: string;
  logo?: string;
  email?: string;
  country?: string;
  city?: string;
  isActive: boolean;
  planName?: string;
  planAmount: number;
  subscriptionDate?: string;
  subscriptionExpiryDate?: string;
  subscriptionStatus: string;
  assetCount: number;
  userCount: number;
  systemUserCount: number;
  createdDate: string;
  adminName?: string;
  adminEmail?: string;
  adminProfilePicture?: string;
  adminEmailVerified: boolean;
}
 
export interface CompanyAssetSummary {
  companyId: number;
  companyName: string;
  assetCount: number;
  assetLimit: number;
  usagePct: number;
  totalAssetValue: number;
  userCount: number;
  userLimit: number;
  planName?: string;
}
 
export interface CompanyGrowth {
  month: string;
  newCompanies: number;
  cumulativeCompanies: number;
  activeCompanies: number;
}
 
export interface AdminRecentUser {
  userProfileId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
  companyName?: string;
  roleName?: string;
  isEmailConfirmed: boolean;
  hasLoginAccess: boolean;
  createdDate: string;
}
 
export interface SystemHealth {
  score: number;
  grade: string;
  gradeLabel: string;
  activeCompanyPct: number;
  subscribedPct: number;
  expiredPct: number;
  totalIssuesAcrossSystem: number;
  companiesNearAssetLimit: number;
  expiringIn30Days: number;
}
 
export interface AdminDashboardSummary {
  kpiStats: AdminKpiStats;
  revenue: RevenueOverview;
  topRevenueCompanies: CompanyRevenue[];
  recentCompanies: AdminRecentCompany[];
  companyAssetSummary: CompanyAssetSummary[];
  planDistribution: SubscriptionPlanDistribution[];
  monthlyRevenue: MonthlyRevenue[];
  companyGrowth: CompanyGrowth[];
  recentSystemUsers: AdminRecentUser[];
  systemHealth: SystemHealth;
}