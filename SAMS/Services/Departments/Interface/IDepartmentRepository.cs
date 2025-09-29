using System;
using SAMS.Models;

namespace SAMS.Services.Departments.Interface;

public interface IDepartmentRepository
{
    Task<(bool isSuccess, string message, Department? result)> AddAsync(Department department, string createdByEmail);
    Task<(bool isSuccess, string message, Department? result)> UpdateAsync(Department department);
    Task<(bool isSuccess, string message, Department? result)> GetByIdAsync(long id);
    Task<List<Department>> GetDepartmentsForUserAsync(List<string> emails);
    Task<IEnumerable<Department>> GetDepartmentsCreatedByAsync(string createdByEmail);
    Task<IEnumerable<Department>> GetAllAsync();
    Task<Department?> GetDepartmentWithSubDepartmentsAsync(long departmentId, List<string> emails);
    
}
