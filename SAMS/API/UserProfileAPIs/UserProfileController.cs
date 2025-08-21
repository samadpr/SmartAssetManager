using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAMS.Controllers;
using SAMS.Services.Roles.PagesModel;
using SAMS.Services.Profile.Interface;
using AutoMapper;
using SAMS.API.UserProfileAPIs.RequestObject;
using SAMS.Services.UserProfiles.DTOs;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace SAMS.API.UserProfile
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class UserProfileController : BaseApiController<UserProfileController>
    {
        private readonly IUserProfileService _userProfileService;
        private readonly IMapper Mapper;

        public UserProfileController(IUserProfileService userProfileService, IMapper mapper)
        {
            _userProfileService = userProfileService;
            Mapper = mapper;
        }

        [Authorize(Roles = RoleModels.UserProfile)]
        [HttpGet("account/get-profile-details")]
        public async Task<IActionResult> GetProfileDetails()
        {
            var user = HttpContext.User.Identity?.Name ?? "System";

            var userProfile = await _userProfileService.GetProfileDetails(user);
            if (userProfile == null)
                return NotFound();

            return Ok(userProfile);
        }

        [Authorize(Roles = RoleModels.UserProfile)]
        [HttpPut("account/update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UserProfileRequestObject request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var result = await _userProfileService.UpdateProfileAsync(request);
            if (!result.Success)
                return BadRequest("Profile update failed. " + result.Message);

            return Ok("Profile updated successfully.");
        }

        [Authorize(Roles = RoleModels.UserManagement)]
        [HttpPost("user-profile/create-user-profile")]
        public async Task<IActionResult> CreateUserProfile([FromBody] UserProfileRequestObject request)
        {
            if(!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = HttpContext.User.Identity?.Name ?? "System";
            var mappedProfile = Mapper.Map<UserProfileDto>(request);
            var result = await _userProfileService.CreateUserProfileAsync(mappedProfile, user);
            if (!result.Success)
                return BadRequest("Profile creation failed. " + result.Message);

            return Ok("User Profile created successfully.");
        }

        [Authorize(Roles = RoleModels.UserManagement)]
        [HttpGet("user-profile/get-created-users-profile")]
        public async Task<IActionResult> GetCreatedUsersProfile()
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _userProfileService.GetCreatedUsersProfile(user);
            if (result == Empty)
                return NotFound("No user profile found.");
            return Ok(result);
        }

        [Authorize(Roles = RoleModels.UserManagement)]
        [HttpPut("user-profile/update-created-user-profile")]
        public async Task<IActionResult> UpdateCreatedUserProfile([FromBody] UserProfileRequestObject request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = HttpContext.User.Identity?.Name ?? "System";
            var mappedProfile = Mapper.Map<UserProfileDto>(request);
            var result = await _userProfileService.UpdateCreatedUserProfileAsync(mappedProfile, user);
            if (!result.success)
                return BadRequest("Profile update failed. " + result.message);
            return Ok("User Profile updated successfully.");
        }

        [Authorize(Roles = RoleModels.UserManagement)]
        [HttpDelete("user-profile/delete-created-user-profile")]
        public async Task<IActionResult> DeleteCreatedUserProfile([FromQuery] long userProfileId)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _userProfileService.DeleteCreatedUserProfile(userProfileId, user);
            if (!result.success)
                return BadRequest("User profile delete failed." + result.message);
            return Ok(result.message);
        }

        [Authorize(Roles = RoleModels.Admin)]
        [HttpPost("user-profile/allow-login-access-for-created-user")]
        public async Task<IActionResult> AllowLoginAccessForCreatedUser([FromBody] LoginAccessRequestObject requestObject)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _userProfileService.AllowLoginAccessForCreatedUserAsync(requestObject, user);
            if (!result.Success)
                return BadRequest("Login access allow failed. " + result.Message);
            return Ok(result.Message);
        }

        [Authorize(Roles = RoleModels.Admin)]
        [HttpPut("user-profile/update-login-access-for-created-user")]
        public async Task<IActionResult> UpdateLoginAccessForCreatedUser([FromBody] UpdateLoginAccessRequestObject requestObject)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _userProfileService.UpdateLoginAccessForCreatedUserAsync(requestObject, user);
            if (!result.Success)
                return BadRequest("Login access allow failed. " + result.Message);
            return Ok(result.Message);
        }

        [Authorize(Roles = RoleModels.Admin)]
        [HttpDelete("user-profile/revoke-login-access-for-created-user-profile")]
        public async Task<IActionResult> RevokeLoginAccessForCreatedUserProfile([FromQuery] long id)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _userProfileService.RevokeLoginAccessForCreatedUserProfile(id, user);
            if (!result.Success)
                return BadRequest("User profile delete failed. " + result.Message);
            return Ok(result.Message);
        }


        [Authorize(Roles = RoleModels.ManageUserRoles)]
        [HttpGet("manage-user-roles/get-user-profiles-used-in-role-id")]
        public async Task<IActionResult> GetUserProfilesUsedInRoleId([FromQuery] long roleId)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _userProfileService.GetUserProfilesUsedInRoleId(roleId, user);
            if (!result.Success)
                return NotFound("No user profile found.");
            return Ok(result.UserProfiles);
        }
    }
}
