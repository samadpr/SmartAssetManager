namespace SAMS.Services.Dashboard.DTOs
{
    // ─── 1. KPI Stats ───────────────────────────────────────────────────────────
    public class KpiStatItemDto
    {
        public object Value { get; set; } = null!;
        public decimal Trend { get; set; }
        public List<object> Sparkline { get; set; } = new();
    }

    public class KpiStatsDto
    {
        public KpiStatItemDto TotalAssets { get; set; } = null!;
        public KpiStatItemDto ActiveUsers { get; set; } = null!;
        public KpiStatItemDto OpenIssues { get; set; } = null!;
        public KpiStatItemDto PendingApprovals { get; set; } = null!;
        public KpiStatItemDto TotalAssetValue { get; set; } = null!;
        public KpiStatItemDto DepreciableAssets { get; set; } = null!;
        public KpiStatItemDto SitesAndBranches { get; set; } = null!;
        public KpiStatItemDto DisposedAssets { get; set; } = null!;
    }

    // ─── 2. Asset Status Distribution ───────────────────────────────────────────
    public class AssetStatusDistributionDto
    {
        public string StatusKey { get; set; } = null!;
        public string Label { get; set; } = null!;
        public int Count { get; set; }
    }

    // ─── 3. Asset Growth ────────────────────────────────────────────────────────
    public class AssetGrowthDto
    {
        public string Month { get; set; } = null!;
        public int Acquired { get; set; }
        public int Disposed { get; set; }
    }

    // ─── 4. Asset Value By Category ─────────────────────────────────────────────
    public class AssetValueByCategoryDto
    {
        public long CategoryId { get; set; }
        public string Label { get; set; } = null!;
        public decimal TotalValue { get; set; }
        public int Count { get; set; }
    }

    // ─── 5. Depreciation Summary ────────────────────────────────────────────────
    public class DepreciationSummaryDto
    {
        public string Label { get; set; } = null!;
        public decimal Total { get; set; }
    }

    // ─── 6. Issue Summary ───────────────────────────────────────────────────────
    public class IssueSummaryDto
    {
        public string? StatusKey { get; set; }
        public string Label { get; set; } = null!;
        public int Count { get; set; }
    }

    // ─── 7. User Distribution ───────────────────────────────────────────────────
    public class UserDistributionDto
    {
        public string Label { get; set; } = null!;
        public int Count { get; set; }
    }

    // ─── 8. Approval Pipeline ───────────────────────────────────────────────────
    public class ApprovalPipelineDto
    {
        public int Pending { get; set; }
        public int Approved { get; set; }
        public int Rejected { get; set; }
    }

    // ─── 9. Sites Asset Summary ─────────────────────────────────────────────────
    public class SiteAssetMiniDto
    {
        public string AssetId { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string StatusKey { get; set; } = null!;
    }

    public class SiteAssetSummaryDto
    {
        public long SiteId { get; set; }
        public string Name { get; set; } = null!;
        public string? City { get; set; }
        public int Type { get; set; }
        public int AssetCount { get; set; }
        public decimal TotalValue { get; set; }
        public List<SiteAssetMiniDto> Assets { get; set; } = new();
    }

    // ─── 10. Recent Assets ──────────────────────────────────────────────────────
    public class RecentAssetDto
    {
        public string AssetId { get; set; } = null!;
        public string? Name { get; set; }
        public string? Category { get; set; }
        public long? CategoryId { get; set; }
        public string? Status { get; set; }
        public string? StatusKey { get; set; }
        public double? UnitPrice { get; set; }
        public string? SiteDisplay { get; set; }
        public DateTime CreatedDate { get; set; }
        public string? AssetImageUrl { get; set; }
    }

    // ─── 11. Recent Users ───────────────────────────────────────────────────────
    public class RecentUserDto
    {
        public long UserProfileId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? DepartmentDisplay { get; set; }
        public string? DesignationDisplay { get; set; }
        public string? RoleIdDisplay { get; set; }
        public string? ProfilePicture { get; set; }
        public DateTime? JoiningDate { get; set; }
    }

    // ─── 12. Pending Approval Alert ─────────────────────────────────────────────
    public class PendingApprovalAlertDto
    {
        public long AssignmentId { get; set; }
        public string AssetId { get; set; } = null!;
        public string? AssetName { get; set; }
        public string? RequestedByName { get; set; }
        public string? RequestedByEmail { get; set; }
        public string? RequestedByProfilePicture { get; set; }
        public DateTime RequestedDate { get; set; }
        public string? AssignUserName { get; set; }
        public string? SiteName { get; set; }
        public string? AssetImageUrl { get; set; }
        public string AssetType { get; set; } = null!;
    }

    // ─── 13. Open Issues Alert ──────────────────────────────────────────────────
    public class OpenIssueAlertDto
    {
        public long IssueId { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? AssetId { get; set; }
        public string? AssetName { get; set; }
        public string StatusKey { get; set; } = null!;
        public string StatusDisplay { get; set; } = null!;
        public string? PriorityKey { get; set; }
        public string? PriorityDisplay { get; set; }
        public DateTime CreatedDate { get; set; }
        public string? CreatedBy { get; set; }
    }

    // ─── 14. Warranty Expiring ──────────────────────────────────────────────────
    public class WarrantyExpiringDto
    {
        public long AssetId { get; set; }
        public string AssetCode { get; set; } = null!;
        public string? Name { get; set; }
        public DateTime? WarrantyExpiryDate { get; set; }
        public int DaysLeft { get; set; }
        public string? SiteDisplay { get; set; }
    }
}
