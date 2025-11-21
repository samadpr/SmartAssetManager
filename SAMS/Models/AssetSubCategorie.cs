using SAMS.Models.CommonModels.Abstract;
using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class AssetSubCategorie : TenantEntityBase
{
    public long Id { get; set; }

    public long AssetCategorieId { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public virtual AssetCategorie AssetCategorie { get; set; } = null!;

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();
}
