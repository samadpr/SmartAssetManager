using SAMS.Models.CommonModels.Abstract;
using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Services.Assets.DTOs
{
    public class AssetDto : TenantEntityBase
    {
        public long? Id { get; set; }
        public string AssetId { get; set; }
        public string AssetBrand { get; set; }
        public string AssetModelNo { get; set; }
        public string AssetSerialNo { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public long? Category { get; set; }
        public long? SubCategory { get; set; }
        public int? Quantity { get; set; }
        public double? UnitPrice { get; set; }
        public long? Supplier { get; set; }
        public long? SiteId { get; set; }
        public long? AreaId { get; set; }
        public long? Department { get; set; }
        public long? SubDepartment { get; set; }
        public int? WarranetyInMonth { get; set; }

        // Depreciation
        public bool IsDepreciable { get; set; }
        public decimal? DepreciableCost { get; set; }
        public decimal? SalvageValue { get; set; }
        public int? DepreciationInMonth { get; set; }
        public DepreciationMethod? DepreciationMethod { get; set; }
        public DateTime? DateAquired { get; set; }

        // File paths
        public string ImageUrl { get; set; }
        public string DeliveryNote { get; set; }
        public string PurchaseReceipt { get; set; }
        public string Invoice { get; set; }

        // Dates
        public DateTime? DateOfPurchase { get; set; }
        public DateTime? DateOfManufacture { get; set; }
        public DateTime? YearOfValuation { get; set; }

        // Assignment
        public long? AssetAssignedId { get; set; }
        public AssetType? AssetType { get; set; }
        public AssignToType? AssignTo { get; set; }
        public long? AssignUserId { get; set; }
        public AssetStatusEnum? AssetStatus { get; set; }
        public ApproverType? ApproverType { get; set; }
        public TransferApprovalStatus? TransferAppStatus { get; set; }

        // Disposal
        public int? DisposalAppStatus { get; set; }
        public DateTime? DisposalDate { get; set; }
        public DisposalMethod? DisposalMethod { get; set; }
        public string DisposalDocument { get; set; }

        // Other
        public bool IsAvilable { get; set; }
        public string Note { get; set; }
        public string Barcode { get; set; }
        public string Qrcode { get; set; }
        public string QrcodeImage { get; set; }
    }

    public class AssetDetailDto : AssetDto
    {
        public string CategoryDisplay { get; set; }
        public string SubCategoryDisplay { get; set; }
        public string SupplierDisplay { get; set; }
        public string SiteDisplay { get; set; }
        //public string LocationDisplay { get; set; }
        public string AreaDisplay { get; set; }
        public string DepartmentDisplay { get; set; }
        public string SubDepartmentDisplay { get; set; }
        public string AssignUserDisplay { get; set; }
        public string AssetStatusDisplay { get; set; }
        public string AssignToDisplay { get; set; }
        public string AssetTypeDisplay { get; set; }

        // Additional details
        public List<AssetHistoryDto> AssetHistory { get; set; }
        public List<AssetDepreciationDto> DepreciationSchedule { get; set; }
        public List<CommentDto> Comments { get; set; }
    }

    public class AssetDepreciationDto
    {
        public int Year { get; set; }
        public decimal BookValueYearBegining { get; set; }
        public decimal Depreciation { get; set; }
        public decimal BookValueYearEnd { get; set; }
    }

    public class AssetHistoryDto
    {
        public long Id { get; set; }
        public long AssetId { get; set; }
        public long AssignUserId { get; set; }
        public string AssignUserName { get; set; }
        public string Action { get; set; }
        public string Note { get; set; }
        public DateTime CreatedDate { get; set; }
        public string CreatedBy { get; set; }
    }

    public class CommentDto
    {
        public long Id { get; set; }
        public long AssetId { get; set; }
        public string Message { get; set; }
        public bool IsAdmin { get; set; }
        public DateTime CreatedDate { get; set; }
        public string CreatedBy { get; set; }
    }
}
