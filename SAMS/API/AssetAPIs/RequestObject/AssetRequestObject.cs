using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.API.AssetAPIs.RequestObject
{
    public class AssetRequestObject
    {
        public long? Id { get; set; }
        public string AssetBrand { get; set; }
        public string AssetModelNo { get; set; }
        public string AssetSerialNo { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public long? Category { get; set; }
        public long? SubCategory { get; set; }
        public int? Quantity { get; set; }
        public double? UnitPrice { get; set; }
        public long? Supplier { get; set; }
        public long? SiteId { get; set; }
        public long? AreaId { get; set; }
        public long? Department { get; set; }
        public long? SubDepartment { get; set; }
        public long? AssetStatus { get; set; }
        public int? WarranetyInMonth { get; set; }

        // Depreciation
        public bool IsDepreciable { get; set; }
        public decimal? DepreciableCost { get; set; }
        public decimal? SalvageValue { get; set; }
        public int? DepreciationInMonth { get; set; }
        public DepreciationMethod? DepreciationMethod { get; set; }
        public DateTime? DateAquired { get; set; }

        // FILES (only when changed)
        public IFormFile? ImageFile { get; set; }
        public IFormFile? DeliveryNoteFile { get; set; }
        public IFormFile? PurchaseReceiptFile { get; set; }
        public IFormFile? InvoiceFile { get; set; }

        // EXISTING PATHS (when unchanged)
        public string? ImagePath { get; set; }
        public string? DeliveryNotePath { get; set; }
        public string? PurchaseReceiptPath { get; set; }
        public string? InvoicePath { get; set; }

        // Dates
        public DateTime? DateOfPurchase { get; set; }
        public DateTime? DateOfManufacture { get; set; }
        public DateTime? YearOfValuation { get; set; }

        // Assignment
        public AssignToType AssignTo { get; set; }
        public long? AssignUserId { get; set; }
        public long? AssignSiteId { get; set; }
        public long? AssignAreaId { get; set; }
        public DateTime? TransferDate { get; set; }
        public DateTime? DueDate { get; set; }

        public string? Note { get; set; }
    }
}
