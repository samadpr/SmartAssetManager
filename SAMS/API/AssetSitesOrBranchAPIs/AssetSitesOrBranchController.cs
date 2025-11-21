using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.AssetSitesOrBranchAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Services.AssetSitesOrBranches.DTOs;
using SAMS.Services.AssetSitesOrBranches.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.AssetSitesOrBranchAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class AssetSitesOrBranchController : BaseApiController<AssetSitesOrBranchController>
    {
        private readonly IAssetSitesOrBranchesService _service;
        private readonly IMapper _mapper;

        public AssetSitesOrBranchController(
            IAssetSitesOrBranchesService service,
            IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPost("asset-sites-or-branch/create")]
        public async Task<IActionResult> Create(AssetSOBRequestObject request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var dto = _mapper.Map<AssetSiteDto>(request);

            var result = await _service.CreateAsync(dto, user);
            return Ok(new { success = result.success, message = result.message , data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPut("asset-sites-or-branch/update")]
        public async Task<IActionResult> Update(AssetSOBRequestObject request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var dto = _mapper.Map<AssetSiteDto>(request);

            var result = await _service.UpdateAsync(dto, user);
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpGet("asset-sites-or-branch/get-all")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpGet("asset-sites-or-branch/get-by-org")]
        public async Task<IActionResult> GetByOrg()
        {
            var result = await _service.GetByOrganizationAsync();
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpGet("asset-sites-or-branch/get-by-city-id")]
        public async Task<IActionResult> GetByCityId(long id)
        {
            if (id <= 0) return BadRequest(new { success = false, message = "Invalid Id" });
            var result = await _service.GetByCityIdAsync(id);
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpDelete("asset-sites-or-branch/delete")]
        public async Task<IActionResult> Delete(long id)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _service.DeleteAsync(id, user);
            return Ok(new { success = result.success, message = result.message });
        }
    }
}
