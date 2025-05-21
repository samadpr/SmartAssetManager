using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class ManageUserRolesDetail : EntityBase
{
    public long Id { get; set; }

    public long ManageRoleId { get; set; }

    public string? RoleId { get; set; }

    public string? RoleName { get; set; }

    public bool IsAllowed { get; set; }

    public virtual ManageUserRole ManageRole { get; set; } = null!;
}
