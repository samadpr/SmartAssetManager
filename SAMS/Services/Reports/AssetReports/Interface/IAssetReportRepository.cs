using SAMS.Services.Reports.AssetReports.DTOs;

namespace SAMS.Services.Reports.AssetReports.Interface
{
    public interface IAssetReportRepository
    {
        Task<IEnumerable<AssetReportDto>> GetAssetFullInfoReportByOrg(Guid organizationId);
        Task<IEnumerable<AssetReportDepreciationDto>> GetAssetDepreciationReportByOrg(Guid organizationId);
        Task<IEnumerable<AssetDisposalReportDto>> GetAssetDisposalReportByOrg(Guid organizationId);
    }
}
