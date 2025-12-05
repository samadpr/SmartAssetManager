using SAMS.Models.CommonModels.Abstract;

namespace SAMS.Services.Suppliers.DTOs
{
    public class SupplierDto : TenantEntityBase
    {
        public long? Id { get; set; }
        public string? Name { get; set; }
        public string? ContactPerson { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? TradeLicense { get; set; }
        public string? Address { get; set; }
    }
}
