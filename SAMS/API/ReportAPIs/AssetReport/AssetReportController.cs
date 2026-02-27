using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.AssetAPIs;
using SAMS.Controllers;
using SAMS.Services.Reports.AssetReports.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.ReportAPIs.AssetReport
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class AssetReportController : BaseApiController<AssetReportController>
    {
        private readonly IAssetReportService _service;
        private readonly ILogger<AssetController> _logger;
        private readonly IMapper _mapper;
        public AssetReportController(IAssetReportService service, ILogger<AssetController> logger, IMapper mapper)
        {
            _service = service;
            _logger = logger;
            _mapper = mapper;
        }

        [Authorize(Roles = RoleModels.AssetInfoReport)]
        [HttpGet("asset-report/asset-full-info-report")]
        public async Task<IActionResult> GetAssetFullInfoReport()
        {
            try
            {

                var result = await _service.GetAssetFullInfoReportByOrg();

                if (!result.success)
                    return NotFound(new { success = false, message = result.message });

                return Ok(new
                {
                    success = true,
                    message = result.message,
                    data = result.data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving asset");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [Authorize(Roles = RoleModels.AssetInfoReport)]
        [HttpGet("asset-report/asset-depreciation-report")]
        public async Task<IActionResult> GetAssetDepreciationReport()
        {
            try
            {
                var result = await _service.GetAssetDepreciationReportByOrg();

                if (!result.success)
                    return NotFound(new { success = false, message = result.message });

                return Ok(new
                {
                    success = true,
                    message = result.message,
                    data = result.data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving asset");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [Authorize(Roles = RoleModels.AssetInfoReport)]
        [HttpGet("asset-report/asset-disposal-report")]
        public async Task<IActionResult> GetAssetDisposalReport()
        {
            try
            {
                var result = await _service.GetAssetDisposalReportByOrg();

                if (!result.success)
                    return NotFound(new { success = false, message = result.message });

                return Ok(new
                {
                    success = true,
                    message = result.message,
                    data = result.data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving asset");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }
    }
}
