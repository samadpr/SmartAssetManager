using SAMS.Models;

namespace SAMS.Services.AssetSubCategory.DTOs
{
    public class AssetSubCategoryDto : EntityBase
    {
        public long Id { get; set; }

        public long AssetCategorieId { get; set; }

        public string? AssetCategorieDisplay { get; set; }

        public string? Name { get; set; }

        public string? Description { get; set; }

        public Guid OrganizationId { get; set; }
    }
}
