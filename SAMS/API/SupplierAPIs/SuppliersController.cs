using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.SupplierAPIs.RequestObject;
using SAMS.Controllers;
using SAMS.Helpers;
using SAMS.Services.Roles.PagesModel;
using SAMS.Services.Suppliers.DTOs;
using SAMS.Services.Suppliers.Interface;

namespace SAMS.API.SupplierAPIs
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class SuppliersController : BaseApiController<SuppliersController>
    {
        private readonly ISuppliersService _service;
        private readonly IMapper _mapper;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<SuppliersController> _logger;
        private readonly ICompanyContext _companyContext;

        public SuppliersController(ISuppliersService suppliersService, IMapper mapper, IWebHostEnvironment env, ILogger<SuppliersController> logger, ICompanyContext companyContext)
        {
            _service = suppliersService;
            _mapper = mapper;
            _env = env;
            _logger = logger;
            _companyContext = companyContext;
        }

        [Authorize(Roles = RoleModels.Supplier)]
        [HttpPost("supplier/create")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create(SuppliersRequestObject request)
        {
            try
            {
                string tradeLicensePath = null;

                // 1. File upload
                if (request.TradeLicense != null)
                {
                    var file = request.TradeLicense;

                    var allowedTypes = new[] { "image/jpeg", "image/png", "application/pdf" };
                    if (!allowedTypes.Contains(file.ContentType))
                        return BadRequest("Only JPG, PNG, and PDF allowed.");

                    var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var uploadPath = Path.Combine(rootPath, "uploads", "TradeLicense");

                    if (!Directory.Exists(uploadPath))
                        Directory.CreateDirectory(uploadPath);

                    // keep original name, handle duplicates
                    var baseName = Path.GetFileNameWithoutExtension(file.FileName);
                    var ext = Path.GetExtension(file.FileName);
                    var finalName = file.FileName;
                    int counter = 1;

                    while (System.IO.File.Exists(Path.Combine(uploadPath, finalName)))
                    {
                        finalName = $"{baseName}({counter}){ext}";
                        counter++;
                    }

                    var filePath = Path.Combine(uploadPath, finalName);
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    tradeLicensePath = $"/uploads/TradeLicense/{finalName}";
                }

                // 2. Map to DTO
                var dto = new SupplierDto
                {
                    Name = request.Name,
                    ContactPerson = request.ContactPerson,
                    Email = request.Email,
                    Phone = request.Phone,
                    Address = request.Address,
                    TradeLicense = tradeLicensePath
                };

                // 3. Create supplier
                var user = HttpContext.User.Identity?.Name ?? "System";
                var result = await _service.CreateAsync(dto, user);

                return Ok(new { success = result.success, message = result.message, data = result.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in supplier create");
                return StatusCode(500, new { success = false, message = "Supplier creation failed" });
            }
        }

        [Authorize(Roles = RoleModels.Supplier)]
        [HttpPut("supplier/update")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Update(SuppliersRequestObject request)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var existingSupplier = await _service.GetByIdAsync(request.Id, orgId);

                if (existingSupplier == null)
                    return NotFound(new { success = false, message = "Supplier not found" });

                string tradeLicensePath = existingSupplier.TradeLicense; // keep old path

                // If a new file is uploaded
                if (request.TradeLicense != null)
                {
                    var file = request.TradeLicense;

                    var allowedTypes = new[] { "image/jpeg", "image/png", "application/pdf" };
                    if (!allowedTypes.Contains(file.ContentType))
                        return BadRequest("Only JPG, PNG, and PDF files are allowed.");

                    var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var uploadPath = Path.Combine(rootPath, "uploads", "TradeLicense");

                    if (!Directory.Exists(uploadPath))
                        Directory.CreateDirectory(uploadPath);

                    // keep original name, generate suffix if duplicate
                    var fileName = file.FileName;
                    var ext = Path.GetExtension(fileName);
                    var baseName = Path.GetFileNameWithoutExtension(fileName);

                    int counter = 1;
                    string finalName = fileName;

                    while (System.IO.File.Exists(Path.Combine(uploadPath, finalName)))
                    {
                        finalName = $"{baseName}({counter}){ext}";
                        counter++;
                    }

                    var filePath = Path.Combine(uploadPath, finalName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    tradeLicensePath = $"/uploads/TradeLicense/{finalName}";
                }

                // Map update values
                var dto = new SupplierDto
                {
                    Id = request.Id,
                    Name = request.Name,
                    ContactPerson = request.ContactPerson,
                    Email = request.Email,
                    Phone = request.Phone,
                    Address = request.Address,
                    TradeLicense = tradeLicensePath,
                };

                var user = HttpContext.User.Identity?.Name ?? "System";
                var result = await _service.UpdateAsync(dto, user);

                return Ok(new { success = result.success, message = result.message, data = result.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating supplier");
                return StatusCode(500, new { success = false, message = "Supplier update failed" });
            }
        }

        [Authorize(Roles = RoleModels.Supplier)]
        [HttpGet("supplier/get-by-org")]
        public async Task<IActionResult> GetByOrg()
        {
            var result = await _service.GetByOrganizationAsync();

            return Ok(new { success = result.success, message = result.message, data = result.data });
        }

        [Authorize(Roles = RoleModels.Supplier)]
        [HttpDelete("supplier/delete")]
        public async Task<IActionResult> Delete(long id)
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var result = await _service.DeleteAsync(id, user);

            return Ok(new { success = result.success, message = result.message });
        }
    }
}
