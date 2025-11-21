using SAMS.Models.CommonModels.Abstract;

namespace SAMS.Services.Cities.DTOs
{
    public class AssetCityDto : TenantEntityBase
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
    }
}
