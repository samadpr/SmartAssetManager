using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class ManageUserRole : EntityBase
{
    public long Id { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public virtual ICollection<ManageUserRolesDetail> ManageUserRolesDetails { get; set; } = new List<ManageUserRolesDetail>();

    public virtual ICollection<UserProfile> UserProfiles { get; set; } = new List<UserProfile>();
}
