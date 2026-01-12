using SAMS.Models;

namespace SAMS.Services.Asset_Status.Interface
{
    public interface IAssetStatusRepository
    {
        Task<List<AssetStatus>> GetAllAsync(Guid orgId);
        Task AddRangeAsync(List<AssetStatus> statuses);
        Task<bool> AnySystemStatusesAsync(Guid orgId);
    }
}
