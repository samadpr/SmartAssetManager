using SAMS.Models.CommonModels.Abstract;
using SAMS.Models.CommonModels.Interface;

namespace SAMS.Models
{
    public class SubscriptionHistory : TenantEntityBase
    {
        public long Id { get; set; }

        public long SubscriptionId { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public decimal AmountPaid { get; set; }

        public string? PaymentReference { get; set; }

        public SubscriptionPlan? SubscriptionPlan { get; set; }
    }
}
