using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class AssetCategorie : EntityBase
{
    public long Id { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public virtual ICollection<AssetSubCategorie> AssetSubCategories { get; set; } = new List<AssetSubCategorie>();

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();
}
