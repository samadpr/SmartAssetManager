using SAMS.API.AssetIssueAPIs.RequestObject;
using SAMS.Services.AssetsIssue.DTOs;

namespace SAMS.Services.AssetsIssue.Interface
{
    public interface IAssetIssueService
    {
        Task<(bool success, string message, AssetIssueDto? data)> CreateAsync(AssetIssueRequestObject request, string createdBy);

        Task<(bool success, string message, AssetIssueDto? data)> UpdateAsync(AssetIssueRequestObject request, string modifiedBy);

        Task<(bool success, string message, IEnumerable<AssetIssueDetailsDto>? data)> GetByOrganizationAsync();

        Task<(bool success, string message)> DeleteAsync(long id, string deletedBy);

        Task<(bool success, string message, AssetIssueDetailsDto? data)> GetByIdAsync(long id);
    }
}
