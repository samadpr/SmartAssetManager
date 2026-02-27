using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Services.AssetQrBarcodeManage.DTOs
{
    public class AssetQrBarcodeDto
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

        // File paths
        public string ImageUrl { get; set; }

        // Other
        public bool IsAvilable { get; set; }
        public string Note { get; set; }
        public string Barcode { get; set; }
        public string Qrcode { get; set; }
        public string QrcodeImage { get; set; }

        public AssetStatusEnum? AssetStatus { get; set; }
        public string AssetStatusDisplay { get; set; }
        public string CategoryDisplay { get; set; }
        public string SubCategoryDisplay { get; set; }
        public string SupplierDisplay { get; set; }
        public string SiteDisplay { get; set; }
        public string AreaDisplay { get; set; }
        public string DepartmentDisplay { get; set; }
        public string SubDepartmentDisplay { get; set; }
        public string AssignUserDisplay { get; set; }
    }
}
