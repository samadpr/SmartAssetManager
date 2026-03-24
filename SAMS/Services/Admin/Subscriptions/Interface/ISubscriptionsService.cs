using SAMS.API.Admin.SubscriptionAPIs.RequestObject;
using SAMS.Services.Admin.Subscriptions.DTOs;

namespace SAMS.Services.Admin.Subscriptions.Interface
{
    public interface ISubscriptionsService
    {
        Task<(bool success, string message, SubscriptionDto data)> CreateAsync(SubscriptionRequestObject request, string user, int id);

        Task<(bool success, string message, SubscriptionDto data)> UpdateAsync(SubscriptionRequestObject request, string user, int companyId);

        Task<(bool success, string message, SubscriptionDto data)> GetByIdAsync(long id);

        Task<(bool success, string message, IEnumerable<SubscriptionDto> data)> GetAllAsync();

        Task<(bool success, string message)> DeleteAsync(long id, string user);

        //Task<(bool success, string message, IEnumerable<SubscriptionDto> data)> GetByIsCustomAsync(bool isCustom);
    }
}
