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
        private readonly IWebHostEnvironment _env;

        public UserProfileController(IUserProfileService userProfileService, IMapper mapper, IWebHostEnvironment env)
        {
            _userProfileService = userProfileService;
            Mapper = mapper;
            _env = env;
        }

        [Authorize(Roles = RoleModels.UserProfile)]
        [HttpGet("account/get-profile-data")]
        public async Task<IActionResult> GetProfileData()
        {
            var user = HttpContext.User.Identity?.Name ?? "System";

            var userProfile = await _userProfileService.GetProfileData(user);
            if (userProfile == null)
                return NotFound();

            return Ok(userProfile);
        }

        [Authorize(Roles = RoleModels.UserProfile)]
        [HttpGet("account/get-profile-details")]
        public async Task<IActionResult> GetProfileDetails()
        {
            var user = HttpContext.User.Identity?.Name ?? "System";

            var userProfile = await _userProfileService.GetProfileDetails(user);
            if (!userProfile.isSuccess)
                return NotFound(userProfile.message);

            return Ok(userProfile.responseObject);
        }

        [Authorize(Roles = RoleModels.UserProfile)]
        [HttpPut("account/update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UserProfileRequestObject request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = HttpContext.User.Identity?.Name ?? "System";
            if (user == null || user == "")
                return BadRequest("User not found.");
            var result = await _userProfileService.UpdateProfileAsync(request, user);
            if (!result.Success)
                return BadRequest("Profile update failed. " + result.Message);

            return Ok((result.Success, "Profile updated successfully."));
        }

        [Authorize(Roles = RoleModels.UserProfile)]
        [HttpPost("account/upload-profile-picture")]
        [Consumes("multipart/form-data")] // 👈 tells Swagger it's a file upload
        public async Task<IActionResult> UploadProfilePicture([FromForm] FileUploadDto dto)
        {
            var file = dto.File;
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif" };
            if (!allowedTypes.Contains(file.ContentType))
                return BadRequest("Only JPG, PNG, and GIF are allowed.");

            var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            if (!Directory.Exists(rootPath))
                Directory.CreateDirectory(rootPath);

            var uploadPath = Path.Combine(rootPath, "uploads", "profile");
            if (!Directory.Exists(uploadPath))
                Directory.CreateDirectory(uploadPath);

            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Generate public URL (your Angular app should know how to access it)
            var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/profile/{fileName}";

            return Ok(new { url = fileUrl });
        }


        [Authorize(Roles = RoleModels.UserManagement)]
        [HttpPost("user-profile/create-user-profile")]
        public async Task<IActionResult> CreateUserProfile([FromBody] UserProfileRequestObject request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = HttpContext.User.Identity?.Name ?? "System";
            var mappedProfile = Mapper.Map<UserProfileDto>(request);
            var result = await _userProfileService.CreateUserProfileAsync(mappedProfile, user);
            if (!result.Success)
                return BadRequest(new { success = false, message = "User profile creation failed. " + result.Message });

            return Ok(new { success = result.Success, message = result.Message });
        }

        [Authorize(Roles = RoleModels.UserManagement)]
        [HttpGet("user-profile/get-created-users-profile")]
        public async Task<IActionResult> GetCreatedUsersProfile()
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _userProfileService.GetCreatedUsersProfile(user);
            if (result == Empty)
                return NotFound(new { success = false, message = "No user profile found." });
            return Ok(new { success = true, message = "User profile fetched successfully", data = result });
        }

        [HttpPost("user-profile/user-email-confirm")]
        public async Task<IActionResult> UserEmailConfirm([FromQuery] string userId, [FromQuery] string token)
        {
            var result = await _userProfileService.UserEmailConfirmAsync(userId, token);
            if (result.Success) return Ok(new { result.Message , isLoginAccess = result.isLoginAccess});
            return BadRequest(new { result.Message , isLoginAccess = result.isLoginAccess});
        }

        [Authorize(Roles = RoleModels.UserManagement)]
        [HttpGet("user-profile/get-created-user-profiles-details")]
        public async Task<IActionResult> GetCreatedUserProfilesDetails()
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _userProfileService.GetCreatedUserProfilesDetails(user);
            if (!result.isSuccess)
                return NotFound(new { success = false, message = "No user profile found." });
            return Ok(new { success = true, message = "User profile fetched successfully", data = result.responseObject });
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
                return BadRequest(new { success = false, message = "User profile update failed. " + result.message });
            return Ok(new { success = true, message = "User profile updated successfully" });
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
        [HttpGet("user-profile/get-user-profiles-used-in-role-id")]
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
