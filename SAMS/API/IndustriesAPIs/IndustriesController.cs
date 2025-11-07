using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAMS.Controllers;
using SAMS.Services.Industries;
using SAMS.Services.Industries.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.IndustrieAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class IndustriesController : BaseApiController<IndustriesController>
    {
        private readonly IIndustriesService _industriesService;
        private readonly IMapper _mapper;

        public IndustriesController(IIndustriesService industriesService, IMapper mapper)
        {
            _industriesService = industriesService;
            _mapper = mapper;
        }

        [Authorize(Roles = RoleModels.Admin)]
        [HttpGet("industries/get-industries")]
        public async Task<IActionResult> GetAllIndustries()
        {
            var industries = await _industriesService.GetAllIndustries();
            return Ok(new { success = industries.IsSuccess, message = industries.message, data = industries.Industries});
        }
    }
}
