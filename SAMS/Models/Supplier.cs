using SAMS.Models.CommonModels.Abstract;
using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class Supplier : TenantEntityBase
{
    public long Id { get; set; }

    public string? Name { get; set; }

    public string? ContactPerson { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string? TradeLicense { get; set; }

    public string? Address { get; set; }

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();
}
