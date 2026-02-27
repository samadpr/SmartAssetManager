using SAMS.Models.CommonModels.Abstract;
using System;
using System.Collections.Generic;
using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Models;

public class AssetIssue : TenantEntityBase
{
    public long Id { get; set; }

    public long AssetId { get; set; }

    public long RaisedByUserId { get; set; }

    public string? IssueTitle { get; set; }

    public string? IssueDescription { get; set; }

    public AssetIssueStatus? Status { get; set; }

    public DateTime? ExpectedFixDate { get; set; }

    public DateTime? ResolvedDate { get; set; }

    public decimal? RepairCost { get; set; }

    public string? Invoice { get; set; }

    public string? Comment { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual UserProfile RaisedByUser { get; set; } = null!;
}
