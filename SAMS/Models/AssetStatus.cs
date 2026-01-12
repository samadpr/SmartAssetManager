using SAMS.Models.CommonModels.Abstract;
using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class AssetStatus : TenantEntityBase
{
    public long Id { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    // 🔥 NEW
    public bool IsSystem { get; set; }          // true = enum based
    public int? EnumValue { get; set; }         // maps to AssetStatusEnum

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();
}
