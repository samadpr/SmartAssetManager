using SAMS.Models;

namespace SAMS.Services.Admin.Subscriptions.Interface
{
    public interface ISubscriptionsRepository
    {
        Task<SubscriptionPlan> AddAsync(SubscriptionPlan entity);

        Task<SubscriptionPlan?> GetByIdAsync(long id);

        Task<List<SubscriptionPlan>> GetAllAsync();

        Task<SubscriptionPlan> UpdateAsync(SubscriptionPlan entity);

        Task<bool> DeleteAsync(long id, string user);

        //Task<List<SubscriptionPlan>> GetByIsCustomAsync(bool isCustom);
    }
}
