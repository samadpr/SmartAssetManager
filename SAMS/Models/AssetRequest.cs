using SAMS.Models.CommonModels.Abstract;
using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class AssetRequest : TenantEntityBase
{
    public long Id { get; set; }

    public long AssetId { get; set; }

    public long RequestedEmployeeId { get; set; }

    public long ApprovedByEmployeeId { get; set; }

    public string? RequestDetails { get; set; }

    public string? Status { get; set; }

    public DateTime RequestDate { get; set; }

    public DateTime ReceiveDate { get; set; }

    public string? Comment { get; set; }

    public virtual UserProfile ApprovedByEmployee { get; set; } = null!;

    public virtual Asset Asset { get; set; } = null!;

    public virtual UserProfile RequestedEmployee { get; set; } = null!;
}
