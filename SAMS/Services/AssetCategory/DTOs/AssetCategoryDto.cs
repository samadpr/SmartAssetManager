using SAMS.Models;

namespace SAMS.Services.AssetCategory.DTOs
{
    public class AssetCategoryDto : EntityBase
    {
        public long? Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }

        public Guid OrganizationId { get; set; }
    }
}
