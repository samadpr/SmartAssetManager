using AutoMapper;
using SAMS.Helpers;
using SAMS.Services.Assets;
using SAMS.Services.Dashboard.DTOs;
using SAMS.Services.Dashboard.Interface;

namespace SAMS.Services.Dashboard
{
    public class DashboardService : IDashboardService
    {
        private readonly IDashboardRepository _repo;
        private readonly ILogger<AssetsService> _logger;
        private readonly ICompanyContext _companyContext;
        private readonly IMapper _mapper;
        
        public DashboardService(IDashboardRepository repo, ILogger<AssetsService> logger, ICompanyContext companyContext, IMapper mapper)
        {
            _repo = repo;
            _logger = logger;
            _companyContext = companyContext;
            _mapper = mapper;
        }

        // ─── 1. KPI Stats ────────────────────────────────────────────────────────
        public async Task<(bool success, string message, KpiStatsDto? data)> GetKpiStatsAsync()
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var data = await _repo.GetKpiStatsAsync(orgId);
                return (true, "KPI stats retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving KPI stats");
                return (false, "Failed to retrieve KPI stats", null);
            }
        }

        // ─── 2. Asset Status Distribution ────────────────────────────────────────
        public async Task<(bool success, string message, IEnumerable<AssetStatusDistributionDto>? data)> GetAssetStatusDistributionAsync(string filter)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var validFilters = new[] { "all", "active" };
                if (!validFilters.Contains(filter)) filter = "all";

                var data = await _repo.GetAssetStatusDistributionAsync(orgId, filter);
                return (true, "Asset status distribution retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving asset status distribution");
                return (false, "Failed to retrieve asset status distribution", null);
            }
        }

        // ─── 3. Asset Growth ─────────────────────────────────────────────────────
        public async Task<(bool success, string message, IEnumerable<AssetGrowthDto>? data)> GetAssetGrowthAsync(string period)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var validPeriods = new[] { "3m", "6m", "1y" };
                if (!validPeriods.Contains(period)) period = "1y";

                var data = await _repo.GetAssetGrowthAsync(orgId, period);
                return (true, "Asset growth data retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving asset growth");
                return (false, "Failed to retrieve asset growth data", null);
            }
        }

        // ─── 4. Asset Value By Category ──────────────────────────────────────────
        public async Task<(bool success, string message, IEnumerable<AssetValueByCategoryDto>? data)> GetAssetValueByCategoryAsync(string sort)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var validSorts = new[] { "value", "count" };
                if (!validSorts.Contains(sort)) sort = "value";

                var data = await _repo.GetAssetValueByCategoryAsync(orgId, sort);
                return (true, "Asset value by category retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving asset value by category");
                return (false, "Failed to retrieve asset value by category", null);
            }
        }

        // ─── 5. Depreciation Summary ─────────────────────────────────────────────
        public async Task<(bool success, string message, IEnumerable<DepreciationSummaryDto>? data)> GetDepreciationSummaryAsync(string groupBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var validGroups = new[] { "method", "category", "dept" };
                if (!validGroups.Contains(groupBy)) groupBy = "method";

                var data = await _repo.GetDepreciationSummaryAsync(orgId, groupBy);
                return (true, "Depreciation summary retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving depreciation summary");
                return (false, "Failed to retrieve depreciation summary", null);
            }
        }

        // ─── 6. Issue Summary ────────────────────────────────────────────────────
        public async Task<(bool success, string message, IEnumerable<IssueSummaryDto>? data)> GetIssueSummaryAsync(string groupBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var validGroups = new[] { "status", "month" };
                if (!validGroups.Contains(groupBy)) groupBy = "status";

                var data = await _repo.GetIssueSummaryAsync(orgId, groupBy);
                return (true, "Issue summary retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving issue summary");
                return (false, "Failed to retrieve issue summary", null);
            }
        }

        // ─── 7. User Distribution ────────────────────────────────────────────────
        public async Task<(bool success, string message, IEnumerable<UserDistributionDto>? data)> GetUserDistributionAsync(string groupBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var validGroups = new[] { "department", "designation", "site", "role" };
                if (!validGroups.Contains(groupBy)) groupBy = "department";

                var data = await _repo.GetUserDistributionAsync(orgId, groupBy);
                return (true, "User distribution retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user distribution");
                return (false, "Failed to retrieve user distribution", null);
            }
        }

        // ─── 8. Approval Pipeline ────────────────────────────────────────────────
        public async Task<(bool success, string message, ApprovalPipelineDto? data)> GetApprovalPipelineAsync()
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var data = await _repo.GetApprovalPipelineAsync(orgId);
                return (true, "Approval pipeline retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving approval pipeline");
                return (false, "Failed to retrieve approval pipeline", null);
            }
        }

        // ─── 9. Sites Asset Summary ──────────────────────────────────────────────
        public async Task<(bool success, string message, IEnumerable<SiteAssetSummaryDto>? data)> GetSitesAssetSummaryAsync(string filter)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var validFilters = new[] { "all", "1", "2" };
                if (!validFilters.Contains(filter)) filter = "all";

                var data = await _repo.GetSitesAssetSummaryAsync(orgId, filter);
                return (true, "Sites asset summary retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sites asset summary");
                return (false, "Failed to retrieve sites asset summary", null);
            }
        }

        // ─── 10. Recent Assets ───────────────────────────────────────────────────
        public async Task<(bool success, string message, IEnumerable<RecentAssetDto>? data)> GetRecentAssetsAsync(int count)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                if (count <= 0 || count > 50) count = 6;

                var data = await _repo.GetRecentAssetsAsync(orgId, count);
                return (true, "Recent assets retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recent assets");
                return (false, "Failed to retrieve recent assets", null);
            }
        }

        // ─── 11. Recent Users ────────────────────────────────────────────────────
        public async Task<(bool success, string message, IEnumerable<RecentUserDto>? data)> GetRecentUsersAsync(int count)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                if (count <= 0 || count > 50) count = 5;

                var data = await _repo.GetRecentUsersAsync(orgId, count);
                return (true, "Recent users retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recent users");
                return (false, "Failed to retrieve recent users", null);
            }
        }

        // ─── 12. Pending Approval Alerts ─────────────────────────────────────────
        public async Task<(bool success, string message, IEnumerable<PendingApprovalAlertDto>? data)> GetPendingApprovalAlertsAsync()
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var data = await _repo.GetPendingApprovalAlertsAsync(orgId);
                return (true, "Pending approval alerts retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending approval alerts");
                return (false, "Failed to retrieve pending approval alerts", null);
            }
        }

        // ─── 13. Open Issues Alerts ──────────────────────────────────────────────
        public async Task<(bool success, string message, IEnumerable<OpenIssueAlertDto>? data)> GetOpenIssueAlertsAsync()
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var data = await _repo.GetOpenIssueAlertsAsync(orgId);
                return (true, "Open issue alerts retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving open issue alerts");
                return (false, "Failed to retrieve open issue alerts", null);
            }
        }

        // ─── 14. Warranty Expiring ───────────────────────────────────────────────
        public async Task<(bool success, string message, IEnumerable<WarrantyExpiringDto>? data)> GetWarrantyExpiringAsync(int days)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                if (days <= 0) days = 90;

                var data = await _repo.GetWarrantyExpiringAsync(orgId, days);
                return (true, "Warranty expiring assets retrieved successfully", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving warranty expiring assets");
                return (false, "Failed to retrieve warranty expiring assets", null);
            }
        }
    }
}
