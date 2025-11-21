using SAMS.Models;
using SAMS.Services.AssetAreas.DTOs;

namespace SAMS.Services.AssetAreas.Interface
{
    public interface IAssetAreaRepository
    {
        Task<bool> ExistsAsync(string name, long siteId, Guid orgId);
        Task<AssetArea> AddAsync(AssetArea entity);
        Task<AssetArea?> UpdateAsync(AssetArea entity);
        Task<IEnumerable<AssetArea>> GetAllAsync();
        Task<IEnumerable<AssetAreaDto>> GetByOrganizationAsync(Guid orgId);
        Task<AssetArea?> GetByIdAsync(long id, Guid orgId);
        Task<bool> SoftDeleteAsync(long id, Guid orgId, string deletedBy);
        Task<IEnumerable<AssetArea>> GetBySiteIdAsync(long siteId, Guid orgId);
    }
}
