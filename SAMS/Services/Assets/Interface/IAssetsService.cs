using SAMS.API.AssetAPIs.RequestObject;
using SAMS.Models;
using SAMS.Services.Assets.DTOs;

namespace SAMS.Services.Assets.Interface
{
    public interface IAssetsService
    {
        // CRUD Operations
        Task<(bool success, string message, AssetDetailDto? data)> CreateAsync(AssetRequestObject request, string createdBy);
        Task<(bool success, string message, AssetDetailDto? data)> UpdateAsync(AssetRequestObject request, string modifiedBy);
        Task<(bool success, string message, AssetDetailDto data)> GetByIdAsync(long id);
        Task<(bool success, string message, IEnumerable<AssetDetailDto> data)> GetByOrgIdWithValidAssetsAsync();

        Task<(bool success, string message)> DeleteAsync(long id, string deletedBy);
        Task<(bool success, string message)> TransferAssetAsync(AssetTransferRequestDto request, string user);
        Task<(bool success, string message)> DisposeAssetAsync(AssetDisposeRequestDto request, string user);
        Task<(bool success, string message)> ApproveAssetRequestAsync(AssetApprovalRequestDto request, string user);
        Task<(bool success, string message)> RejectAssetRequestAsync(AssetApprovalRequestDto request, string user);

        Task<(bool success, string message, IEnumerable<AssetApprovalListDto> data)> GetPendingApprovalAssetsAsync();
    }
}
