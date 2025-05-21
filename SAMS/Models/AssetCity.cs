using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class AssetCity
{
    public long Id { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public bool Cancelled { get; set; }

    public virtual ICollection<AssetSite> AssetSites { get; set; } = new List<AssetSite>();
}
