using SAMS.Models;
using SAMS.Services.AssetsIssue.DTOs;

namespace SAMS.Services.AssetsIssue.Interface
{
    public interface IAssetIssueRepository
    {
        Task<AssetIssue> AddAsync(AssetIssue entity);
        Task<AssetIssue?> UpdateAsync(AssetIssue entity);
        Task<AssetIssue?> GetByIdAsync(long id, Guid orgId);
        Task<AssetIssueDetailsDto?> GetByIdWithDetailsAsync(long id, Guid orgId);
        Task<IEnumerable<AssetIssueDetailsDto>> GetByOrganizationAsync(Guid orgId);
        Task<bool> SoftDeleteAsync(long id, Guid orgId, string deletedBy);
    }
}
