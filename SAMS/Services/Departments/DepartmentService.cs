using System;
using AutoMapper;
using SAMS.Models;
using SAMS.Services.Common;
using SAMS.Services.Common.Interface;
using SAMS.Services.Departments.DTOs;
using SAMS.Services.Departments.Interface;
using SAMS.Services.SubDepartments.DTOs;
using SAMS.Services.SubDepartments.Interface;

namespace SAMS.Services.Departments;

public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _repository;
    private readonly ISubDepartmentRepository _subDepartmentRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<DepartmentService> _logger;
    private readonly ICommonService _commonService;

    public DepartmentService(IDepartmentRepository repository, IMapper mapper, ILogger<DepartmentService> logger, ICommonService commonService, ISubDepartmentRepository subDepartmentRepository)
    {
        _repository = repository;
        _subDepartmentRepository = subDepartmentRepository;
        _mapper = mapper;
        _logger = logger;
        _commonService = commonService;
    }

    public async Task<(bool isSuccess, string message, DepartmentDto? result)> AddDepartmentAsync(DepartmentDto dto, string createdBy)
    {
        try
        {
            var entity = _mapper.Map<Department>(dto);
            entity.CreatedDate = DateTime.UtcNow;
            entity.ModifiedDate = DateTime.UtcNow;
            entity.CreatedBy = createdBy;
            entity.ModifiedBy = createdBy;

            var result = await _repository.AddAsync(entity, createdBy);
            if (!result.isSuccess) return (false, result.message, null);
            return (true, "Department added successfully", _mapper.Map<DepartmentDto>(result.result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding department.");
            throw new Exception("An error occurred while adding the department.", ex);
        }
    }

    public async Task<(bool isSuccess, string message, DepartmentDto? result)> UpdateDepartmentAsync(DepartmentDto dto, string modifiedBy)
    {
        try
        {
            var entity = await _repository.GetByIdAsync(dto.Id);
            if (entity.result == null) return (false, entity.message, null);

            entity.result.Name = dto.Name;
            entity.result.Description = dto.Description;
            entity.result.ModifiedDate = DateTime.UtcNow;
            entity.result.ModifiedBy = modifiedBy;

            var result = await _repository.UpdateAsync(entity.result);
            return (true, "Department updated successfully", _mapper.Map<DepartmentDto>(result.result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating department.");
            throw new Exception("An error occurred while updating the department.", ex);
        }
    }

    public async Task<(bool isSuccess, string message, List<Department>? data)> GetDepartmentsAsync(string targetUserEmail)
    {
        var emails = await _commonService.GetEmailsUnderAdminAsync(targetUserEmail);
        if(emails == null) return (false, "No emails found", null);
        var depts = await _repository.GetDepartmentsForUserAsync(emails.ToList());
        return (true, "Departments retrieved successfully", depts);
    }

    public async Task<IEnumerable<Department>> GetUserDepartmentsAsync(string email)
    {
        try
        {
            var depts = await _repository.GetDepartmentsCreatedByAsync(email);
            return depts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user's departments.");
            throw new Exception("An error occurred while retrieving the departments.", ex);
        }
    }

    public async Task<IEnumerable<Department>> GetAllDepartmentsAsync()
    {
        try
        {
            var depts = await _repository.GetAllAsync();
            return depts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving departments.");
            throw new Exception("An error occurred while retrieving the departments.", ex);
        }
    }

    public async Task<(bool isSuccess, string message, Department? result)> GetDepartmentByIdAsync(long id, string email)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(email);

            var department = await _repository.GetByIdAsync(id);
            if (department.result == null) return (false, department.message, null);

            if (emails.Contains(department.result.CreatedBy))
                return (true, department.message, department.result);

            return (false, department.message, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving department by id.");
            throw new Exception("An error occurred while retrieving the department by id.", ex);
        }
    }

    public async Task<(bool isSuccess, string message)> DeleteDepartmentAsync(long id, string modifiedBy)
    {
        try
        {
            var dept = await _repository.GetByIdAsync(id);
            if (dept.result == null) return (false, "Department not found");

            dept.result.ModifiedDate = DateTime.UtcNow;
            dept.result.ModifiedBy = modifiedBy;
            dept.result.Cancelled = true;

            var result = await _repository.UpdateAsync(dept.result);
            if (!result.isSuccess)
                return (false, "An error occurred while deleting the department.");

            return (true, "Department deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting department.");
            throw new Exception("An error occurred while deleting the department.", ex);
        }
    }

    public async Task<(bool isSuccess, string message)> DeleteDepartmentWithSubDepartmentsAsync(long id, string modifiedBy)
    {
        try
        {
            var dept = await _repository.GetByIdAsync(id);
            if (dept.result == null) return (false, "Department not found");

            // Soft delete department
            dept.result.ModifiedDate = DateTime.UtcNow;
            dept.result.ModifiedBy = modifiedBy;
            dept.result.Cancelled = true;

            var result = await _repository.UpdateAsync(dept.result);
            if (!result.isSuccess)
                return (false, "An error occurred while deleting the department.");

            // Soft delete sub-departments
            var subDepartments = await _subDepartmentRepository.GetSubDepartmentsByDepartmentIdAsync(id) ?? new List<SubDepartment>();

            if (subDepartments != null && subDepartments.Any())
            {
                foreach (var subDept in subDepartments)
                {
                    subDept.ModifiedDate = DateTime.UtcNow;
                    subDept.ModifiedBy = modifiedBy;
                    subDept.Cancelled = true;

                    await _subDepartmentRepository.UpdateAsync(subDept);
                }
            }

            return (true, "Department and its sub-departments deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting department and sub-departments.");
            throw new Exception("An error occurred while deleting the department and its sub-departments.", ex);
        }
    }

    public async Task<(bool isSuccess, DepartmentWithSubDepartmentsDto? data, string message)> GetDepartmentWithSubDepartmentsByIdAsync(long id, string email)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(email);
            var department = await _repository.GetDepartmentWithSubDepartmentsByIdAsync(id, emails);
            if (department == null)
                return (false, null, "Department not found");

                var dto = new DepartmentWithSubDepartmentsDto
            {
                Id = department.Id,
                Name = department.Name,
                Description = department.Description,
                SubDepartments = department.SubDepartments
                    .Where(sd => !sd.Cancelled)
                    .Select(sd => new SubDepartmentDto
                    {
                        Id = sd.Id,
                        Name = sd.Name,
                        Description = sd.Description,
                        DepartmentId = sd.DepartmentId
                    })
                    .ToList()
            };

            return (true, dto, "Department retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching department with sub-departments.");
            return (false, null, "An error occurred while fetching department.");
        }
    }

    public async Task<(bool isSuccess, IEnumerable<DepartmentWithSubDepartmentsDto>? data, string message)> GetDepartmentWithSubDepartmentsAsync(string email)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(email);
            var department = await _repository.GetDepartmentWithSubDepartmentsAsync(emails);
            if (department == null)
                return (false, null, "Department not found");

            var dto = department
                .Select(d => new DepartmentWithSubDepartmentsDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    SubDepartments = d.SubDepartments
                        .Where(sd => !sd.Cancelled)
                        .Select(sd => new SubDepartmentDto
                        {
                            Id = sd.Id,
                            Name = sd.Name,
                            Description = sd.Description,
                            DepartmentId = sd.DepartmentId
                        })
                        .ToList()
                })
                .ToList();
            

            return (true, dto, "Department retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching department with sub-departments.");
            return (false, null, "An error occurred while fetching department.");
        }
    }
}
