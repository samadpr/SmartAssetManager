using SAMS.Services.Reports.AssetTransferReport.DTOs;

namespace SAMS.Services.Reports.AssetTransferReport.Interface
{
    public interface IAssetTransferReportRepository
    {
        /// <summary>
        /// Get all transfer rows for one asset, looked up by its numeric DB id.
        /// Rows are ordered oldest → newest (ready to build the chain).
        /// </summary>
        Task<List<AssetTransferFlatRow>> GetTransferRowsByAssetRowIdAsync(long assetRowId, Guid orgId);

        /// <summary>
        /// Get all transfer rows for one asset, looked up by its business AssetId string
        /// (e.g. "AST-000001"). Filters directly in SQL — does not scan the whole org.
        /// </summary>
        Task<List<AssetTransferFlatRow>> GetTransferRowsByAssetIdStringAsync(string assetId, Guid orgId);

        /// <summary>
        /// Get every transfer row for the entire organisation.
        /// No filtering, no paging — the frontend handles that.
        /// Rows are ordered by asset then by date (oldest first within each asset).
        /// </summary>
        Task<List<AssetTransferFlatRow>> GetAllTransferRowsByOrgAsync(Guid orgId);

        /// <summary>
        /// Get aggregate counts for the organisation summary dashboard.
        /// Runs all counts sequentially on the same DbContext — no concurrency issues.
        /// </summary>
        Task<(int totalAssets, int totalLegs, int activeAssets, int disposedAssets, int pendingApprovals)> GetOrgSummaryCountsAsync(Guid orgId);
    }
}
