using SAMS.Services.Dashboard.DTOs;

namespace SAMS.Services.Dashboard.Interface
{
    public interface IDashboardRepository
    {
        // 1. KPI Stats
        Task<KpiStatsDto> GetKpiStatsAsync(Guid orgId);

        // 2. Asset Status Distribution
        Task<IEnumerable<AssetStatusDistributionDto>> GetAssetStatusDistributionAsync(Guid orgId, string filter);

        // 3. Asset Growth
        Task<IEnumerable<AssetGrowthDto>> GetAssetGrowthAsync(Guid orgId, string period);

        // 4. Asset Value By Category
        Task<IEnumerable<AssetValueByCategoryDto>> GetAssetValueByCategoryAsync(Guid orgId, string sort);

        // 5. Depreciation Summary
        Task<IEnumerable<DepreciationSummaryDto>> GetDepreciationSummaryAsync(Guid orgId, string groupBy);

        // 6. Issue Summary
        Task<IEnumerable<IssueSummaryDto>> GetIssueSummaryAsync(Guid orgId, string groupBy);

        // 7. User Distribution
        Task<IEnumerable<UserDistributionDto>> GetUserDistributionAsync(Guid orgId, string groupBy);

        // 8. Approval Pipeline
        Task<ApprovalPipelineDto> GetApprovalPipelineAsync(Guid orgId);

        // 9. Sites Asset Summary
        Task<IEnumerable<SiteAssetSummaryDto>> GetSitesAssetSummaryAsync(Guid orgId, string filter);

        // 10. Recent Assets
        Task<IEnumerable<RecentAssetDto>> GetRecentAssetsAsync(Guid orgId, int count);

        // 11. Recent Users
        Task<IEnumerable<RecentUserDto>> GetRecentUsersAsync(Guid orgId, int count);

        // 12. Pending Approval Alert
        Task<IEnumerable<PendingApprovalAlertDto>> GetPendingApprovalAlertsAsync(Guid orgId);

        // 13. Open Issues Alert
        Task<IEnumerable<OpenIssueAlertDto>> GetOpenIssueAlertsAsync(Guid orgId);

        // 14. Warranty Expiring
        Task<IEnumerable<WarrantyExpiringDto>> GetWarrantyExpiringAsync(Guid orgId, int days);
    }
}
