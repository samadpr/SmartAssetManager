using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.DesignationAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Models;
using SAMS.Services.Common.Interface;
using SAMS.Services.DesignationServices.DTOs;
using SAMS.Services.DesignationServices.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.DesignationAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class DesignationController : BaseApiController<DesignationController>
    {
        private readonly IDesignationService _designationService;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ICommonService _commonService;

        public DesignationController(IDesignationService designationService, IMapper mapper, UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, ICommonService commonService)
        {
            _designationService = designationService;
            _mapper = mapper;
            _userManager = userManager;
            _signInManager = signInManager;
            _commonService = commonService;
        }

        [Authorize(Roles = RoleModels.Designation)]
        [HttpPost("designation/create-designation")]
        public async Task<IActionResult> CreateDesignation([FromBody] DesignationRequest requestObject)
        {
            if (requestObject == null)
                return BadRequest("Request Object is null");
            var user = HttpContext.User.Identity?.Name ?? "System";
            var designationDto = _mapper.Map<DesignationDto>(requestObject);
            var result = await _designationService.AddDesignationAsync(designationDto, user);
            if (result == null)
                return BadRequest($"Designation already exists with name: {designationDto.Name}");
            return Ok(result);
        }

        [Authorize(Roles = RoleModels.Designation)]
        [HttpPut("designation/update-designation")]
        public async Task<IActionResult> UpdateDesignation([FromBody] DesignationRequest requestObject)
        {
            if (requestObject == null)
                return BadRequest("Request Object is null");
            var user = HttpContext.User.Identity?.Name ?? "System";
            var designationDto = _mapper.Map<DesignationDto>(requestObject);
            var result = await _designationService.UpdateDesignationAsync(designationDto, user);
            if (result == null)
                return NotFound($"No designation found with ID: {designationDto.Id}");

            return Ok(result);
        }

        [Authorize(Roles = RoleModels.Designation)]
        [HttpGet("designation/get-designations")]
        public async Task<IActionResult> GetDesignation()
        {
            var user =  HttpContext.User.Identity?.Name ?? "System";
            var result = await _designationService.GetDesignationAsync(user);
            if (result == null)
                return NotFound($"No designation found");
            return Ok(result);
        }

        [Authorize(Roles = RoleModels.Designation)]
        [HttpGet("designation/get-my-designations")]
        public async Task<IActionResult> GetMyDesignation()
        {
            var user = await _userManager.GetUserAsync(_signInManager.Context.User!);
            var result = await _designationService.GetUserDesignationsAsync(user.Email);
            if (result == null)
                return NotFound($"No designation found");
            return Ok(result);
        }

        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpGet("designation/get-all-designations")]
        public async Task<IActionResult> GetAllDesignation()
        {
            if (User.IsInRole(RoleModels.Designation) && User.IsInRole(RoleModels.SuperAdmin))
            {
                var result = await _designationService.GetAllDesignationAsync();
                if (result == null)
                    return NotFound($"No designation found");
                return Ok(result);
            }
            else
                return Forbid("You have no authorized to access this API.");
        }

        [Authorize(Roles = RoleModels.Designation)]
        [HttpGet("designation/get-designation-by-id")]
        public async Task<IActionResult> GetDesignationById(int id)
        {
            if (id <= 0 || id == null)
                return BadRequest("Invalid ID");
            var user = await _userManager.GetUserAsync(_signInManager.Context.User!);
            var result = await _designationService.GetDesignationByIdAsync(id, user.Email);
            if (result == null)
                return NotFound($"No designation found with ID: {id} or you have no authorized to access this API with this Email.");
            return Ok(result);
        }

        [Authorize(Roles = RoleModels.Designation)]
        [HttpDelete("designation/delete-designation")]
        public async Task<IActionResult> DeleteDesignation(int id)
        {
            if (id <= 0 || id == null)
                return BadRequest("Invalid ID");
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _designationService.DeleteDesignationAsync(id, user);
            if (!result)
                return NotFound(new { message = $"No designation found with ID: {id}" });
            return Ok(new { message = "Designation deleted successfully" });
        }
    }
}
