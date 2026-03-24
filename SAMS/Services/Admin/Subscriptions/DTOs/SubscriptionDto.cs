using SAMS.Models;

namespace SAMS.Services.Admin.Subscriptions.DTOs
{
    public class SubscriptionDto : EntityBase
    {
        public long Id { get; set; }

        public string Name { get; set; }

        public decimal PlanAmount { get; set; }

        public int DurationDays { get; set; }

        public int AssetLimit { get; set; }

        public int SystemUserLimit { get; set; }

        public int TotalUserLimit { get; set; }

        public bool IsPlanActive { get; set; }
    }
}
