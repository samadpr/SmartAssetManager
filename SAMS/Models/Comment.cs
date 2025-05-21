using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class Comment : EntityBase
{
    public long Id { get; set; }

    public long AssetId { get; set; }

    public string? Message { get; set; }

    public bool IsDeleted { get; set; }

    public bool IsAdmin { get; set; }

    public virtual Asset Asset { get; set; } = null!;
}
