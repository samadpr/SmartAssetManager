using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.AssetAPIs;
using SAMS.Controllers;
using SAMS.Services.AssetQrBarcodeManage.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.AssetQrBarcodeManageAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class AssetQrBarcodeManageController : BaseApiController<AssetQrBarcodeManageController>
    {
        private readonly IAssetQrBarcodeManageService _service;
        private readonly ILogger<AssetController> _logger;
        private readonly IMapper _mapper;

        public AssetQrBarcodeManageController(IAssetQrBarcodeManageService service, ILogger<AssetController> logger, IMapper mapper)
        {
            _service = service;
            _logger = logger;
            _mapper = mapper;
        }

        [Authorize(Roles = RoleModels.PrintQRcode)]
        [HttpGet("asset-qr-barcode/get-asset-qr-barcode-by-org")]
        public async Task<IActionResult> GetAssetQrBarcodesByOrg()
        {
            try
            {

                var result = await _service.GetAssetQrBarcodesByOrg();

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
