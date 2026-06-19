import { AssignToType } from "../../../enum/asset.enums";

export interface KpiStatItem {
  value: any;
  trend: number;
  sparkline: any[];
}
 
export interface KpiStats {
  totalAssets: KpiStatItem;
  totalBatches: KpiStatItem;
  activeUsers: KpiStatItem;
  systemUsers: KpiStatItem;
  openIssues: KpiStatItem;
  pendingApprovals: KpiStatItem;
  totalAssetValue: KpiStatItem;
  depreciableAssets: KpiStatItem;
  sitesAndBranches: KpiStatItem;
  disposedAssets: KpiStatItem;
  assignedAssets: KpiStatItem;
  availableAssets: KpiStatItem;
}
 
export interface AssetHealthScore {
  score: number;
  grade: string;
  gradeLabel: string;
  availablePct: number;
  inUsePct: number;
  damagedPct: number;
  maintenancePct: number;
  expiredPct: number;
  pendingApprovalCount: number;
  openIssueCount: number;
  warrantyExpiring30Days: number;
}
 
export interface AssetStatusDistribution {
  statusKey: string;
  label: string;
  count: number;
  percentage: number;
}
 
export interface AssetGrowth {
  month: string;
  acquired: number;
  disposed: number;
  net: number;
  cumulativeValue: number;
}
 
export interface AssetValueByCategory {
  categoryId: number;
  label: string;
  totalValue: number;
  count: number;
  batchCount: number;
  averageUnitValue: number;
  percentage: number;
}
 
export interface DepreciationSummary {
  label: string;
  total: number;
  assetCount: number;
}
 
export interface IssueSummary {
  statusKey?: string;
  label: string;
  count: number;
  percentage: number;
}
 
export interface UserDistribution {
  label: string;
  count: number;
  percentage: number;
}
 
export interface ApprovalPipeline {
  pending: number;
  approved: number;
  rejected: number;
  pendingRate: number;
  approvalRate: number;
  rejectionRate: number;
}
 
// ════════════════════════════════════════════════════════════════════════
//  SITE ASSET SUMMARY — BATCH-AWARE (key updated interface)
// ════════════════════════════════════════════════════════════════════════
 
/**
 * Individual asset unit inside a site/branch summary.
 *
 * BATCH-AWARE ADDITIONS (new fields the backend now returns):
 *  - batchId         → which batch this unit belongs to
 *  - batchCode       → human-readable batch identifier (e.g. BATCH-20260512-0001)
 *  - batchSequence   → unit's position within the batch (1, 2, 3 …)
 *  - assetSerialNo   → per-unit serial number
 */
export interface SiteAssetMini {
  /** Database row id of the Asset entity */
  id: number;
 
  /** Formatted asset code (e.g. "20260127000001") */
  assetId: string;
 
  /** Display name (shared across all units in a batch) */
  name: string;
 
  /** Status display label (e.g. "In Use") */
  status: string;
 
  /** Status CSS key (e.g. "inuse", "new", "damaged") */
  statusKey: string;
 
  /** Category display label */
  categoryDisplay: string;
 
  /** Unit price */
  unitPrice: number;
 
  /** Image URL (relative path or full URL) */
  assetImageUrl?: string;
 
  /** Assignment type: 0 = Not Assigned, 1 = User, 2 = Site/Branch */
  assetAssignTo?: AssignToType;
 
  // ── NEW: Batch fields ────────────────────────────────────────────────
  /** FK to AssetBatch — null for legacy assets without a batch */
  batchId?: number | null;
 
  /** Human-readable batch code (e.g. "BATCH-20260512-0001") */
  batchCode?: string | null;
 
  /**
   * 1-based sequence of this unit within its batch.
   * Useful for labelling individual units: "Unit 3 of 10".
   */
  batchSequence?: number | null;
 
  /** Per-unit serial number */
  assetSerialNo?: string | null;
}
 
/**
 * Site/Branch summary DTO returned by GET /dashboard/sites-asset-summary.
 *
 * BATCH-AWARE ADDITIONS:
 *  - batchCount → number of distinct batches at this location
 */
export interface SiteAssetSummary {
  siteId: number;
  name: string;
  city?: string;
  type: number;
  assetCount: number;
 
  /** NEW: number of distinct batches assigned to this site/branch */
  batchCount: number;
 
  totalValue: number;
  inUseCount: number;
  availableCount: number;
  assets: SiteAssetMini[];
}
 
// ════════════════════════════════════════════════════════════════════════
//  REMAINING INTERFACES (unchanged)
// ════════════════════════════════════════════════════════════════════════
 
export interface RecentAsset {
  batchId?: number;
  batchCode?: string;
  activeQuantity: number;
  originalQuantity: number;
  assetId: string;
  name?: string;
  category?: string;
  categoryId?: number;
  status?: string;
  statusKey?: string;
  unitPrice?: number;
  totalValue?: number;
  siteDisplay?: string;
  createdDate: string;
  assetImageUrl?: string;
  isBatch: boolean;
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
  batchCode?: string;
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
  urgencyKey: string;
}
 
export interface DashboardSummary {
  kpiStats: KpiStats;
  assetStatusDistribution: AssetStatusDistribution[];
  assetGrowth: AssetGrowth[];
  assetValueByCategory: AssetValueByCategory[];
  depreciationSummary: DepreciationSummary[];
  issueSummary: IssueSummary[];
  userDistribution: UserDistribution[];
  approvalPipeline: ApprovalPipeline;
  recentAssets: RecentAsset[];
  recentUsers: RecentUser[];
  pendingApprovals: PendingApprovalAlert[];
  openIssues: OpenIssueAlert[];
  warrantyExpiring: WarrantyExpiring[];
  siteAssetSummary: SiteAssetSummary[];
  assetHealthScore: AssetHealthScore;
}