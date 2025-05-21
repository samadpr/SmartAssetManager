using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SAMS.Controllers;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.Account
{
    [ApiController]
    [Authorize]
    public class UserProfileController : BaseApiController<UserProfileController>
    {
        [HttpGet("account/get-profile-details")]
        [Authorize(Roles = RoleModels.UserProfile)]
        public IActionResult GetProfileDetails()
        {
            return Ok("you have accessed your profile");
        }
    }
}
