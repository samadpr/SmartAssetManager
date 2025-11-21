using SAMS.Models;
using SAMS.Services.AssetCategory.DTOs;

namespace SAMS.Services.AssetCategory.Interface
{
    public interface IAssetCategoriesService
    {
        Task<(bool success, string message, AssetCategoryDto? data)> CreateAsync(AssetCategoryDto dto, string createdBy);
        Task<(bool success, string message, AssetCategoryDto? data)> UpdateAsync(AssetCategoryDto dto, string modifiedBy);
        Task<(bool success, string message, IEnumerable<AssetCategorie>? data)> GetAllAsync();
        Task<(bool success, string message, IEnumerable<AssetCategorie>? data)> GetByOrganizationAsync();
        Task<(bool success, string message)> DeleteAsync(long id, string deletedBy);
    }
}
