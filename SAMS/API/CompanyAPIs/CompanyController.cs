using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.CompanyAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Models;
using SAMS.Services.Company.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.API.CompanyAPIs
{

    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class CompanyController : BaseApiController<CompanyController>
    {
        private readonly ICompanyService _companyService;
        private readonly IMapper _mapper;

        public CompanyController(ICompanyService companyService, IMapper mapper)
        {
            _companyService = companyService;
            _mapper = mapper;
        }

        [Authorize(Roles = RoleModels.Admin)]
        [HttpPost("company/add-company")]
        public async Task<IActionResult> AddCompany([FromBody] CompanyRequestObject companyRequestObject)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var mappedRequest = _mapper.Map<CompanyInfo>(companyRequestObject);
            var response =  await _companyService.AddCompanyAsync(mappedRequest, user);
            return Ok(new { success = response.isSuccess, message = response.message });
        }

        [Authorize(Roles = RoleModels.Admin)]
        [HttpPut("company/update-company")]
        public async Task<IActionResult> UpdateCompany([FromBody] CompanyRequestObject companyRequestObject)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var mappedRequest = _mapper.Map<CompanyInfo>(companyRequestObject);
            var response = await _companyService.UpdateCompanyAsync(mappedRequest, user);
            return Ok(new { success = response.isSuccess, message = response.message });
        }

        [Authorize(Roles = RoleModels.Admin)]
        [HttpGet("company/get-company")]
        public async Task<IActionResult> GetCompanies()
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var response = await _companyService.GetCompaniesAsync(user);
            return Ok(new { success = response.isSuccess, message = response.message, data = response.data });
        }

        [Authorize(Roles = RoleModels.Admin)]
        [HttpGet("company/get-company-by-id")]
        public async Task<IActionResult> GetCompany(long id)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var response = await _companyService.GetCompanyByIdAsync(id, user);
            return Ok(new { success = response.isSuccess, message = response.message, data = response.data });
        }

        [Authorize(Roles = RoleModels.Admin)]
        [HttpDelete("company/delete-company")]
        public async Task<IActionResult> DeleteCompany(long id)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var response = await _companyService.DeleteCompanyAsync(id, user);
            return Ok(new { success = response.isSuccess, message = response.message });
        }
    }
}
