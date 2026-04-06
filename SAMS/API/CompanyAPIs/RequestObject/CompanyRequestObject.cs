namespace SAMS.API.CompanyAPIs.RequestObject
{
    public class CompanyRequestObject
    {
        public Guid? OrganizationId { get; set; }

        public long Id { get; set; }

        public long? IndustriesId { get; set; }

        public string? Name { get; set; }

        public IFormFile? Logo { get; set; }

        public string? Currency { get; set; }

        public string? Address { get; set; }

        public string? City { get; set; }

        public string? Country { get; set; }

        public string? Phone { get; set; }

        public string? Email { get; set; }

        public string? Fax { get; set; }

        public string? Website { get; set; }
    }

    public class CompanyRequestObjectWithSubscription
    {
        public long Id { get; set; }

        public long? IndustriesId { get; set; }

        public string? Name { get; set; }

        public IFormFile? Logo { get; set; }

        public string? Currency { get; set; }

        public string? Address { get; set; }

        public string? City { get; set; }

        public string? Country { get; set; }

        public string? Phone { get; set; }

        public string? Email { get; set; }

        public string? Fax { get; set; }

        public string? Website { get; set; }

        public SubscriptionInfo? Subscription { get; set; }
    }

    public class SubscriptionInfo
    {
        public int? AssetCount { get; set; }

        public int? SystemUserCount { get; set; }

        public int? TotalUserCount { get; set; }
    }
}
