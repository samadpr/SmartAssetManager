using SAMS.Models;

namespace SAMS.Services.AssetSubCategory.Interface
{
    public interface IAssetSubCategoriesRepository
    {
        Task<bool> ExistsAsync(string name, long categoryId, Guid orgId);
        Task<AssetSubCategorie> AddAsync(AssetSubCategorie entity);
        Task<AssetSubCategorie?> UpdateAsync(AssetSubCategorie entity);
        Task<IEnumerable<AssetSubCategorie>> GetAllAsync();
        Task<IEnumerable<AssetSubCategorie>> GetByOrganizationAsync(Guid orgId);
        Task<AssetSubCategorie?> GetByIdAsync(long id, Guid orgId);
        Task<bool> SoftDeleteAsync(long id, Guid orgId, string deletedBy);
        Task<IEnumerable<AssetSubCategorie>> GetByCategoryIdAsync(long categoryId, Guid orgId);
    }
}
