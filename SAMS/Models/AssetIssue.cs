using SAMS.Models.CommonModels.Abstract;
using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class AssetIssue : TenantEntityBase
{
    public long Id { get; set; }

    public long AssetId { get; set; }

    public long RaisedByEmployeeId { get; set; }

    public string? IssueDescription { get; set; }

    public string? Status { get; set; }

    public DateTime? ExpectedFixDate { get; set; }

    public DateTime? ResolvedDate { get; set; }

    public decimal? RepairCost { get; set; }

    public string? Invoice { get; set; }

    public string? Comment { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual UserProfile RaisedByEmployee { get; set; } = null!;
}
