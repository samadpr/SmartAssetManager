using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.AssetCategoriesAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Services.AssetCategory.DTOs;
using SAMS.Services.AssetCategory.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.AssetCategoriesAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class AssetCategoriesController : BaseApiController<AssetCategoriesController>
    {
        private readonly IAssetCategoriesService _service;
        private readonly IMapper _mapper;

        public AssetCategoriesController(IAssetCategoriesService service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPost("asset-category/create")]
        public async Task<IActionResult> Create(AssetCategoriesRequestObject request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var dto = _mapper.Map<AssetCategoryDto>(request);

            var result = await _service.CreateAsync(dto, user);

            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPut("asset-category/update")]
        public async Task<IActionResult> Update(AssetCategoriesRequestObject request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var dto = _mapper.Map<AssetCategoryDto>(request);

            var result = await _service.UpdateAsync(dto, user);

            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpGet("asset-category/get-by-org")]
        public async Task<IActionResult> GetByOrg()
        {
            var result = await _service.GetByOrganizationAsync();

            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpGet("asset-category/get-all")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();

            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpDelete("asset-category/delete")]
        public async Task<IActionResult> Delete(long id)
        {
            if(id <= 0) return BadRequest("Invalid id.");
            var user = HttpContext.User.Identity?.Name ?? "System";

            var result = await _service.DeleteAsync(id, user);

            return Ok(new { success = result.success, message = result.message });
        }
    }
}
