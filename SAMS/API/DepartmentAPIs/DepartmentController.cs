using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.DepartmentAPIs.RequstObject;
using SAMS.Controllers;
using SAMS.Services.Departments.DTOs;
using SAMS.Services.Departments.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.DepartmentAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class DepartmentController : BaseApiController<DepartmentController>
    {
        private readonly IDepartmentService _departmentService;
        private readonly IMapper _mapper;

        public DepartmentController(IDepartmentService departmentService, IMapper mapper)
        {
            _departmentService = departmentService;
            _mapper = mapper;
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpPost("department/create-department")]
        public async Task<IActionResult> CreateDepartment([FromBody] DepartmentRequest requestObject)
        {
            if (requestObject == null) return BadRequest("Request Object is null");
            var user = HttpContext.User.Identity?.Name ?? "System";
            var dto = _mapper.Map<DepartmentDto>(requestObject);
            var result = await _departmentService.AddDepartmentAsync(dto, user);
            if (!result.isSuccess)
                return BadRequest(new { success = result.isSuccess, message = result.message });
            return Ok(new { success = result.isSuccess, message = result.message, data = result.result });
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpPut("department/update-department")]
        public async Task<IActionResult> UpdateDepartment([FromBody] DepartmentRequest requestObject)
        {
            if (requestObject == null) return BadRequest("Request Object is null");
            var user = HttpContext.User.Identity?.Name ?? "System";
            var dto = _mapper.Map<DepartmentDto>(requestObject);
            var result = await _departmentService.UpdateDepartmentAsync(dto, user);
            if (result.result == null)
                return NotFound(new { success = result.isSuccess, message = result.message });
            return Ok(new { success = result.isSuccess, message = result.message, data = result.result });
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpGet("department/get-departments")]
        public async Task<IActionResult> GetDepartments()
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _departmentService.GetDepartmentsAsync(user);
            if (result == null || !result.Any())
                return NotFound(new { success = false, message = "No departments found" });
            return Ok(new { success = true, message = "Departments found", data = result });
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpGet("department/get-my-departments")]
        public async Task<IActionResult> GetMyDepartments()
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            if (user == null) return Forbid();
            var result = await _departmentService.GetUserDepartmentsAsync(user);
            if (result == null || !result.Any())
                return NotFound($"No department found");
            return Ok(result);
        }

        [Authorize(Roles = RoleModels.SuperAdmin)]
        [HttpGet("department/get-all-departments")]
        public async Task<IActionResult> GetAllDepartments()
        {
            // keep same double-role check style you used in DesignationController
            if (User.IsInRole(RoleModels.Department) && User.IsInRole(RoleModels.SuperAdmin))
            {
                var result = await _departmentService.GetAllDepartmentsAsync();
                if (result == null || !result.Any())
                    return NotFound(new { success = false, message = "No departments found"});
                return Ok(new { success = true, message = "Departments found", data = result });
            }
            else
            {
                return Forbid("You have no authorized to access this API.");
            }
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpGet("department/get-department-by-id")]
        public async Task<IActionResult> GetDepartmentById([FromQuery] long id)
        {
            if (id <= 0) return BadRequest("Invalid ID");
            var user = HttpContext.User.Identity?.Name ?? "System";
            if (user == null) return Forbid();

            var result = await _departmentService.GetDepartmentByIdAsync(id, user);
            if (result.result == null)
                return NotFound(new { success = false, message = "No department found with ID: " + id });
            return Ok(new { success = result.isSuccess, message = "Department found", data = result.result });
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpGet("department/get-department-with-sub-departments-by-id")]
        public async Task<IActionResult> GetDepartmentWithSubDepartments([FromQuery] long id)
        {
            if (id <= 0) return BadRequest("Invalid ID");
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _departmentService.GetDepartmentWithSubDepartmentsByIdAsync(id, user);

            if (!result.isSuccess)
                return NotFound(new { success = result.isSuccess, message = result.message });

            return Ok(new { success = result.isSuccess, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpGet("department/get-department-with-sub-departments")]
        public async Task<IActionResult> GetDepartmentWithSubDepartments()
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _departmentService.GetDepartmentWithSubDepartmentsAsync(user);

            if (!result.isSuccess)
                return NotFound(new { success = result.isSuccess, message = result.message });

            return Ok(new { success = result.isSuccess, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpDelete("department/delete-department")]
        public async Task<IActionResult> DeleteDepartment([FromQuery] long id)
        {
            if (id <= 0) return BadRequest("Invalid ID");
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _departmentService.DeleteDepartmentAsync(id, user);
            if (!result.isSuccess) return NotFound(new { success = result.isSuccess, message = result.message });
            return Ok(new { success = result.isSuccess, message = result.message });
        }

        [Authorize(Roles = RoleModels.Department)]
        [HttpDelete("department/delete-department-with-sub-departments")]
        public async Task<IActionResult> DeleteDepartmentWithSubDepartments(long id)
        {
            if (id <= 0) return BadRequest("Invalid ID");
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _departmentService.DeleteDepartmentWithSubDepartmentsAsync(id, user);

            if (!result.isSuccess)
                return BadRequest(new { success = false, message = result.message });

            return Ok(new { success = true, message = result.message });
        }
    }

}
