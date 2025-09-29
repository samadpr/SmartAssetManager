using System;

namespace SAMS.API.SubDepartmentAPIs.RequestObject;

public class SubDepartmentRequest
{
     public long Id { get; set; }

    public long DepartmentId { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }
}
