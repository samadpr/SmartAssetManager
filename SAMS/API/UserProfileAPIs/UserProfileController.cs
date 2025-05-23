using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAMS.Controllers;
using SAMS.Services.Roles.PagesModel;
using SAMS.Services.Profile.Interface;
using AutoMapper;
using SAMS.API.UserProfileAPIs.RequestObject;

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

        [HttpGet("account/get-profile-details")]
        [Authorize(Roles = RoleModels.UserProfile)]
        public async Task<IActionResult> GetProfileDetails()
        {
            var userProfile = await _userProfileService.GetProfileDetails();
            if (userProfile == null)
                return NotFound();

            return Ok(userProfile);
        }

        [HttpPut("account/update-profile")]
        [Authorize(Roles = RoleModels.UserProfile)]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUPRequestObject request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var result = await _userProfileService.UpdateUserProfileAsync(request);
            if (!result.Success)
                return BadRequest("Profile update failed. " + result.Message);

            return Ok("Profile updated successfully.");
        }


    }
}
