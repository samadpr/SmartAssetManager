export interface KpiStatItem {
  value: any;
  trend: number;
  sparkline: any[];
}

export interface KpiStats {
  totalAssets: KpiStatItem;
  activeUsers: KpiStatItem;
  openIssues: KpiStatItem;
  pendingApprovals: KpiStatItem;
  totalAssetValue: KpiStatItem;
  depreciableAssets: KpiStatItem;
  sitesAndBranches: KpiStatItem;
  disposedAssets: KpiStatItem;
}

export interface AssetStatusDistribution {
  statusKey: string;
  label: string;
  count: number;
}

export interface AssetGrowth {
  month: string;
  acquired: number;
  disposed: number;
}

export interface AssetValueByCategory {
  categoryId: number;
  label: string;
  totalValue: number;
  count: number;
}

export interface DepreciationSummary {
  label: string;
  total: number;
}

export interface IssueSummary {
  statusKey?: string;
  label: string;
  count: number;
}

export interface UserDistribution {
  label: string;
  count: number;
}

export interface ApprovalPipeline {
  pending: number;
  approved: number;
  rejected: number;
}

export interface SiteAssetMini {
  assetId: string;
  name: string;
  status: string;
  statusKey: string;
}

export interface SiteAssetSummary {
  siteId: number;
  name: string;
  city?: string;
  type: number;
  assetCount: number;
  totalValue: number;
  assets: SiteAssetMini[];
}

export interface RecentAsset {
  assetId: string;
  name?: string;
  category?: string;
  categoryId?: number;
  status?: string;
  statusKey?: string;
  unitPrice?: number;
  siteDisplay?: string;
  createdDate: string;
  assetImageUrl?: string;
}
export interface RecentUser {
  userProfileId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  departmentDisplay?: string;
  designationDisplay?: string;
  roleIdDisplay?: string;
  profilePicture?: string;
  joiningDate?: string;
}

export interface PendingApprovalAlert {
  assignmentId: number;
  assetId: string;
  assetName?: string;
  requestedByName?: string;
  requestedByEmail?: string;
  requestedByProfilePicture?: string;
  requestedDate: string;
  assignUserName?: string;
  siteName?: string;
  assetImageUrl?: string;
  assetType: string;
}

export interface OpenIssueAlert {
  issueId: number;
  title?: string;
  description?: string;
  assetId?: string;
  assetName?: string;
  statusKey: string;
  statusDisplay: string;
  priorityKey?: string;
  priorityDisplay?: string;
  createdDate: string;
  createdBy?: string;
}

export interface WarrantyExpiring {
  assetId: number;
  assetCode: string;
  name?: string;
  warrantyExpiryDate?: string;
  daysLeft: number;
  siteDisplay?: string;
}