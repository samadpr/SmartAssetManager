using SAMS.Models;
using SAMS.Services.AssetSubCategory.DTOs;

namespace SAMS.Services.AssetSubCategory.Interface
{
    public interface IAssetSubCategoriesService
    {
        Task<(bool success, string message, AssetSubCategoryDto? data)> CreateAsync(AssetSubCategoryDto dto, string createdBy);
        Task<(bool success, string message, AssetSubCategoryDto? data)> UpdateAsync(AssetSubCategoryDto dto, string modifiedBy);
        Task<(bool success, string message, IEnumerable<AssetSubCategoryDto>? data)> GetAllAsync();
        Task<(bool success, string message, IEnumerable<AssetSubCategoryDto>? data)> GetByOrganizationAsync();
        Task<(bool success, string message)> DeleteAsync(long id, string deletedBy);

        Task<(bool success, string message, IEnumerable<AssetSubCategoryDto>? data)> GetByCategoryIdAsync(long categoryId);
    }
}
