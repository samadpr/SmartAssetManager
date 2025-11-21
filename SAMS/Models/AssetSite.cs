using SAMS.Helpers.Enum;
using SAMS.Models.CommonModels.Abstract;
using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class AssetSite : TenantEntityBase
{
    public long Id { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public long? City { get; set; }

    public string? Address { get; set; }

    public SiteOrBranch Type { get; set; }

    public virtual ICollection<AssetAssigned> AssetAssigneds { get; set; } = new List<AssetAssigned>();

    public virtual ICollection<AssetArea> AssetArea { get; set; } = new List<AssetArea>();

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual AssetCity? LocationNavigation { get; set; }

    public virtual ICollection<UserProfile> UserProfiles { get; set; } = new List<UserProfile>();
}
