using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.ManageUserRolesAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Services.ManageUserRoles.DTOs;
using SAMS.Services.ManageUserRoles.Interface;
using SAMS.Services.Roles.PagesModel;
using StackExchange.Redis;

namespace SAMS.API.ManageUserRolesAPIs;

[ApiController]
[Authorize]
public class ManageUserRolesController : BaseApiController<ManageUserRolesController>
{
    private readonly IManageUserRolesService _userRolesService;
    private readonly IMapper _mapper;
    public ManageUserRolesController(IManageUserRolesService userRolesService, IMapper mapper)
    {
        _userRolesService = userRolesService;
        _mapper = mapper;
    }

    [Authorize(Roles = RoleModels.ManageUserRoles)]
    [HttpPost("manage-user-roles/create-role-with-role-details")]
    public async Task<IActionResult> CreateUserRolesWithRoleDetails([FromBody] ManageUserRoleRequest request)
    {
        var user = HttpContext.User.Identity?.Name ?? "System";
        var mappedRequest = _mapper.Map<ManageUserRolesDto>(request);
        var result = await _userRolesService.CreateRoleWithRoleDetailsAsync(mappedRequest, user);
        if (result == null)
            return BadRequest("Role creation failed or role already exists.");
        return Ok(result);
    }

    [Authorize(Roles = RoleModels.ManageUserRoles)]
    [HttpPost("manage-user-roles/create-user-role")]
    public async Task<IActionResult> CreateUserRoles([FromBody] UserRoleRequest request)
    {
        var user = HttpContext.User.Identity?.Name ?? "System";
        var mappedRequest = _mapper.Map<ManageUserRolesDto>(request);
        var result = await _userRolesService.CreateUserRolesAsync(mappedRequest, user);
        if (result == null)
            return BadRequest("Role creation failed or role already exists.");
        return Ok(result);
    }

    [Authorize(Roles = RoleModels.ManageUserRoles)]
    [HttpPost("manage-user-roles/create-user-role-details")]
    public async Task<IActionResult> CreateUserRolesDetails([FromBody] IEnumerable<ManageRoleDetailsRequest> request)
    {
        var user = HttpContext.User.Identity?.Name ?? "System";
        var mappedRequest = _mapper.Map<IEnumerable<ManageUserRolesDetailsDto>>(request);
        var result = await _userRolesService.CreateUserRolesDetailsAsync(mappedRequest, user);
        if (result == null)
            return BadRequest("Role creation failed or role already exists.");
        return Ok(result);
    }

    [Authorize(Roles =  RoleModels.SuperAdmin)]
    [HttpGet("manage-user-roles/get-all-roles")]
    public async Task<IActionResult> GetAllRoles()
    {
        if (User.IsInRole(RoleModels.Designation) && User.IsInRole(RoleModels.SuperAdmin))
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            if (string.IsNullOrEmpty(user))
                return Unauthorized("User not authenticated.");
            var result = await _userRolesService.GetAllRolesAsync();
            if(result == null)
                return BadRequest("Roles not found.");
            return Ok(result);
        }
        else
            return Forbid("You have no authorized to access this API.");
    }

    [Authorize(Roles = RoleModels.SuperAdmin)]
    [HttpGet("manage-user-roles/get-all-roles-with-role-details")]
    public async Task<IActionResult> GetAllRolesWithRoleDetails()
    {
        var result = await _userRolesService.GetAllRolesWithRoleDetailsAsync();
        if(result == null)
            return BadRequest("Role not found.");
        return Ok(result);
    }

    [Authorize(Roles = RoleModels.ManageUserRoles)]
    [HttpGet("manage-user-roles/get-user-roles-with-role-details")]
    public async Task<IActionResult> GetUserRolesWithRoleDetails()
    {
        var user = HttpContext.User.Identity?.Name ?? "System";
        var result = await _userRolesService.GetUserRolesWithRoleDetailsAsync(user);
        if (result == null)
            return BadRequest("Role not found.");
        return Ok(result);
    }

    [Authorize(Roles = RoleModels.ManageUserRoles)]
    [HttpGet("manage-user-roles/get-user-roles")]
    public async Task<IActionResult> GetUserRoles()
    {
        var user = HttpContext.User.Identity?.Name ?? "System";
        var result = await _userRolesService.GetUserRolesAsync(user);
        if (result == null)
            return BadRequest("Role not found.");
        return Ok(result);
    }

    [Authorize(Roles = RoleModels.ManageUserRoles)]
    [HttpGet("manage-user-roles/get-user-role-by-id")]
    public async Task<IActionResult> GetUserRoleById([FromQuery] int id)
    {
        var user = HttpContext.User.Identity?.Name ?? "System";
        var result = await _userRolesService.GetUserRoleByIdAsync(id, user);
        if (result == null)
            return BadRequest("Role not found.");
        return Ok(result);
    }

    [Authorize(Roles = RoleModels.ManageUserRoles)]
    [HttpGet("manage-user-roles/get-user-role-details-by-id")]
    public async Task<IActionResult> GetUserRoleDetailsById([FromQuery] int id)
    {
        var user = HttpContext.User.Identity?.Name ?? "System";
        var result = await _userRolesService.GetUserRoleDetailsByIdAsync(id, user);
        if (result == null)
            return BadRequest("Role not found.");
        return Ok(result);
    }

    [Authorize(Roles = RoleModels.ManageUserRoles)]
    [HttpGet("manage-user-roles/get-role-details-by-managed-role-id")]
    public async Task<IActionResult> GetRoleDetailsByManagedRoleId([FromQuery] int id)
    {
        var user = HttpContext.User.Identity?.Name ?? "System";
        var result = await _userRolesService.GetRoleDetailsByManagedRoleIdAsync(id, user);
        if (result == null)
            return BadRequest("Role not found.");
        return Ok(result);
    }


    [Authorize(Roles = RoleModels.ManageUserRoles)]
    [HttpPut("manage-user-roles/update-user-role-with-role-details")]
    public async Task<IActionResult> UpdateUserRolesWithRoleDetails([FromBody] ManageUserRoleRequest request)
    {
        var user = HttpContext.User.Identity?.Name ?? "System";
        var mappedRequest = _mapper.Map<ManageUserRolesDto>(request);
        var result = await _userRolesService.UpdateUserRolesWithRoleDetailsAsync(mappedRequest, user);
        if (!result.isSuccess)
            return BadRequest("Role creation failed." + result.message);
        return Ok(result.message);
    }

    [Authorize(Roles = RoleModels.ManageUserRoles)]
    [HttpDelete("manage-user-roles/delete-user-role-by-id")]
    public async Task<IActionResult> DeleteUserRoles([FromQuery] long id)
    {
        var user = HttpContext.User.Identity?.Name ?? "System";
        var result = await _userRolesService.DeleteUserRoleWithRoleDetailsAsync(id, user);
        if (!result.isSuccess)
            return BadRequest("Role deletion failed." + result.message);
        return Ok(result.message);
    }
}
