using SAMS.Models;
using SAMS.Services.Assets.DTOs;

namespace SAMS.Services.Assets.Interface
{
    public interface IAssetsRepository
    {
        Task<Asset> AddAsync(Asset asset);
        Task<Asset> UpdateAsync(Asset asset);
        Task<Asset> GetByIdAsync(long id, Guid organizationId);
        Task<AssetDetailDto> GetDetailsByIdAsync(long id, Guid organizationId);
        Task<IEnumerable<AssetDetailDto>> GetAssetDetailsByOrgIdWithAvailableAsync(Guid organizationId);
        Task<long> GetMaxIdAsync(Guid organizationId);
        Task<bool> ExistsAsync(string assetId, Guid organizationId);
        Task<bool> SoftDeleteAsync(long id, Guid organizationId, string deletedBy);
        Task AddAssetHistoryAsync(AssetHistory history);

        Task<UserProfile> UserGetByIdAsync(long id, Guid organizationId);


        //Assignment
        Task<AssetAssigned?> GetActiveAssignmentAsync(long assetId, Guid orgId);
        Task AddNewAssignmentAsync(AssetAssigned entity);
        Task UpdateAssignmentAsync(AssetAssigned entity);
        Task<AssetAssigned?> GetAssignmentByIdAsync(long assignmentId, Guid orgId);

        Task<IEnumerable<AssetApprovalListDto>> GetPendingApprovalsAsync(Guid orgId);

    }
}
