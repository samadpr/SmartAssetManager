using SAMS.Models;

namespace SAMS.Services.AssetCategory.Interface
{
    public interface IAssetCategoriesRepository
    {
        Task<bool> ExistsAsync(string name, Guid orgId);
        Task<AssetCategorie> AddAsync(AssetCategorie entity);
        Task<AssetCategorie?> UpdateAsync(AssetCategorie entity);
        Task<IEnumerable<AssetCategorie>> GetAllAsync();
        Task<IEnumerable<AssetCategorie>> GetByOrganizationAsync(Guid orgId);
        Task<AssetCategorie?> GetByIdAsync(long id, Guid orgId);
        Task<bool> SoftDeleteAsync(long id, Guid orgId, string deletedBy);
    }
}
