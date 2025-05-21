using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class Department : EntityBase
{
    public long Id { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual ICollection<SubDepartment> SubDepartments { get; set; } = new List<SubDepartment>();

    public virtual ICollection<UserProfile> UserProfiles { get; set; } = new List<UserProfile>();
}
