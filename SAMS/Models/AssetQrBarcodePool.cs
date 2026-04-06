using SAMS.Models.CommonModels.Abstract;

namespace SAMS.Models
{
    public class AssetQrBarcodePool : TenantEntityBase
    {
        public long Id { get; set; }
        public long BatchId { get; set; }

        public string AssetId { get; set; }

        public string Barcode { get; set; }
        public string QrCode { get; set; }
        public string QrImage { get; set; }

        public bool IsUsed { get; set; } = false;
    }
}
