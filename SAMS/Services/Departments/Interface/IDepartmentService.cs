using System;
using SAMS.Models;
using SAMS.Services.Departments.DTOs;

namespace SAMS.Services.Departments.Interface;

public interface IDepartmentService
{
    Task<(bool isSuccess, string message, DepartmentDto? result)> AddDepartmentAsync(DepartmentDto dto, string createdBy);
    Task<(bool isSuccess, string message, DepartmentDto? result)> UpdateDepartmentAsync(DepartmentDto dto, string modifiedBy);
    Task<(bool isSuccess, string message, List<Department>? data)> GetDepartmentsAsync(string targetUserEmail);
    Task<IEnumerable<Department>> GetUserDepartmentsAsync(string email);
    Task<IEnumerable<Department>> GetAllDepartmentsAsync();
    Task<(bool isSuccess, string message, Department? result)> GetDepartmentByIdAsync(long id, string email);
    Task<(bool isSuccess, string message)> DeleteDepartmentAsync(long id, string modifiedBy);
    Task<(bool isSuccess, string message)> DeleteDepartmentWithSubDepartmentsAsync(long id, string modifiedBy);
    Task<(bool isSuccess, DepartmentWithSubDepartmentsDto? data, string message)> GetDepartmentWithSubDepartmentsByIdAsync(long id, string email);
    Task<(bool isSuccess, IEnumerable<DepartmentWithSubDepartmentsDto>? data, string message)> GetDepartmentWithSubDepartmentsAsync(string email);
}
