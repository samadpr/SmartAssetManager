using SAMS.Models.CommonModels.Abstract;
using System;
using System.Collections.Generic;
using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Models;

public class AssetAssigned : TenantEntityBase
{
    public long Id { get; set; }

    public long AssetId { get; set; }

    public long? AssignedFrom { get; set; }

    public long? UserIdFrom { get; set; }

    public long? SiteIdFrom { get; set; }

    public long? AreaIdFrom { get; set; }

    public int? AssetType { get; set; }

    public AssignToType? AssignTo { get; set; }

    public long? UserId { get; set; }

    public long? SiteId { get; set; }

    public long? AreaId { get; set; }

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

    public virtual UserProfile User { get; set; } = null!;

    public virtual AssetArea? Area { get; set; }

    public virtual AssetSite? Site { get; set; }
}
