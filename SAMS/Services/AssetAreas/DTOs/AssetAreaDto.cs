using SAMS.Models;

namespace SAMS.Services.AssetAreas.DTOs
{
    public class AssetAreaDto : EntityBase
    {
        public long? Id { get; set; }

        public long? SiteId { get; set; }

        public string? SiteDisplay { get; set; }

        public string? Name { get; set; }

        public string? Description { get; set; }

        public Guid OrganizationId { get; set; }
    }
}
