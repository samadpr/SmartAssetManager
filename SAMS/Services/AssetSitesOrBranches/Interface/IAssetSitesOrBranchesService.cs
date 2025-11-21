using SAMS.Models;
using SAMS.Services.AssetSitesOrBranches.DTOs;

namespace SAMS.Services.AssetSitesOrBranches.Interface
{
    public interface IAssetSitesOrBranchesService
    {
        Task<(bool success, string message, AssetSiteDto? data)> CreateAsync(AssetSiteDto dto, string createdBy);
        Task<(bool success, string message, AssetSiteDto? data)> UpdateAsync(AssetSiteDto dto, string modifiedBy);
        Task<(bool success, string message, IEnumerable<AssetSite>? data)> GetAllAsync();
        Task<(bool success, string message, IEnumerable<AssetSiteDto>? data)> GetByOrganizationAsync();
        Task<(bool success, string message)> DeleteAsync(long id, string deletedBy);
        Task<(bool success, string message, IEnumerable<AssetSiteDto>? data)> GetByCityIdAsync(long cityId);
    }
}
