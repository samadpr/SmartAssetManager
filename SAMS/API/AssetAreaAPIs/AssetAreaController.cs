using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.AssetAreaAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Services.AssetAreas.DTOs;
using SAMS.Services.AssetAreas.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.AssetAreaAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class AssetAreaController : BaseApiController<AssetAreaController>
    {
        private readonly IAssetAreaService _service;
        private readonly IMapper _mapper;

        public AssetAreaController(IAssetAreaService service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPost("asset-area/create")]
        public async Task<IActionResult> Create(AssetAreaRequestObject request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var dto = _mapper.Map<AssetAreaDto>(request);

            var result = await _service.CreateAsync(dto, user);
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPut("asset-area/update")]
        public async Task<IActionResult> Update(AssetAreaRequestObject request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var dto = _mapper.Map<AssetAreaDto>(request);

            var result = await _service.UpdateAsync(dto, user);
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpGet("asset-area/get-all")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpGet("asset-area/get-by-org")]
        public async Task<IActionResult> GetByOrg()
        {
            var result = await _service.GetByOrganizationAsync();
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpGet("asset-area/get-by-site-id")]
        public async Task<IActionResult> GetBySiteId(long id)
        {
            if (id <= 0) return BadRequest(new { success = false, message = "Invalid Id" });
            var result = await _service.GetBySiteIdAsync(id);
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpDelete("asset-area/delete")]
        public async Task<IActionResult> Delete(long id)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _service.DeleteAsync(id, user);

            return Ok(new { success = result.success, message = result.message });
        }
    }

}

