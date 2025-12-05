using SAMS.Models.CommonModels.Abstract;
using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class AssetAssigned : TenantEntityBase
{
    public long Id { get; set; }

    public long AssetId { get; set; }

    public long? AssignedFrom { get; set; }

    public long? EmployeeIdFrom { get; set; }

    public long? SiteIdFrom { get; set; }

    public long? LocationIdFrom { get; set; }

    public int? AssetType { get; set; }

    public int? AssignTo { get; set; }

    public long EmployeeId { get; set; }

    public long? SiteId { get; set; }

    public long? LocationId { get; set; }

    public string? Status { get; set; }

    public DateTime? TransferDate { get; set; }

    public DateTime? DueDate { get; set; }

    public int? ApproverType { get; set; }

    public int? ApprovalStatus { get; set; }

    public string? Level1Approvedby { get; set; }

    public string? Level2Approvedby { get; set; }

    public string? Level3Approvedby { get; set; }

    public DateTime? Level1ApprovedDate { get; set; }

    public DateTime? Level2ApprovedDate { get; set; }

    public DateTime? Level3ApprovedDate { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual UserProfile Employee { get; set; } = null!;

    public virtual AssetArea? Area { get; set; }

    public virtual AssetSite? Site { get; set; }
}
