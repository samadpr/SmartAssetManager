using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.AssetAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Services.Assets.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.AssetAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class AssetController : BaseApiController<AssetController>
    {
        private readonly IAssetsService _assetsService;
        private readonly ILogger<AssetController> _logger;
        private readonly IMapper _mapper;

        public AssetController(IAssetsService assetsService, ILogger<AssetController> logger, IMapper mapper)
        {
            _assetsService = assetsService;
            _logger = logger;
            _mapper = mapper;
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPost("asset/create")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] AssetRequestObject request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Invalid data", errors = ModelState });

                var user = HttpContext.User.Identity?.Name ?? "System";
                var result = await _assetsService.CreateAsync(request, user);

                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new
                {
                    success = true,
                    message = result.message,
                    data = result.data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating asset");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPut("asset/update")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Update([FromForm] AssetRequestObject request)
        {
            try
            {
                if (!request.Id.HasValue)
                    return BadRequest(new { success = false, message = "Asset ID is required" });

                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Invalid data", errors = ModelState });

                var user = HttpContext.User.Identity?.Name ?? "System";
                var result = await _assetsService.UpdateAsync(request, user);

                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new
                {
                    success = true,
                    message = result.message,
                    data = result.data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating asset");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpGet("asset/get-by-id")]
        public async Task<IActionResult> GetById([FromQuery] long id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "Asset ID is required" });
                var result = await _assetsService.GetByIdAsync(id);

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

        [Authorize(Roles = RoleModels.Asset)]
        [HttpGet("asset/get-by-org-id")]
        public async Task<IActionResult> GetByOrgIdWithValidAssets()
        {
            try
            {

                var result = await _assetsService.GetByOrgIdWithValidAssetsAsync();

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

        [Authorize(Roles = RoleModels.Asset)]
        [HttpDelete("asset/delete")]
        public async Task<IActionResult> Delete([FromQuery] long id)
        {
            try
            {
                var user = HttpContext.User.Identity?.Name ?? "System";
                var result = await _assetsService.DeleteAsync(id, user);

                if (!result.success)
                    return BadRequest(new { success = false, message = result.message });

                return Ok(new { success = true, message = result.message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting asset");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }


        [Authorize(Roles = RoleModels.Asset)]
        [HttpPost("asset/transfer")]
        public async Task<IActionResult> Transfer([FromBody] AssetTransferRequestDto request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";

            var result = await _assetsService.TransferAssetAsync(request, user);

            if (!result.success)
                return BadRequest(new { success = false, message = result.message });

            return Ok(new { success = true, message = result.message });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPost("asset/dispose")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> DisposeAsset([FromForm] AssetDisposeRequestDto request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";

            var result = await _assetsService.DisposeAssetAsync(request, user);

            if (!result.success)
                return BadRequest(new { success = false, message = result.message });

            return Ok(new { success = true, message = result.message });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPost("asset/approve")]
        public async Task<IActionResult> Approve([FromBody] AssetApprovalRequestDto request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _assetsService.ApproveAssetRequestAsync(request, user);

            if (!result.success)
                return BadRequest(result);

            return Ok(result);
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPost("asset/reject")]
        public async Task<IActionResult> Reject([FromBody] AssetApprovalRequestDto request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _assetsService.RejectAssetRequestAsync(request, user);

            if (!result.success)
                return BadRequest(result);

            return Ok(result);
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpGet("asset/get-approval-pending-list")]
        public async Task<IActionResult> GetPendingApprovals()
        {
            var result = await _assetsService.GetPendingApprovalAssetsAsync();

            if (!result.success)
                return BadRequest(new { success = false, message = result.message });

            return Ok(new
            {
                success = true,
                message = result.message,
                data = result.data
            });
        }


    }
}
