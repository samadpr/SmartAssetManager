using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class AssetStatus : EntityBase
{
    public long Id { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();
}
