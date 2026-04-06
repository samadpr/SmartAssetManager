using SAMS.Helpers;
using SAMS.Services.Reports.AssetTransferReport.DTOs;
using SAMS.Services.Reports.AssetTransferReport.Interface;
using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Services.Reports.AssetTransferReport
{
    public class AssetTransferReportService : IAssetTransferReportService
    {
        private readonly IAssetTransferReportRepository _repo;
        private readonly ILogger<AssetTransferReportService> _logger;
        private readonly ICompanyContext _companyContext;

        public AssetTransferReportService(IAssetTransferReportRepository repo, ILogger<AssetTransferReportService> logger, ICompanyContext companyContext)
        {
            _repo = repo;
            _logger = logger;
            _companyContext = companyContext;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // Single-asset lookups
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<(bool success, string message, AssetTransferHistoryDto? data)>
            GetAssetTransferHistoryByIdAsync(long assetRowId)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                var rows = await _repo.GetTransferRowsByAssetRowIdAsync(assetRowId, orgId);

                if (!rows.Any())
                    return (false, "Asset not found or has no transfer history.", null);

                return (true, "Transfer history retrieved successfully.", BuildAssetHistory(rows));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving transfer history for assetRowId {Id}", assetRowId);
                return (false, "An error occurred while retrieving transfer history.", null);
            }
        }

        public async Task<(bool success, string message, AssetTransferHistoryDto? data)>
            GetAssetTransferHistoryByAssetIdAsync(string assetId)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                var rows = await _repo.GetTransferRowsByAssetIdStringAsync(assetId, orgId);

                if (!rows.Any())
                    return (false, $"Asset '{assetId}' not found or has no transfer history.", null);

                return (true, "Transfer history retrieved successfully.", BuildAssetHistory(rows));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving transfer history for assetId {AssetId}", assetId);
                return (false, "An error occurred while retrieving transfer history.", null);
            }
        }

        // ─────────────────────────────────────────────────────────────────────────
        // Organisation-level endpoints
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<(bool success, string message, OrganisationTransferReportDto? data)>
            GetOrganisationTransferReportAsync()
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                // Fetch every transfer row for the whole org
                var rows = await _repo.GetAllTransferRowsByOrgAsync(orgId);

                if (!rows.Any())
                    return (true, "No transfer records found for this organisation.",
                        new OrganisationTransferReportDto { OrganizationId = orgId });

                // Group by asset id and build each asset's history chain
                var assets = rows
                    .GroupBy(r => r.AssetRowId)
                    .Select(group => BuildAssetHistory(group.ToList()))
                    .ToList();

                // Build inline summary from the data we already have (no extra DB call)
                var summary = new OrganisationTransferSummaryDto
                {
                    OrganizationId = orgId,
                    TotalAssets = assets.Count,
                    TotalTransferLegs = assets.Sum(a => a.TotalTransfers),
                    TotalActiveAssets = assets.Count(a => !a.IsDisposed && !a.IsCancelled),
                    TotalDisposedAssets = assets.Count(a => a.IsDisposed),
                    TotalPendingApprovals = assets.Sum(a =>
                        a.TransferChain.Count(leg => leg.ApprovalStatus == TransferApprovalStatus.Pending))
                };

                var report = new OrganisationTransferReportDto
                {
                    OrganizationId = orgId,
                    Summary = summary,
                    Assets = assets
                };

                return (true, "Organisation transfer report retrieved successfully.", report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving organisation transfer report");
                return (false, "An error occurred while retrieving the transfer report.", null);
            }
        }

        public async Task<(bool success, string message, OrganisationTransferSummaryDto? data)>
            GetOrganisationTransferSummaryAsync()
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                // All 5 counts run sequentially — safe on a single DbContext instance
                var (totalAssets, totalLegs, activeAssets, disposedAssets, pendingApprovals)
                    = await _repo.GetOrgSummaryCountsAsync(orgId);

                var summary = new OrganisationTransferSummaryDto
                {
                    OrganizationId = orgId,
                    TotalAssets = totalAssets,
                    TotalTransferLegs = totalLegs,
                    TotalActiveAssets = activeAssets,
                    TotalDisposedAssets = disposedAssets,
                    TotalPendingApprovals = pendingApprovals,
                };

                return (true, "Organisation transfer summary retrieved successfully.", summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving organisation transfer summary");
                return (false, "An error occurred while retrieving the summary.", null);
            }
        }

        // ─────────────────────────────────────────────────────────────────────────
        // CHAIN BUILDER — pure in-memory, no DB calls
        //
        // Converts a flat list of rows (all for the same asset, ordered by date)
        // into a structured AssetTransferHistoryDto with a full TransferChain.
        // ─────────────────────────────────────────────────────────────────────────

        private static AssetTransferHistoryDto BuildAssetHistory(List<AssetTransferFlatRow> rows)
        {
            var firstRow = rows[0];

            var history = new AssetTransferHistoryDto
            {
                AssetRowId = firstRow.AssetRowId,
                AssetId = firstRow.AssetId,
                AssetName = firstRow.AssetName,
                AssetBrand = firstRow.AssetBrand,
                AssetModelNo = firstRow.AssetModelNo,
                AssetSerialNo = firstRow.AssetSerialNo,
                CategoryDisplay = firstRow.CategoryName,
                SubCategoryDisplay = firstRow.SubCategoryName,
                DepartmentDisplay = firstRow.DepartmentName,
                ImageUrl = firstRow.AssetImageUrl,
                IsCancelled = firstRow.AssetCancelled,
                IsDisposed = firstRow.AssetTypeOnAsset == (int)AssetType.Disposed
                                  || firstRow.AssetAssignTo == (int)AssignToType.Disposed,
            };

            var legs = new List<AssetTransferLegDto>(rows.Count);

            for (int i = 0; i < rows.Count; i++)
            {
                var currentRow = rows[i];
                var nextRow = i < rows.Count - 1 ? rows[i + 1] : null;

                legs.Add(BuildLeg(currentRow, nextRow));
            }

            history.TransferChain = legs;
            history.TotalTransfers = legs.Count;
            history.FirstAssignedDate = legs[0].TransferDate ?? legs[0].CreatedDate;
            history.LastTransferDate = legs[legs.Count - 1].TransferDate ?? legs[legs.Count - 1].CreatedDate;

            return history;
        }

        /// <summary>
        /// Builds a single transfer leg from one flat row.
        /// nextRow is needed only to calculate when this leg ended (HoldEnd).
        /// </summary>
        private static AssetTransferLegDto BuildLeg(AssetTransferFlatRow row, AssetTransferFlatRow? nextRow)
        {
            // This leg is "current" if it is the last one and not yet closed
            bool isCurrent = nextRow == null
                && row.AssignmentStatus != AssetAssignedStatus.UnAssigned;

            // How long did this holder keep the asset?
            DateTime? holdStart = row.TransferDate ?? row.AssignmentCreatedDate;
            DateTime? holdEnd = isCurrent
                ? null  // Still holding — no end date
                : nextRow?.TransferDate ?? nextRow?.AssignmentCreatedDate;

            int? holdDays = null;
            if (holdStart.HasValue)
            {
                var endDate = holdEnd ?? DateTime.Now;
                holdDays = (int)(endDate - holdStart.Value).TotalDays;
            }

            var assetType = row.AssetType.HasValue ? (AssetType)row.AssetType.Value : AssetType.Created;
            var assignTo = row.AssignTo.HasValue ? (AssignToType)row.AssignTo.Value : AssignToType.NotAssigned;
            var approvalStatus = row.ApprovalStatus.HasValue ? (TransferApprovalStatus)row.ApprovalStatus.Value : TransferApprovalStatus.Pending;

            var leg = new AssetTransferLegDto
            {
                // Identity
                AssignmentId = row.AssignmentId,
                PreviousAssignmentId = row.AssignedFrom,

                // Type / status
                AssetType = assetType,
                AssetTypeDisplay = assetType.ToString(),
                AssignTo = assignTo,
                AssignToDisplay = assignTo.ToString(),
                ApprovalStatus = approvalStatus,
                ApprovalStatusDisplay = approvalStatus.ToString(),
                Status = row.AssignmentStatus,

                // Approval trail
                ApprovedByLevel1 = row.Level1Approvedby,
                ApprovedByLevel2 = row.Level2Approvedby,
                ApprovedByLevel3 = row.Level3Approvedby,
                Level1ApprovedDate = row.Level1ApprovedDate,
                Level2ApprovedDate = row.Level2ApprovedDate,
                Level3ApprovedDate = row.Level3ApprovedDate,

                // Dates
                TransferDate = row.TransferDate,
                DueDate = row.DueDate,
                CreatedDate = row.AssignmentCreatedDate,
                ModifiedDate = row.AssignmentModifiedDate,

                // Holding period
                HoldStart = holdStart,
                HoldEnd = holdEnd,
                HoldDays = holdDays,

                // Who triggered this transfer
                TransferredByEmail = row.TransferredByEmail,
                TransferredByUser = BuildTransferredByUser(row),

                IsCurrent = isCurrent,
            };

            // Populate the correct holder type
            if (assignTo == AssignToType.User && row.HolderUserId.HasValue)
            {
                leg.HolderUser = BuildHolderUser(row);
            }
            else if (assignTo == AssignToType.SiteOrBranch && row.HolderSiteId.HasValue)
            {
                leg.HolderSite = BuildHolderSite(row);
            }
            else if (assignTo == AssignToType.Disposed)
            {
                leg.IsDisposalLeg = true;
                leg.DisposalDate = row.DisposalDate;
                leg.DisposalMethod = row.DisposalMethod.HasValue
                    ? ((DisposalMethod)row.DisposalMethod.Value).ToString()
                    : null;
                leg.DisposalDocument = row.DisposalDocument;
            }

            return leg;
        }

        private static TransferUserDto BuildHolderUser(AssetTransferFlatRow row)
        {
            return new TransferUserDto
            {
                UserProfileId = row.HolderUserId,
                FirstName = row.HolderUserFirstName,
                LastName = row.HolderUserLastName,
                Email = row.HolderUserEmail,
                PhoneNumber = row.HolderUserPhone,
                ProfilePicture = row.HolderUserPicture,
                DesignationDisplay = row.HolderUserDesignation,
                DepartmentDisplay = row.HolderUserDepartment,
            };
        }

        private static TransferSiteDto BuildHolderSite(AssetTransferFlatRow row)
        {
            return new TransferSiteDto
            {
                SiteId = row.HolderSiteId,
                SiteName = row.HolderSiteName,
                SiteDescription = row.HolderSiteDescription,
                SiteAddress = row.HolderSiteAddress,
                SiteType = row.HolderSiteType,
                CityName = row.HolderSiteCityName,
                Area = row.HolderAreaId.HasValue ? new TransferAreaDto
                {
                    AreaId = row.HolderAreaId,
                    AreaName = row.HolderAreaName,
                    AreaDescription = row.HolderAreaDescription,
                } : null,
            };
        }

        private static TransferUserDto? BuildTransferredByUser(AssetTransferFlatRow row)
        {
            // Always return at least the email so callers know who triggered the transfer
            if (string.IsNullOrEmpty(row.TransferredByEmail))
                return null;

            return new TransferUserDto
            {
                UserProfileId = row.TransferredByUserProfileId,
                FirstName = row.TransferredByFirstName,
                LastName = row.TransferredByLastName,
                Email = row.TransferredByEmail,
                PhoneNumber = row.TransferredByPhone,
                ProfilePicture = row.TransferredByPicture,
                DesignationDisplay = row.TransferredByDesignation,
                DepartmentDisplay = row.TransferredByDepartment,
            };
        }
    }
}
