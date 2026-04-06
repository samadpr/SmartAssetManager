using SAMS.Models.CommonModels.Abstract;

namespace SAMS.Models
{
    public class AssetQrBarcodeBatch : TenantEntityBase
    {
        public long Id { get; set; }
        public int RequestedCount { get; set; }
        public string BatchCode { get; set; }
    }
}
