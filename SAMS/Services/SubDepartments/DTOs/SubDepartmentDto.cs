using System;

namespace SAMS.Services.SubDepartments.DTOs;

public class SubDepartmentDto
{
    public long Id { get; set; }

    public long DepartmentId { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }
}
