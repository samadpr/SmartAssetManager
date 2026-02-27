using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SAMS.Controllers;
using SAMS.Services.Dashboard.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.DashboardAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class DashboardController : BaseApiController<DashboardController>
    {
        private readonly IDashboardService _dashboardService;
        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        // ─── 1. GET /dashboard/kpi-stats ─────────────────────────────────────────
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/kpi-stats")]
        public async Task<IActionResult> GetKpiStats()
        {
            try
            {
                var result = await _dashboardService.GetKpiStatsAsync();
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ─── 2. GET /dashboard/asset-status-distribution ─────────────────────────
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/asset-status-distribution")]
        public async Task<IActionResult> GetAssetStatusDistribution([FromQuery] string filter = "all")
        {
            try
            {
                var result = await _dashboardService.GetAssetStatusDistributionAsync(filter);
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ─── 3. GET /dashboard/asset-growth ──────────────────────────────────────
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/asset-growth")]
        public async Task<IActionResult> GetAssetGrowth([FromQuery] string period = "1y")
        {
            try
            {
                var result = await _dashboardService.GetAssetGrowthAsync(period);
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ─── 4. GET /dashboard/asset-value-by-category ───────────────────────────
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/asset-value-by-category")]
        public async Task<IActionResult> GetAssetValueByCategory([FromQuery] string sort = "value")
        {
            try
            {
                var result = await _dashboardService.GetAssetValueByCategoryAsync(sort);
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ─── 5. GET /dashboard/depreciation-summary ──────────────────────────────
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/depreciation-summary")]
        public async Task<IActionResult> GetDepreciationSummary([FromQuery] string groupBy = "method")
        {
            try
            {
                var result = await _dashboardService.GetDepreciationSummaryAsync(groupBy);
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ─── 6. GET /dashboard/issue-summary ─────────────────────────────────────
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/issue-summary")]
        public async Task<IActionResult> GetIssueSummary([FromQuery] string groupBy = "status")
        {
            try
            {
                var result = await _dashboardService.GetIssueSummaryAsync(groupBy);
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ─── 7. GET /dashboard/user-distribution ─────────────────────────────────
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/user-distribution")]
        public async Task<IActionResult> GetUserDistribution([FromQuery] string groupBy = "department")
        {
            try
            {
                var result = await _dashboardService.GetUserDistributionAsync(groupBy);
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ─── 8. GET /dashboard/approval-pipeline ─────────────────────────────────
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/approval-pipeline")]
        public async Task<IActionResult> GetApprovalPipeline()
        {
            try
            {
                var result = await _dashboardService.GetApprovalPipelineAsync();
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ─── 9. GET /dashboard/sites-asset-summary ───────────────────────────────
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/sites-asset-summary")]
        public async Task<IActionResult> GetSitesAssetSummary([FromQuery] string filter = "all")
        {
            try
            {
                var result = await _dashboardService.GetSitesAssetSummaryAsync(filter);
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ─── 10. GET /asset/get-recent ────────────────────────────────────────────
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/get-recent")]
        public async Task<IActionResult> GetRecentAssets([FromQuery] int count = 6)
        {
            try
            {
                var result = await _dashboardService.GetRecentAssetsAsync(count);
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ─── 11. GET /account/get-recent-users ───────────────────────────────────
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/get-recent-users")]
        public async Task<IActionResult> GetRecentUsers([FromQuery] int count = 5)
        {
            try
            {
                var result = await _dashboardService.GetRecentUsersAsync(count);
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ─── 12. GET /dashboard/pending-approvals-alert ───────────────────────────
        // (duplicates /asset/get-approval-pending-list with dashboard-relevant fields)
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/pending-approvals-alert")]
        public async Task<IActionResult> GetPendingApprovalAlerts()
        {
            try
            {
                var result = await _dashboardService.GetPendingApprovalAlertsAsync();
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ─── 13. GET /dashboard/open-issues-alert ────────────────────────────────
        // (duplicates /asset-issue/get-by-org filtered to open issues only)
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/open-issues-alert")]
        public async Task<IActionResult> GetOpenIssueAlerts()
        {
            try
            {
                var result = await _dashboardService.GetOpenIssueAlertsAsync();
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ─── 14. GET /asset/get-warranty-expiring ────────────────────────────────
        [Authorize(Roles = RoleModels.Dashboard)]
        [HttpGet("dashboard/get-warranty-expiring")]
        public async Task<IActionResult> GetWarrantyExpiring([FromQuery] int days = 90)
        {
            try
            {
                var result = await _dashboardService.GetWarrantyExpiringAsync(days);
                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, data = result.data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }
    }
}
