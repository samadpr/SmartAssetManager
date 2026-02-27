using SAMS.Helpers;
using SAMS.Services.AssetQrBarcodeManage.DTOs;
using SAMS.Services.AssetQrBarcodeManage.Interface;

namespace SAMS.Services.AssetQrBarcodeManage
{
    public class AssetQrBarcodeManageService : IAssetQrBarcodeManageService
    {
        private readonly IAssetQrBarcodeManageRepository _repo;
        private readonly ILogger<AssetQrBarcodeManageService> _logger;
        private readonly ICompanyContext _companyContext;

        public AssetQrBarcodeManageService(IAssetQrBarcodeManageRepository repo, ILogger<AssetQrBarcodeManageService> logger, ICompanyContext companyContext)
        {
            _repo = repo;
            _logger = logger;
            _companyContext = companyContext;
        }

        public async Task<(bool success, string message, IEnumerable<AssetQrBarcodeDto> data)> GetAssetQrBarcodesByOrg()
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var result = await _repo.GetAssetQrBarcodesByOrg(orgId);
                return (true, "Success", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return (false, ex.Message, null);
            }
        }
    }
}
