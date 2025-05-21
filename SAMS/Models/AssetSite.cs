using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class AssetSite : EntityBase
{
    public long Id { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public long? Location { get; set; }

    public string? Address { get; set; }

    public virtual ICollection<AssetAssigned> AssetAssigneds { get; set; } = new List<AssetAssigned>();

    public virtual ICollection<AssetLocation> AssetLocations { get; set; } = new List<AssetLocation>();

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual AssetCity? LocationNavigation { get; set; }

    public virtual ICollection<UserProfile> UserProfiles { get; set; } = new List<UserProfile>();
}
