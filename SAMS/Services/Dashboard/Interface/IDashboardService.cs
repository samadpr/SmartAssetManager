using SAMS.Services.Dashboard.DTOs;

namespace SAMS.Services.Dashboard.Interface
{
    public interface IDashboardService
    {
        // 1. KPI Stats
        Task<(bool success, string message, KpiStatsDto? data)> GetKpiStatsAsync();

        // 2. Asset Status Distribution
        Task<(bool success, string message, IEnumerable<AssetStatusDistributionDto>? data)> GetAssetStatusDistributionAsync(string filter);

        // 3. Asset Growth
        Task<(bool success, string message, IEnumerable<AssetGrowthDto>? data)> GetAssetGrowthAsync(string period);

        // 4. Asset Value By Category
        Task<(bool success, string message, IEnumerable<AssetValueByCategoryDto>? data)> GetAssetValueByCategoryAsync(string sort);

        // 5. Depreciation Summary
        Task<(bool success, string message, IEnumerable<DepreciationSummaryDto>? data)> GetDepreciationSummaryAsync(string groupBy);

        // 6. Issue Summary
        Task<(bool success, string message, IEnumerable<IssueSummaryDto>? data)> GetIssueSummaryAsync(string groupBy);

        // 7. User Distribution
        Task<(bool success, string message, IEnumerable<UserDistributionDto>? data)> GetUserDistributionAsync(string groupBy);

        // 8. Approval Pipeline
        Task<(bool success, string message, ApprovalPipelineDto? data)> GetApprovalPipelineAsync();

        // 9. Sites Asset Summary
        Task<(bool success, string message, IEnumerable<SiteAssetSummaryDto>? data)> GetSitesAssetSummaryAsync(string filter);

        // 10. Recent Assets
        Task<(bool success, string message, IEnumerable<RecentAssetDto>? data)> GetRecentAssetsAsync(int count);

        // 11. Recent Users
        Task<(bool success, string message, IEnumerable<RecentUserDto>? data)> GetRecentUsersAsync(int count);

        // 12. Pending Approval Alert
        Task<(bool success, string message, IEnumerable<PendingApprovalAlertDto>? data)> GetPendingApprovalAlertsAsync();

        // 13. Open Issues Alert
        Task<(bool success, string message, IEnumerable<OpenIssueAlertDto>? data)> GetOpenIssueAlertsAsync();

        // 14. Warranty Expiring
        Task<(bool success, string message, IEnumerable<WarrantyExpiringDto>? data)> GetWarrantyExpiringAsync(int days);
    }
}
