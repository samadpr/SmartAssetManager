using SAMS.Helpers.Enum;

namespace SAMS.API.AssetSitesOrBranchAPIs.RequestObject
{
    public class AssetSOBRequestObject
    {
        public long? Id { get; set; }

        public string? Name { get; set; }

        public string? Description { get; set; }

        public long? City { get; set; }

        public string? Address { get; set; }

        public SiteOrBranch Type { get; set; }
    }
}
