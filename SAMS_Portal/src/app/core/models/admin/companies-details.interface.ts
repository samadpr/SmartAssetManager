export interface CompanyWithUserInfo {
    id: number;
    organizationId: string;
    industriesId?: number;
    name?: string;
    logo?: string;
    currency?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    fax?: string;
    website?: string;
    subscriptionId?: number;
    subscriptionDate?: string;
    subscriptionExpiryDate?: string;
    isActive: boolean;
    /** Subscription plan details — used to gate the activate/suspend toggle */
    subscriptionPlan?: CompanySubscriptionPlanSnapshot;
    createdBy?: string;
    createdDate: string;
    modifiedBy?: string;
    modifiedDate?: string;
    cancelled: boolean;
    userInfo?: UserProfileInfo;
}
 
export interface CompanySubscriptionPlanSnapshot {
    id: number;
    name: string;
    planAmount: number;
    durationDays: number;
    assetLimit: number;
    systemUserLimit: number;
    totalUserLimit: number;
    isPlanActive: boolean;
}
 
export interface UserProfileInfo {
    userProfileId: number;
    employeeId?: string;
    applicationUserId?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    designation?: number;
    department?: number;
    subDepartment?: number;
    site?: number;
    area?: number;
    roleId?: number;
    designationName?: string;
    departmentName?: string;
    subDepartmentName?: string;
    siteName?: string;
    areaName?: string;
    roleName?: string;
    phoneNumber?: string;
    email?: string;
    isEmailConfirmed: boolean;
    address?: string;
    country?: string;
    profilePicture?: string;
    isApprover?: number;
}
 
 
// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/core/models/admin/companies-details.interface.ts
// ════════════════════════════════════════════════════════════════════════════
 
export interface CompanyDetailResponse {
    company: CompanyFullInfo;
    adminUser: AdminUserDetail | null;
    subscription: SubscriptionDetail | null;
    stats: CompanyStats;
    loginAccessUsers: LoginAccessUser[];
    recentLoginHistory: CompanyLoginHistoryEntry[];
    recentAuditLogs: CompanyAuditLog[];
}
 
// ── Company ───────────────────────────────────────────────────────────────────
export interface CompanyFullInfo {
    id: number;
    organizationId: string;
    name: string;
    logo?: string;
    email?: string;
    phone?: string;
    fax?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    currency?: string;
    industriesId?: number;
    industryName?: string;
    subscriptionId?: number;
    subscriptionDate?: string;
    subscriptionExpiryDate?: string;
    createdDate: string;
    isActive: boolean;
    /** From SubscriptionPlan.IsPlanActive — gates the activate/suspend toggle */
    isPlanActive: boolean;
}
 
// ── Admin User ────────────────────────────────────────────────────────────────
export interface AdminUserDetail {
    userProfileId: number;
    applicationUserId?: string;
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    address?: string;
    country?: string;
    profilePicture?: string;
    isEmailConfirmed: boolean;
    roleName?: string;
    designationName?: string;
    departmentName?: string;
    subDepartmentName?: string;
    siteName?: string;
    areaName?: string;
    joiningDate?: string;
    isApprover?: boolean;
}
 
// ── Subscription ──────────────────────────────────────────────────────────────
export interface SubscriptionDetail {
    subscriptionId: number;
    planName: string;
    planAmount: number;
    durationDays: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    /** Whether the plan template itself is active (IsPlanActive on SubscriptionPlan) */
    isPlanActive: boolean;
    daysRemaining: number;
    assetLimit: number;
    totalUserLimit: number;
    systemUserLimit: number;
}
 
// ── Stats ─────────────────────────────────────────────────────────────────────
export interface CompanyStats {
    totalAssets: number;
    totalBatches: number;
    assignedAssets: number;
    unassignedAssets: number;
    disposedAssets: number;
    totalUsers: number;
    systemUsers: number;
    departments: number;
    subDepartments: number;
    designations: number;
    roles: number;
    sites: number;
    branches: number;
    areas: number;
    cities: number;
    suppliers: number;
    assetCategories: number;
    assetSubCategories: number;
}
 
// ── Login Access User ─────────────────────────────────────────────────────────
export interface LoginAccessUser {
    userProfileId: number;
    applicationUserId?: string;
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    profilePicture?: string;
    roleName?: string;
    designationName?: string;
    departmentName?: string;
    isEmailConfirmed: boolean;
    isActive: boolean;
    lastLoginDate?: string;
    lastLogoutDate?: string;
    totalLoginCount: number;
    createdDate: string;
}
 
// ── Company Login History Entry ───────────────────────────────────────────────
export interface CompanyLoginHistoryEntry {
    id: number;
    userEmail?: string;
    fullName?: string;
    profilePicture?: string;
    roleName?: string;
    loginTime: string;
    logoutTime?: string;
    durationMinutes: number;
    publicIp?: string;
    browser?: string;
    operatingSystem?: string;
    device?: string;
    action?: string;
    actionStatus?: string;
}
 
// ── Company Audit Log ─────────────────────────────────────────────────────────
export interface CompanyAuditLog {
    id: number;
    userId?: string;
    userName?: string;
    userEmail?: string;
    type?: string;        // Created | Updated | Deleted
    tableName?: string;
    dateTime: string;
    affectedColumns?: string;
    primaryKey?: string;
    oldValues?: string;
    newValues?: string;
}