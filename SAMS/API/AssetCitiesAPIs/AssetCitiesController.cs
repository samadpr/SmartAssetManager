using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.AssetCitiesAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Services.Cities.DTOs;
using SAMS.Services.Cities.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.AssetCitiesAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class AssetCitiesController : BaseApiController<AssetCitiesController>
    {
        private readonly IMapper _mapper;
        private readonly ICitiesService _citiesService;
        public AssetCitiesController(IMapper mapper, ICitiesService citiesService)
        {
            _mapper = mapper;
            _citiesService = citiesService;
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPost("asset-cities/create")]
        public async Task<IActionResult> CreateAssetCities(AssetCitiesRequestObject request)
        {
            if (request == null)
                return BadRequest("Request object is null.");

            var user = HttpContext.User.Identity?.Name ?? "System";
            var dto = _mapper.Map<AssetCityDto>(request);
            var result = await _citiesService.AddCityAsync(dto, user);

            if (!result.isSuccess)
                return BadRequest(new { success = result.isSuccess, message = result.message });
            return Ok(new { data = result.data, message = result.message, success = result.isSuccess });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpPut("asset-cities/update")]
        public async Task<IActionResult> UpdateAssetCity([FromBody] AssetCitiesRequestObject request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var dto = _mapper.Map<AssetCityDto>(request);
            var result = await _citiesService.UpdateCityAsync(dto, user);

            if (!result.isSuccess)
                return NotFound(new { success = result.isSuccess, message = result.message });
            return Ok(new { data = result.data, message = result.message, success = result.isSuccess });
        }

        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpGet("asset-cities/get-all")]
        public async Task<IActionResult> GetCities()
        {
            var result = await _citiesService.GetCitiesAsync();
            if (!result.isSuccess)
                return BadRequest(new { success = result.isSuccess, message = result.message });

            return Ok(new { data = result.data, message = result.message , success = result.isSuccess});
        }


        [Authorize(Roles = RoleModels.Asset)]
        [HttpGet("asset-cities/get-all-by-OrganizationId")]
        public async Task<IActionResult> GetCitiesByOrganizationId()
        {
            var result = await _citiesService.GetCitiesByOrganizationAsync();
            if (!result.isSuccess)
                return BadRequest(new { success = result.isSuccess, message = result.message });

            return Ok(new { data = result.data, message = result.message, success = result.isSuccess });
        }

        [Authorize(Roles = RoleModels.Asset)]
        [HttpDelete("asset-cities/delete")]
        public async Task<IActionResult> DeleteCity(long id)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _citiesService.DeleteCityAsync(id, user);
            if (!result.isSuccess)
                return NotFound(new { success = result.isSuccess, message = result.message });
            return Ok(new { success = result.isSuccess, message = result.message });
        }
    }
}
