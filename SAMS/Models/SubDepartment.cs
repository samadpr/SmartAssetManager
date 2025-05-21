using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class SubDepartment : EntityBase
{
    public long Id { get; set; }

    public long DepartmentId { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual Department Department { get; set; } = null!;

    public virtual ICollection<UserProfile> UserProfiles { get; set; } = new List<UserProfile>();
}
