using SAMS.Models;

namespace SAMS.Services.Asset_Status.Interface
{
    public interface IAssetStatusService
    {
        Task<(bool isSuccess,List<AssetStatus> data, string message)> GetStatusesAsync();
    }
}
