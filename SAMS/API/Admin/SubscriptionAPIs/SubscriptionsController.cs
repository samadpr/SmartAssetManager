using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.Admin.SubscriptionAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Services.Admin.Subscriptions.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.Admin.SubscriptionAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class SubscriptionsController : BaseApiController<SubscriptionsController>
    {
        private readonly ISubscriptionsService _service;
        public SubscriptionsController(ISubscriptionsService service)
        {
            _service = service;
        }

        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpPost("admin/subscription/create")]
        public async Task<IActionResult> Create([FromBody] SubscriptionRequestObject request, [FromQuery] int companyId)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";

            var result = await _service.CreateAsync(request, user, companyId);

            if (!result.success)
                return BadRequest(new { message = result.message, success = result.success});

            return Ok(new { message = result.message, success = result.success, data = result.data });
        }

        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpPut("admin/subscription/update")]
        public async Task<IActionResult> Update([FromBody] SubscriptionRequestObject request, [FromQuery] int companyId)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";

            var result = await _service.UpdateAsync(request, user, companyId);

            if (!result.success)
                return BadRequest(new { message = result.message, success = result.success});

            return Ok(new { message = result.message, success = result.success, data = result.data });
        }

        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpGet("admin/subscription/get-by-id")]
        public async Task<IActionResult> GetById([FromQuery] long id)
        {
            var result = await _service.GetByIdAsync(id);

            if (!result.success)
                return NotFound(new { message = result.message, success = result.success});

            return Ok(new { message = result.message, success = result.success, data = result.data });
        }

        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpGet("admin/admin/subscription/get-all")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();

            return Ok(new { message = result.message, success = result.success, data = result.data });
        }

        //[Authorize(Roles = RoleModels.Admin)]
        //[HttpGet("admin/subscription/get-by-custom")]
        //public async Task<IActionResult> GetByIsCustom([FromQuery] bool isCustom)
        //{
        //    var result = await _service.GetByIsCustomAsync(isCustom);

        //    if (!result.success)
        //        return BadRequest(new { message = result.message, success = result.success });

        //    return Ok(new
        //    {
        //        message = result.message,
        //        success = result.success,
        //        data = result.data
        //    });
        //}

        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpDelete("admin/subscription/delete")]
        public async Task<IActionResult> Delete([FromQuery] long id)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";

            var result = await _service.DeleteAsync(id, user);

            if (!result.success)
                return BadRequest(new { message = result.message, success = result.success});

            return Ok(new { message = result.message, success = result.success });
        }
    }
}
