using SAMS.Services.AssetQrBarcodeManage.DTOs;

namespace SAMS.Services.AssetQrBarcodeManage.Interface
{
    public interface IAssetQrBarcodeManageRepository
    {
        Task<IEnumerable<AssetQrBarcodeDto>> GetAssetQrBarcodesByOrg(Guid orgId);
    }
}
