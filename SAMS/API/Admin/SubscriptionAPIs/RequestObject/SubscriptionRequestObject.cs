namespace SAMS.API.Admin.SubscriptionAPIs.RequestObject
{
    public class SubscriptionRequestObject
    {
        public long? Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public decimal PlanAmount { get; set; }

        public int DurationDays { get; set; }

        public int AssetLimit { get; set; }

        public int SystemUserLimit { get; set; }

        public int TotalUserLimit { get; set; }

        public bool IsPlanActive { get; set; }


        public DateTime? SubscriptionDate { get; set; }
        public DateTime? SubscriptionExpiryDate { get; set; }
    }
}
