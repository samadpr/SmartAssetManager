using System;
using AutoMapper;
using SAMS.Models;
using SAMS.Services.Common.Interface;
using SAMS.Services.SubDepartments.DTOs;
using SAMS.Services.SubDepartments.Interface;

namespace SAMS.Services.SubDepartments;

public class SubDepartmentService : ISubDepartmentService
{
    private readonly ISubDepartmentRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<SubDepartmentService> _logger;
    private readonly ICommonService _commonService;


    public SubDepartmentService(ISubDepartmentRepository repository, IMapper mapper, ILogger<SubDepartmentService> logger, ICommonService commonService)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
        _commonService = commonService;
    }

    public async Task<(bool isSuccess, string message, SubDepartmentDto? result)> AddSubDepartmentAsync(SubDepartmentDto dto, string createdBy)
    {
        try
        {
            var entity = _mapper.Map<SubDepartment>(dto);
            entity.CreatedBy = createdBy;
            entity.ModifiedBy = createdBy;
            entity.CreatedDate = DateTime.UtcNow;
            entity.ModifiedDate = DateTime.UtcNow;

            var result = await _repository.AddAsync(entity);
            if (!result.isSuccess) return (false, result.message, null);

            return (true, "SubDepartment added successfully", _mapper.Map<SubDepartmentDto>(result.result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding sub-department");
            throw new Exception("An error occurred while adding the sub-department.", ex);
        }
    }

    public async Task<(bool isSuccess, string message, SubDepartmentDto? result)> UpdateSubDepartmentAsync(SubDepartmentDto dto, string modifiedBy)
    {
        var entity = await _repository.GetByIdAsync(dto.Id);
        if (entity.result == null) return (false, entity.message, null);

        entity.result.Name = dto.Name;
        entity.result.Description = dto.Description;
        entity.result.ModifiedBy = modifiedBy;
        entity.result.ModifiedDate = DateTime.UtcNow;

        var result = await _repository.UpdateAsync(entity.result);
        return (true, "SubDepartment updated successfully", _mapper.Map<SubDepartmentDto>(result.result));
    }


    public async Task<(bool isSuccess, string message, IEnumerable<SubDepartmentDto>? result)> GetSubDepartmentsByDepartmentIdAsync(long id, string email)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(email);
            if (emails == null || !emails.Any())
                return (false, "No emails found for this admin.", null);

            var subDepartments = await _repository.GetSubDepartmentsByDepartmentIdAsync(id);

            // ✅ Filter based on CreatedBy email being in allowed group
            var filteredSubDepartments = subDepartments
                .Where(sd => emails.Contains(sd.CreatedBy))
                .ToList();

            if (!filteredSubDepartments.Any())
                return (false, "No sub-departments found for this users.", null);

            // Map to DTOs if repository returns entities
            var result = _mapper.Map<IEnumerable<SubDepartmentDto>>(filteredSubDepartments);

            return (true, "Sub-departments found.", result);

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sub-departments by department ID");
            throw new Exception("An error occurred while retrieving the sub-departments by department ID.", ex);
        }
    }

    public async Task<(bool isSuccess, string message, IEnumerable<SubDepartmentDto>? result)> GetSubDepartmentsAsync(string email)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(email);
            if (emails == null || !emails.Any())
                return (false, "No emails found for this email.", null);

            var subDepartments = await _repository.GetSubDepartmentsAsync(emails);
            if (subDepartments == null || !subDepartments.Any())
                return (false, "No sub-departments found.", null);

            var result = _mapper.Map<IEnumerable<SubDepartmentDto>>(subDepartments);
            return (true, "Sub-departments found.", result);


        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sub-departments");
            throw new Exception("An error occurred while retrieving the sub-departments.", ex);
        }
    }

    public async Task<(bool isSuccess, string message)> DeleteSubDepartmentAsync(long id, string modifiedBy)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity.result == null) return (false, "SubDepartment not found");

        entity.result.ModifiedBy = modifiedBy;
        entity.result.ModifiedDate = DateTime.UtcNow;
        entity.result.Cancelled = true;

        await _repository.UpdateAsync(entity.result);
        return (true, "SubDepartment deleted successfully");
    }
}
