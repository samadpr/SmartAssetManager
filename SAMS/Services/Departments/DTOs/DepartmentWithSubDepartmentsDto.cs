using System;
using SAMS.Services.SubDepartments.DTOs;

namespace SAMS.Services.Departments.DTOs;

public class DepartmentWithSubDepartmentsDto
{
    public long Id { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }
    public List<SubDepartmentDto> SubDepartments { get; set; } = new();
}
