using SAMS.Models;
using SAMS.Services.AssetAreas.DTOs;

namespace SAMS.Services.AssetAreas.Interface
{
    public interface IAssetAreaService
    {
        Task<(bool success, string message, AssetAreaDto? data)> CreateAsync(AssetAreaDto dto, string createdBy);
        Task<(bool success, string message, AssetAreaDto? data)> UpdateAsync(AssetAreaDto dto, string modifiedBy);
        Task<(bool success, string message, IEnumerable<AssetArea>? data)> GetAllAsync();
        Task<(bool success, string message, IEnumerable<AssetAreaDto>? data)> GetByOrganizationAsync();
        Task<(bool success, string message)> DeleteAsync(long id, string deletedBy);
        Task<(bool success, string message, IEnumerable<AssetAreaDto>? data)> GetBySiteIdAsync(long siteId);
    }
}
