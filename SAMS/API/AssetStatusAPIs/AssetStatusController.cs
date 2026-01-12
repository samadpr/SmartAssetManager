using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SAMS.Controllers;
using SAMS.Services.Asset_Status.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.AssetStatusAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class AssetStatusController : BaseApiController<AssetStatusController>
    {
        private readonly IAssetStatusService _assetStatusService;

        public AssetStatusController(IAssetStatusService assetStatusService)
        {
            _assetStatusService = assetStatusService;
        }

        [Authorize(Roles = RoleModels.AssetStatus)]
        [HttpGet("asset-status/get-by-org")]
        public async Task<IActionResult> GetAssetStatuses()
        {
            var data = await _assetStatusService.GetStatusesAsync();
            if (data.isSuccess == false)
            {
                return BadRequest(new { success = data.isSuccess, message = data.message });
            }

            return Ok(new {success = data.isSuccess, data = data.data, message = data.message});
        }
    }
}
