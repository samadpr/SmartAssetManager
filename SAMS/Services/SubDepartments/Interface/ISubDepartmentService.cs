using System;
using SAMS.Services.SubDepartments.DTOs;

namespace SAMS.Services.SubDepartments.Interface;

public interface ISubDepartmentService
{
    Task<(bool isSuccess, string message, SubDepartmentDto? result)> AddSubDepartmentAsync(SubDepartmentDto dto, string createdBy);
    Task<(bool isSuccess, string message, SubDepartmentDto? result)> UpdateSubDepartmentAsync(SubDepartmentDto dto, string modifiedBy);
    Task<(bool isSuccess, string message, IEnumerable<SubDepartmentDto>? result)> GetSubDepartmentsByDepartmentIdAsync(long id, string user);
    Task<(bool isSuccess, string message, IEnumerable<SubDepartmentDto>? result)> GetSubDepartmentsAsync(string email);
    Task<(bool isSuccess, string message)> DeleteSubDepartmentAsync(long id, string modifiedBy);
    
}
