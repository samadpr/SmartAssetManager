using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAMS.Controllers;
using SAMS.Services.Roles.PagesModel;
using SAMS.Services.Profile.Interface;
using AutoMapper;
using SAMS.API.UserProfileAPIs.RequestObject;
using SAMS.Services.UserProfiles.DTOs;

namespace SAMS.API.UserProfile
{
    [ApiController]
    [Authorize]
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
            var userProfile = await _userProfileService.GetProfileDetails();
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

        [Authorize(Roles = RoleModels.Admin)]
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

        [Authorize(Roles = RoleModels.Admin)]
        [HttpGet("user-profile/get-created-users-profile")]
        public async Task<IActionResult> GetCreatedUsersProfile()
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _userProfileService.GetCreatedUsersProfile(user);

            return Ok(result);
        }

        [Authorize(Roles = RoleModels.Admin)]
        [HttpPut("user-profile/update-created-user-profile")]
        public async Task<IActionResult> UpdateCreatedUserProfile([FromBody] UserProfileRequestObject request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = HttpContext.User.Identity?.Name ?? "System";
            var mappedProfile = Mapper.Map<UserProfileDto>(request);
            var result = await _userProfileService.UpdateCreatedUserProfileAsync(mappedProfile, user);
            if (!result.success)
                return BadRequest("Profile update failed. " + result.success);
            return Ok("User Profile updated successfully.");
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
            return Ok("Login access allowed successfully.");
        }

    }
}
