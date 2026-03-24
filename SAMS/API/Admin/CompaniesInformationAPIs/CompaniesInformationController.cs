using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SAMS.Controllers;
using SAMS.Services.Admin.CompaniesInformation.DTOs;
using SAMS.Services.Admin.CompaniesInformation.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.Admin.CompaniesInformationAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class CompaniesInformationController : BaseApiController<CompaniesInformationController>
    {
        private readonly ICompaniesInformationService _service;

        public CompaniesInformationController(ICompaniesInformationService service)
        {
            _service = service;
        }

        // ── 1. Full page load ─────────────────────────────────────────────────
        /// <summary>
        /// Returns company info, admin user, subscription, overview stats
        /// and login-access users in a single response.
        /// On first load pass only companyId; subsequent calls can supply
        /// orgId to skip the JOIN.
        /// </summary>
        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpGet("admin/company/get-company-detail")]
        public async Task<IActionResult> GetCompanyDetail([FromQuery] long companyId, [FromQuery] string? orgId = null)
        {
            if (companyId <= 0)
                return BadRequest(new { success = false, message = "Invalid companyId." });

            var (success, message, data) = await _service.GetCompanyDetailAsync(companyId, orgId);

            if (!success)
                return NotFound(new { success, message });

            return Ok(new { success, message, data });
        }

        // ── 2. Stats refresh ──────────────────────────────────────────────────
        /// <summary>
        /// Lightweight stats refresh — overview counts only.
        /// </summary>
        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpGet("admin/company/get-company-stats")]
        public async Task<IActionResult> GetCompanyStats([FromQuery] long companyId, [FromQuery] string? orgId = null)
        {
            if (companyId <= 0)
                return BadRequest(new { success = false, message = "Invalid companyId." });

            var (success, message, data) = await _service.GetCompanyStatsAsync(companyId, orgId);

            if (!success)
                return NotFound(new { success, message });

            return Ok(new { success, message, data });
        }

        // ── 3. Login access users ─────────────────────────────────────────────
        /// <summary>
        /// Returns all users with login access including session tracking info.
        /// </summary>
        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpGet("admin/company/get-company-login-users")]
        public async Task<IActionResult> GetCompanyLoginUsers([FromQuery] long companyId, [FromQuery] string? orgId = null)
        {
            if (companyId <= 0)
                return BadRequest(new { success = false, message = "Invalid companyId." });

            var (success, message, data) = await _service.GetCompanyLoginUsersAsync(companyId, orgId);

            if (!success)
                return BadRequest(new { success, message });

            return Ok(new { success, message, data });
        }

        // ── 5. Get single company by id (list-card refresh after subscription save) ──
        /// <summary>
        /// Returns a lightweight company + admin user snapshot.
        /// Called by the companies list after AssignSubscriptionDialog saves,
        /// to refresh only the affected card without reloading the full list.
        /// </summary>
        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpGet("admin/company/get-by-id")]
        public async Task<IActionResult> GetById([FromQuery] long id)
        {
            if (id <= 0)
                return BadRequest(new { success = false, message = "Invalid id.", data = (object?)null });

            var (success, message, data) = await _service.GetByIdAsync(id);

            if (!success)
                return NotFound(new { success, message, data = (object?)null });

            return Ok(new { success, message, data });
        }

        // ── 4. Toggle active / suspended ──────────────────────────────────────
        /// <summary>
        /// Flips Company.IsSubscriptionActive between true (active) and false (suspended).
        /// No AspNetUsers changes are made — this is a company-level flag only.
        /// </summary>
        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpPut("admin/company/toggle-active")]
        public async Task<IActionResult> ToggleActive([FromBody] ToggleActiveRequestDto request)
        {
            if (request.CompanyId <= 0)
                return BadRequest(new { success = false, message = "Invalid companyId." });

            var (success, message) = await _service.ToggleActiveAsync(request);

            if (!success)
                return BadRequest(new { success, message });

            return Ok(new { success, message });
        }
    }
}
