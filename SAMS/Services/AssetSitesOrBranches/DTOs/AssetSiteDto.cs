using SAMS.Helpers.Enum;
using SAMS.Models;

namespace SAMS.Services.AssetSitesOrBranches.DTOs
{
    public class AssetSiteDto : EntityBase
    {
        public long? Id { get; set; }

        public string? Name { get; set; }

        public string? Description { get; set; }

        public long? City { get; set; }

        public string? CityDisplay { get; set; }

        public string? Address { get; set; }

        public SiteOrBranch Type { get; set; }          // 👈 NEW

        public string? TypeDisplay => Type.ToString();  // 👈 NEW

        public Guid OrganizationId { get; set; }
    }
}
