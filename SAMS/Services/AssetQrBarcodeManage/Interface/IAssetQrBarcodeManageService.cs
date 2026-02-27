
using SAMS.Services.AssetQrBarcodeManage.DTOs;

namespace SAMS.Services.AssetQrBarcodeManage.Interface
{
    public interface IAssetQrBarcodeManageService
    {
        Task<(bool success, string message, IEnumerable<AssetQrBarcodeDto> data)> GetAssetQrBarcodesByOrg();
    }
}
