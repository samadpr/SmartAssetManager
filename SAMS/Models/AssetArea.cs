using SAMS.Models.CommonModels.Abstract;
using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class AssetArea : TenantEntityBase
{
    public long Id { get; set; }

    public long? SiteId { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public virtual ICollection<AssetAssigned> AssetAssigneds { get; set; } = new List<AssetAssigned>();

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual AssetSite? Site { get; set; }

    public virtual ICollection<UserProfile> UserProfiles { get; set; } = new List<UserProfile>();
}
