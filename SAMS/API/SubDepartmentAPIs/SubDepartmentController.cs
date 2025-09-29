using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.SubDepartmentAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Services.Departments.Interface;
using SAMS.Services.Roles.PagesModel;
using SAMS.Services.SubDepartments.DTOs;
using SAMS.Services.SubDepartments.Interface;

namespace SAMS.API.SubDepartmentAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class SubDepartmentController : BaseApiController<SubDepartmentController>
    {

        private readonly ISubDepartmentService _subDepartmentService;
        private readonly IMapper _mapper;

        public SubDepartmentController(ISubDepartmentService subDepartmentService, IMapper mapper)
        {
            _subDepartmentService = subDepartmentService;
            _mapper = mapper;
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpPost("sub-department/create")]
        public async Task<IActionResult> CreateSubDepartment([FromBody] SubDepartmentRequest request)
        {
            if (request == null) return BadRequest("Request object is null");
            var user = HttpContext.User.Identity?.Name ?? "System";

            var dto = _mapper.Map<SubDepartmentDto>(request);
            var result = await _subDepartmentService.AddSubDepartmentAsync(dto, user);

            if (!result.isSuccess)
                return BadRequest(new { success = result.isSuccess, message = result.message });

            return Ok(new { success = result.isSuccess, message = result.message, data = result.result });
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpPut("sub-department/update")]
        public async Task<IActionResult> UpdateSubDepartment([FromBody] SubDepartmentRequest request)
        {
            if (request == null) return BadRequest("Request object is null");
            var user = HttpContext.User.Identity?.Name ?? "System";

            var dto = _mapper.Map<SubDepartmentDto>(request);
            var result = await _subDepartmentService.UpdateSubDepartmentAsync(dto, user);

            if (result.result == null)
                return NotFound(new { success = result.isSuccess, message = result.message });

            return Ok(new { success = result.isSuccess, message = result.message, data = result.result });
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpGet("sub-department/get-by-department-id")]
        public async Task<IActionResult> GetSubDepartmentByDepartmentId([FromQuery] long id)
        {
            if (id <= 0) return BadRequest("ID is null");
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _subDepartmentService.GetSubDepartmentsByDepartmentIdAsync(id, user);
            if (result.result == null || result.isSuccess == false)
                return NotFound(new { success = false, message = "No sub-departments found" });
            return Ok(new { success = true, message = result.message, data = result.result });
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpGet("sub-department/get-sub-department")]
        public async Task<IActionResult> GetSubDepartment()
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _subDepartmentService.GetSubDepartmentsAsync(user);
            if (result.result == null || !result.isSuccess)
                return NotFound(new { success = false, message = "No sub-departments found" });
            return Ok(new { success = true, message = "Sub-departments found", data = result.result });
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpDelete("sub-department/delete")]
        public async Task<IActionResult> DeleteSubDepartment([FromQuery] long id)
        {
            if (id <= 0) return BadRequest("Invalid ID");

            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _subDepartmentService.DeleteSubDepartmentAsync(id, user);

            if (!result.isSuccess) return NotFound(new { success = result.isSuccess, message = result.message });

            return Ok(new { success = result.isSuccess, message = result.message });
        }

    }
}
