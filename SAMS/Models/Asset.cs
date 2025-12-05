using SAMS.Models.CommonModels.Abstract;
using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class Asset : TenantEntityBase
{
    public long Id { get; set; }

    public string AssetId { get; set; } = null!;

    public string? AssetBrand { get; set; }

    public string? AssetModelNo { get; set; }

    public string? AssetSerialNo { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public long? Category { get; set; }

    public long? SubCategory { get; set; }

    public int? Quantity { get; set; }

    public double? UnitPrice { get; set; }

    public long? Supplier { get; set; }

    public long? SiteId { get; set; }

    public long? Location { get; set; }

    public long? Department { get; set; }

    public long? SubDepartment { get; set; }

    public int? WarranetyInMonth { get; set; }

    public bool? IsDepreciable { get; set; }

    public decimal? DepreciableCost { get; set; }

    public decimal? SalvageValue { get; set; }

    public int? DepreciationInMonth { get; set; }

    public int? DepreciationMethod { get; set; }

    public DateTime? DateAquired { get; set; }

    public string? ImageUrl { get; set; }

    public string? DeliveryNote { get; set; }

    public string? PurchaseReceipt { get; set; }

    public string? Invoice { get; set; }

    public DateTime? DateOfPurchase { get; set; }

    public DateTime? DateOfManufacture { get; set; }

    public DateTime? YearOfValuation { get; set; }

    public long? AssetAssignedId { get; set; }

    public int? AssetType { get; set; }

    public int? AssignTo { get; set; }

    public long? AssignEmployeeId { get; set; }

    public long? AssetStatus { get; set; }

    public int? ApproverType { get; set; }

    public int? TransferAppStatus { get; set; }

    public int? DisposalAppStatus { get; set; }

    public DateTime? DisposalDate { get; set; }

    public int? DisposalMethod { get; set; }

    public string? DisposalDocument { get; set; }

    public bool? IsAvilable { get; set; }

    public string? Note { get; set; }

    public string? Barcode { get; set; }

    public string? Qrcode { get; set; }

    public string? QrcodeImage { get; set; }

    public virtual ICollection<AssetAssigned> AssetAssigneds { get; set; } = new List<AssetAssigned>();

    public virtual ICollection<AssetHistory> AssetHistories { get; set; } = new List<AssetHistory>();

    public virtual ICollection<AssetIssue> AssetIssues { get; set; } = new List<AssetIssue>();

    public virtual ICollection<AssetRequest> AssetRequests { get; set; } = new List<AssetRequest>();

    public virtual AssetStatus? AssetStatusNavigation { get; set; }

    public virtual UserProfile? AssignEmployee { get; set; }

    public virtual AssetCategorie? CategoryNavigation { get; set; }

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual Department? DepartmentNavigation { get; set; }

    public virtual AssetArea? AreaNavigation { get; set; }

    public virtual AssetSite? Site { get; set; }

    public virtual AssetSubCategorie? SubCategoryNavigation { get; set; }

    public virtual SubDepartment? SubDepartmentNavigation { get; set; }

    public virtual Supplier? SupplierNavigation { get; set; }
}
