namespace SAMS.API.SupplierAPIs.RequestObject
{
    public class SupplierFileUploadRequestObject
    {
        public long SupplierId { get; set; }
        public IFormFile TradeLicenseFile { get; set; }
    }
}
