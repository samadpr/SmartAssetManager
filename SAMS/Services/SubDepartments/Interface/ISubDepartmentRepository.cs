using System;
using SAMS.Models;
using SAMS.Services.SubDepartments.DTOs;

namespace SAMS.Services.SubDepartments.Interface;

public interface ISubDepartmentRepository
{
    Task<(bool isSuccess, string message, SubDepartment? result)> AddAsync(SubDepartment subDepartment);
    Task<(bool isSuccess, string message, SubDepartment? result)> UpdateAsync(SubDepartment subDepartment);
    Task<(bool isSuccess, string message, SubDepartment? result)> GetByIdAsync(long id);
    Task<IEnumerable<SubDepartment>> GetSubDepartmentsByDepartmentIdAsync(long departmentId);
    Task<IEnumerable<SubDepartmentDto>> GetSubDepartmentsAsync(List<string> emails);
}
