using SAMS.Services.Reports.AssetTransferReport.DTOs;

namespace SAMS.Services.Reports.AssetTransferReport.Interface
{
    public interface IAssetTransferReportService
    {
        /// <summary>Full transfer chain for one asset — looked up by its numeric DB row id.</summary>
        Task<(bool success, string message, AssetTransferHistoryDto? data)> GetAssetTransferHistoryByIdAsync(long assetRowId);

        /// <summary>Full transfer chain for one asset — looked up by its business AssetId string (e.g. "AST-000001").</summary>
        Task<(bool success, string message, AssetTransferHistoryDto? data)> GetAssetTransferHistoryByAssetIdAsync(string assetId);

        /// <summary>
        /// Full report for the whole organisation — every asset with its complete chain.
        /// No filtering or pagination applied here; the frontend handles that.
        /// </summary>
        Task<(bool success, string message, OrganisationTransferReportDto? data)> GetOrganisationTransferReportAsync();

        /// <summary>
        /// Summary counts only — no per-leg data.
        /// Fast endpoint for dashboard widgets.
        /// </summary>
        Task<(bool success, string message, OrganisationTransferSummaryDto? data)>GetOrganisationTransferSummaryAsync();
    }
}
