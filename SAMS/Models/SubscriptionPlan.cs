namespace SAMS.Models
{
    public class SubscriptionPlan : EntityBase
    {
        public long Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public decimal PlanAmount { get; set; }

        public int DurationDays { get; set; } // subscription duration

        public int AssetLimit { get; set; }

        public int SystemUserLimit { get; set; }

        public int TotalUserLimit { get; set; }

        public bool IsPlanActive { get; set; } = true;


    }
}
