using System;
using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Departments.Interface;

namespace SAMS.Services.Departments;

public class DepartmentRepository : IDepartmentRepository
{
    private readonly ApplicationDbContext _context;

    public DepartmentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(bool isSuccess, string message, Department? result)> AddAsync(Department department, string createdByEmail)
    {
        var exists = await _context.Department
            .FirstOrDefaultAsync(d => d.Name == department.Name && d.CreatedBy == createdByEmail && !d.Cancelled);

        if (exists != null) return (false, "Department already exists", null);

        _context.Department.Add(department);
        await _context.SaveChangesAsync();
        return (true, "Department added successfully", department);
    }

    public async Task<(bool isSuccess, string message, Department? result)> UpdateAsync(Department department)
    {
        _context.Department.Update(department);
        await _context.SaveChangesAsync();
        return (true, "Department updated successfully", department);
    }

    public async Task<(bool isSuccess, string message, Department? result)> GetByIdAsync(long id)
    {
        var department = await _context.Department.FirstOrDefaultAsync(d => d.Id == id && !d.Cancelled);
        if (department == null) return (false, "Department not found", null);
        return (true, "Department found", department);
    }

    public async Task<IEnumerable<Department>> GetDepartmentsCreatedByAsync(string createdByEmail) =>
            await _context.Department.Where(d => d.CreatedBy == createdByEmail && !d.Cancelled).ToListAsync();


    public async Task<List<Department>> GetDepartmentsForUserAsync(List<string> emails)
    {
        var departments = await _context.Department
            .Where(d => emails.Contains(d.CreatedBy) && !d.Cancelled)
            .OrderByDescending(d => d.CreatedDate)
            .ToListAsync();

        return departments ?? new List<Department>();
    }

    public async Task<IEnumerable<Department>> GetAllAsync() =>
            await _context.Department.Where(d => !d.Cancelled).ToListAsync();

    
    public async Task<Department?> GetDepartmentWithSubDepartmentsByIdAsync(long departmentId, List<string> emails)
    {
        return await _context.Department
            .Include(d => d.SubDepartments)   // EF navigation property
            .FirstOrDefaultAsync(d => d.Id == departmentId && !d.Cancelled && emails.Contains(d.CreatedBy));
    }

    public async Task<IEnumerable<Department?>> GetDepartmentWithSubDepartmentsAsync(List<string> emails)
    {
        return await _context.Department
            .Include(d => d.SubDepartments)   // EF navigation property
            .Where(d => !d.Cancelled && emails.Contains(d.CreatedBy))
            .ToListAsync();
    }
}
