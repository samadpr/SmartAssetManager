using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.AssetAPIs;
using SAMS.API.AssetIssueAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Services.AssetsIssue.DTOs;
using SAMS.Services.AssetsIssue.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.AssetIssueAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class AssetIssueController : BaseApiController<AssetIssueController>
    {
        private readonly IAssetIssueService _issueService;
        private readonly ILogger<AssetController> _logger;
        private readonly IMapper _mapper;

        public AssetIssueController(IAssetIssueService issueService, ILogger<AssetController> logger, IMapper mapper)
        {
            _issueService = issueService;
            _logger = logger;
            _mapper = mapper;
        }

        [Authorize(Roles = RoleModels.AssetIssue)]
        [HttpPost("asset-issue/create")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] AssetIssueRequestObject request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            //var dto = _mapper.Map<AssetIssueDto>(request);

            var result = await _issueService.CreateAsync(request, user);

            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.AssetIssue)]
        [HttpPut("asset-issue/update")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Update([FromForm] AssetIssueRequestObject request)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            //var dto = _mapper.Map<AssetIssueDto>(request);

            var result = await _issueService.UpdateAsync(request, user);

            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.AssetIssue)]
        [HttpGet("asset-issue/get-by-org")]
        public async Task<IActionResult> GetByOrg()
        {
            var result = await _issueService.GetByOrganizationAsync();
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.AssetIssue)]
        [HttpGet("asset-issue/get-by-id")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _issueService.GetByIdAsync(id);
            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.AssetIssue)]
        [HttpDelete("asset-issue/delete")]
        public async Task<IActionResult> Delete(long id)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _issueService.DeleteAsync(id, user);

            return Ok(new { success = result.success, message = result.message });
        }
    }
}
