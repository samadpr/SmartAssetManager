using System;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.SubDepartments.DTOs;
using SAMS.Services.SubDepartments.Interface;

namespace SAMS.Services.SubDepartments;

public class SubDepartmentRepository : ISubDepartmentRepository
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public SubDepartmentRepository(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<(bool isSuccess, string message, SubDepartment? result)> AddAsync(SubDepartment subDepartment)
    {
        var exists = await _context.SubDepartment
            .FirstOrDefaultAsync(s => s.Name == subDepartment.Name && s.DepartmentId == subDepartment.DepartmentId && !s.Cancelled);

        if (exists != null) return (false, "SubDepartment already exists", null);

        _context.SubDepartment.Add(subDepartment);
        await _context.SaveChangesAsync();
        return (true, "SubDepartment added successfully", subDepartment);
    }

    public async Task<(bool isSuccess, string message, SubDepartment? result)> UpdateAsync(SubDepartment subDepartment)
    {
        _context.SubDepartment.Update(subDepartment);
        await _context.SaveChangesAsync();
        return (true, "SubDepartment updated successfully", subDepartment);
    }

    public async Task<(bool isSuccess, string message, SubDepartment? result)> GetByIdAsync(long id)
    {
        var subDepartment = await _context.SubDepartment.FirstOrDefaultAsync(s => s.Id == id && !s.Cancelled);
        if (subDepartment == null) return (false, "SubDepartment not found", null);
        return (true, "SubDepartment found", subDepartment);
    }

    public async Task<IEnumerable<SubDepartment>> GetSubDepartmentsByDepartmentIdAsync(long departmentId)
    {
        var subDepartments = await _context.SubDepartment
            .Where(sd => sd.DepartmentId == departmentId && !sd.Cancelled)
            .ToListAsync();

        if (subDepartments == null) return Enumerable.Empty<SubDepartment>();

        return subDepartments;
    }

    public async Task<IEnumerable<SubDepartmentDto>> GetSubDepartmentsAsync(List<string> emails)
    {
        return await _context.SubDepartment
            .Where(sd => !sd.Cancelled && emails.Contains(sd.CreatedBy))
            .Join(_context.Department,
                  sd => sd.DepartmentId,
                  d => d.Id,
                  (sd, d) => new SubDepartmentDto
                  {
                      Id = sd.Id,
                      DepartmentId = sd.DepartmentId,
                      DepartmentDisplay = d.Name,
                      Name = sd.Name,
                      Description = sd.Description
                  })
            .OrderByDescending(x => x.Id)
            .ToListAsync();
    }

}
