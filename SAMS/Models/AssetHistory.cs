using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class AssetHistory : EntityBase
{
    public long Id { get; set; }

    public long AssetId { get; set; }

    public long AssignEmployeeId { get; set; }

    public string? Action { get; set; }

    public string? Note { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual UserProfile AssignEmployee { get; set; } = null!;
}
