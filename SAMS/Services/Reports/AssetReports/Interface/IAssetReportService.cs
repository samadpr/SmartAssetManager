using SAMS.Services.Reports.AssetReports.DTOs;

namespace SAMS.Services.Reports.AssetReports.Interface
{
    public interface IAssetReportService
    {
        Task<(bool success, string message, IEnumerable<AssetReportDto> data)> GetAssetFullInfoReportByOrg();
        Task<(bool success, string message, IEnumerable<AssetReportDepreciationDto> data)> GetAssetDepreciationReportByOrg();
        Task<(bool success, string message, IEnumerable<AssetDisposalReportDto> data)> GetAssetDisposalReportByOrg();

    }
}
