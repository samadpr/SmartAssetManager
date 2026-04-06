using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.CodeAnalysis.Elfie.Diagnostics;
using Microsoft.Extensions.Logging;
using SAMS.Controllers;
using SAMS.Services.Reports.AssetTransferReport.DTOs;
using SAMS.Services.Reports.AssetTransferReport.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.ReportAPIs.AssetTransfer
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class AssetTransferReportController : BaseApiController<AssetTransferReportController>
    {
        private readonly IAssetTransferReportService _service;
        private readonly IMapper _mapper;
        private readonly ILogger<AssetTransferReportController> _logger;

        public AssetTransferReportController(IAssetTransferReportService service, IMapper mapper, ILogger<AssetTransferReportController> logger)
        {
            _service = service;
            _mapper = mapper;
            _logger = logger;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // GET /asset-transfer-report/by-id?assetRowId=1
        //
        // Returns the complete transfer chain for one asset, looked up by its
        // numeric database row id. Shows every holder, every approval, hold duration,
        // who moved it, and disposal details if the asset was disposed.
        // ─────────────────────────────────────────────────────────────────────────

        [Authorize(Roles = RoleModels.AssetTransferReport)]
        [HttpGet("asset-transfer-report/by-id")]
        public async Task<IActionResult> GetByAssetRowId([FromQuery] long assetRowId)
        {
            if (assetRowId <= 0)
                return BadRequest(new { success = false, message = "A valid assetRowId is required." });

            try
            {
                var result = await _service.GetAssetTransferHistoryByIdAsync(assetRowId);

                if (!result.success)
                    return NotFound(new { success = false, message = result.message });

                return Ok(new { success = true, message = result.message, data = result.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetByAssetRowId for assetRowId {Id}", assetRowId);
                return StatusCode(500, new { success = false, message = "Internal server error." });
            }
        }

        // ─────────────────────────────────────────────────────────────────────────
        // GET /asset-transfer-report/by-asset-id?assetId=AST-000001
        //
        // Same as above but accepts the human-readable AssetId string instead of
        // the numeric row id. Useful when scanning a QR code or barcode label.
        // ─────────────────────────────────────────────────────────────────────────

        [Authorize(Roles = RoleModels.AssetTransferReport)]
        [HttpGet("asset-transfer-report/by-asset-id")]
        public async Task<IActionResult> GetByAssetId([FromQuery] string assetId)
        {
            if (string.IsNullOrWhiteSpace(assetId))
                return BadRequest(new { success = false, message = "A valid assetId is required." });

            try
            {
                var result = await _service.GetAssetTransferHistoryByAssetIdAsync(assetId.Trim());

                if (!result.success)
                    return NotFound(new { success = false, message = result.message });

                return Ok(new { success = true, message = result.message, data = result.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetByAssetId for assetId {AssetId}", assetId);
                return StatusCode(500, new { success = false, message = "Internal server error." });
            }
        }

        // ─────────────────────────────────────────────────────────────────────────
        // GET /asset-transfer-report/organisation
        //
        // Returns every asset in the organisation with its full transfer chain.
        // No filtering or paging — the frontend handles searching and pagination.
        // Also includes an inline summary (totals, disposed count, pending count).
        // ─────────────────────────────────────────────────────────────────────────

        [Authorize(Roles = RoleModels.AssetTransferReport)]
        [HttpGet("asset-transfer-report/organisation")]
        public async Task<IActionResult> GetOrganisationReport()
        {
            try
            {
                var result = await _service.GetOrganisationTransferReportAsync();

                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, message = result.message, data = result.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetOrganisationReport");
                return StatusCode(500, new { success = false, message = "Internal server error." });
            }
        }

        // ─────────────────────────────────────────────────────────────────────────
        // GET /asset-transfer-report/organisation-summary
        //
        // Returns only the aggregate counts for the organisation — no asset detail.
        // Much faster than the full report. Use this for dashboard widgets.
        // ─────────────────────────────────────────────────────────────────────────

        [Authorize(Roles = RoleModels.AssetTransferReport)]
        [HttpGet("asset-transfer-report/organisation-summary")]
        public async Task<IActionResult> GetOrganisationSummary()
        {
            try
            {
                var result = await _service.GetOrganisationTransferSummaryAsync();

                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, message = result.message, data = result.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetOrganisationSummary");
                return StatusCode(500, new { success = false, message = "Internal server error." });
            }
        }
    }
}
