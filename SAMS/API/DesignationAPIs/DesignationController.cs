using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.DesignationAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Models;
using SAMS.Services.DesignationServices.DTOs;
using SAMS.Services.DesignationServices.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.DesignationAPIs
{
    [ApiController]
    [Authorize]
    public class DesignationController : BaseApiController<DesignationController>
    {
        private readonly IDesignationService _designationService;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;

        public DesignationController(IDesignationService designationService, IMapper mapper, UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager)
        {
            _designationService = designationService;
            _mapper = mapper;
            _userManager = userManager;
            _signInManager = signInManager;
        }

        [HttpPost("designation/create-designation")]
        [Authorize(Roles = RoleModels.Designation)]
        public async Task<IActionResult> CreateDesignation([FromBody] DesignationRequestObject requestObject)
        {
            if (requestObject == null)
                return BadRequest("Request Object is null");
            var user = await _userManager.GetUserAsync(_signInManager.Context.User!);
            var designationDto = _mapper.Map<DesignationDto>(requestObject);
            var result = await _designationService.AddDesignationAsync(designationDto, user.Email);
            return Ok(result);
        }

        [HttpPut("designation/update-designation")]
        [Authorize(Roles = RoleModels.Designation)]
        public async Task<IActionResult> UpdateDesignation([FromBody] DesignationRequestObject requestObject)
        {
            if(requestObject == null)
                return BadRequest("Request Object is null");
            var user = await _userManager.GetUserAsync(_signInManager.Context.User!);
            var designationDto = _mapper.Map<DesignationDto>(requestObject);
            var result = await _designationService.UpdateDesignationAsync(designationDto, user.Email);
            if (result == null)
                return NotFound($"No designation found with ID: {designationDto.Id}");

            return Ok(result);
        }

        [HttpGet("designation/get-my-designations")]
        [Authorize(Roles = RoleModels.Designation)]
        public async Task<IActionResult> GetMyDesignation()
        {
            var user = await _userManager.GetUserAsync(_signInManager.Context.User!);
            var result = await _designationService.GetUserDesignationsAsync(user.Email);
            if (result == null)
                return NotFound($"No designation found");
            return Ok(result);
        }

        [HttpGet("designation/get-all-designations")]
        [Authorize(Roles = RoleModels.Designation)]
        public async Task<IActionResult> GetAllDesignation()
        {
            var result = await _designationService.GetDesignationAsync();
            if (result == null)
                return NotFound($"No designation found");
            return Ok(result);
        }

        [HttpDelete("designation/delete-designation")]
        [Authorize(Roles = RoleModels.Designation)]
        public async Task<IActionResult> DeleteDesignation(int id)
        {
            if (id <= 0 || id == null)
                return BadRequest("Invalid ID");
            var user = await _userManager.GetUserAsync(_signInManager.Context.User!);
            var result = await _designationService.DeleteDesignationAsync(id, user.Email);
            if (!result)
                return NotFound($"No designation found with ID: {id}");
            return Ok(result ? "Designation deleted successfully" : "Designation not deleted");
        }
    }
}
