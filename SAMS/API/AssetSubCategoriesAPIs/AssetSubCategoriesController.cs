using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.AssetSubCategoriesAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Services.AssetSubCategory.DTOs;
using SAMS.Services.AssetSubCategory.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.AssetSubCategoriesAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class AssetSubCategoriesController : BaseApiController<AssetSubCategoriesController>
    {
        private readonly IAssetSubCategoriesService _service;
        private readonly IMapper _mapper;

        public AssetSubCategoriesController(IAssetSubCategoriesService service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPost("asset-subcategory/create")]
        public async Task<IActionResult> Create(AssetSubCategoriesRequestObject request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var dto = _mapper.Map<AssetSubCategoryDto>(request);

            var result = await _service.CreateAsync(dto, user);
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPut("asset-subcategory/update")]
        public async Task<IActionResult> Update(AssetSubCategoriesRequestObject request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var dto = _mapper.Map<AssetSubCategoryDto>(request);

            var result = await _service.UpdateAsync(dto, user);
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpGet("asset-subcategory/get-all")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpGet("asset-subcategory/get-by-org")]
        public async Task<IActionResult> GetByOrg()
        {
            var result = await _service.GetByOrganizationAsync();
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpGet("asset-subcategory/get-by-category-id")]
        public async Task<IActionResult> GetByCategoryId(long id)
        {
            if (id <= 0) return BadRequest(new { success = false, message = "Invalid Id" });
            var result = await _service.GetByCategoryIdAsync(id);
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpDelete("asset-subcategory/delete")]
        public async Task<IActionResult> Delete(long id)
        {
            if(id <= 0) return BadRequest(new { success = false, message = "Invalid Id" });
            var user = HttpContext.User.Identity?.Name ?? "System";

            var result = await _service.DeleteAsync(id, user);
            return Ok(new { success = result.success, message = result.message });
        }
    }
}
