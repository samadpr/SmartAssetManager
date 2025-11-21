using SAMS.Models;
using SAMS.Services.AssetSitesOrBranches.DTOs;

namespace SAMS.Services.AssetSitesOrBranches.Interface
{
    public interface IAssetSitesOrBranchesRepository
    {
        Task<bool> ExistsAsync(string name, Guid orgId);

        Task<AssetSite> AddAsync(AssetSite entity);

        Task<AssetSite?> UpdateAsync(AssetSite entity);

        Task<IEnumerable<AssetSite>> GetAllAsync();

        Task<IEnumerable<AssetSiteDto>> GetByOrganizationAsync(Guid orgId);

        Task<AssetSite?> GetByIdAsync(long id, Guid orgId);

        Task<bool> SoftDeleteAsync(long id, Guid orgId, string deletedBy);

        Task<IEnumerable<AssetSite>> GetByCityIdAsync(long cityId, Guid orgId);
    }
}
