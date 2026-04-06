using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Services.Reports.AssetTransferReport.DTOs;
using SAMS.Services.Reports.AssetTransferReport.Interface;
using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Services.Reports.AssetTransferReport
{
    public class AssetTransferReportRepository : IAssetTransferReportRepository
    {
        private readonly ApplicationDbContext _context;

        public AssetTransferReportRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // CORE JOIN QUERY
        //
        // Builds a single SQL query that joins AssetAssigned with all related tables.
        // The caller passes in a filtered IQueryable<long> of asset ids so that
        // the same join logic is reused for single-asset and full-org queries.
        //
        // Why we do NOT join the "transferred-by" user here:
        //   Joining UserProfiles by (Email + OrgId) produces a correlated subquery
        //   in EF Core. Instead we resolve those users in one separate query and
        //   merge the results in memory (see ResolveTransferredByUsersAsync).
        // ─────────────────────────────────────────────────────────────────────────

        private IQueryable<AssetTransferFlatRow> BuildTransferJoinQuery(IQueryable<long> assetIdScope)
        {
            return
                from aa in _context.AssetAssigned.AsNoTracking()
                where assetIdScope.Contains(aa.AssetId) && !aa.Cancelled

                // Join the asset itself
                join a in _context.Asset.AsNoTracking()
                    on aa.AssetId equals a.Id

                // Category name
                join cat in _context.AssetCategorie.AsNoTracking()
                    on a.Category equals cat.Id into catGroup
                from category in catGroup.DefaultIfEmpty()

                    // Sub-category name
                join sub in _context.AssetSubCategories.AsNoTracking()
                    on a.SubCategory equals sub.Id into subGroup
                from subCategory in subGroup.DefaultIfEmpty()

                    // Department name (stored on the asset)
                join dept in _context.Department.AsNoTracking()
                    on a.Department equals dept.Id into deptGroup
                from assetDept in deptGroup.DefaultIfEmpty()

                    // User who is/was holding the asset (only filled when AssignTo == User)
                join holderUser in _context.UserProfiles.AsNoTracking()
                    on aa.UserId equals holderUser.UserProfileId into holderUserGroup
                from hUser in holderUserGroup.DefaultIfEmpty()

                    // Holder user's designation
                join holderDesig in _context.Designation.AsNoTracking()
                    on hUser.Designation equals holderDesig.Id into holderDesigGroup
                from hDesig in holderDesigGroup.DefaultIfEmpty()

                    // Holder user's department
                join holderDept in _context.Department.AsNoTracking()
                    on hUser.Department equals holderDept.Id into holderDeptGroup
                from hDept in holderDeptGroup.DefaultIfEmpty()

                    // Site/Branch holding the asset (only filled when AssignTo == SiteOrBranch)
                join site in _context.AssetSite.AsNoTracking()
                    on aa.SiteId equals site.Id into siteGroup
                from hSite in siteGroup.DefaultIfEmpty()

                    // City of the site
                join city in _context.AssetCities.AsNoTracking()
                    on hSite.City equals city.Id into cityGroup
                from hCity in cityGroup.DefaultIfEmpty()

                    // Area within the site
                join area in _context.AssetArea.AsNoTracking()
                    on aa.AreaId equals area.Id into areaGroup
                from hArea in areaGroup.DefaultIfEmpty()

                select new AssetTransferFlatRow
                {
                    // ── Asset fields ────────────────────────────────────────────────
                    AssetRowId = a.Id,
                    AssetId = a.AssetId,
                    AssetName = a.Name,
                    AssetBrand = a.AssetBrand,
                    AssetModelNo = a.AssetModelNo,
                    AssetSerialNo = a.AssetSerialNo,
                    CategoryName = category.Name,
                    SubCategoryName = subCategory.Name,
                    DepartmentName = assetDept.Name,
                    AssetImageUrl = a.ImageUrl,
                    AssetAssignTo = a.AssignTo,
                    AssetTypeOnAsset = a.AssetType,
                    AssetCancelled = a.Cancelled,
                    DisposalDate = a.DisposalDate,
                    DisposalMethod = a.DisposalMethod,
                    DisposalDocument = a.DisposalDocument,

                    // ── AssetAssigned fields ────────────────────────────────────────
                    AssignmentId = aa.Id,
                    AssignedFrom = aa.AssignedFrom,
                    AssetType = aa.AssetType,
                    AssignTo = (int?)aa.AssignTo,
                    ApprovalStatus = aa.ApprovalStatus,
                    AssignmentStatus = aa.Status,
                    TransferDate = aa.TransferDate,
                    DueDate = aa.DueDate,
                    AssignmentCreatedDate = aa.CreatedDate,
                    AssignmentModifiedDate = aa.ModifiedDate,
                    TransferredByEmail = aa.CreatedBy,
                    Level1Approvedby = aa.Level1Approvedby,
                    Level2Approvedby = aa.Level2Approvedby,
                    Level3Approvedby = aa.Level3Approvedby,
                    Level1ApprovedDate = aa.Level1ApprovedDate,
                    Level2ApprovedDate = aa.Level2ApprovedDate,
                    Level3ApprovedDate = aa.Level3ApprovedDate,

                    // ── Holder user fields ──────────────────────────────────────────
                    HolderUserId = hUser != null ? hUser.UserProfileId : (long?)null,
                    HolderUserFirstName = hUser != null ? hUser.FirstName : null,
                    HolderUserLastName = hUser != null ? hUser.LastName : null,
                    HolderUserEmail = hUser != null ? hUser.Email : null,
                    HolderUserPhone = hUser != null ? hUser.PhoneNumber : null,
                    HolderUserPicture = hUser != null ? hUser.ProfilePicture : null,
                    HolderUserDesignation = hDesig != null ? hDesig.Name : null,
                    HolderUserDepartment = hDept != null ? hDept.Name : null,

                    // ── Holder site fields ──────────────────────────────────────────
                    HolderSiteId = hSite != null ? hSite.Id : (long?)null,
                    HolderSiteName = hSite != null ? hSite.Name : null,
                    HolderSiteDescription = hSite != null ? hSite.Description : null,
                    HolderSiteAddress = hSite != null ? hSite.Address : null,
                    HolderSiteType = hSite != null ? hSite.Type.ToString() : null,
                    HolderSiteCityName = hCity != null ? hCity.Name : null,
                    HolderAreaId = hArea != null ? hArea.Id : (long?)null,
                    HolderAreaName = hArea != null ? hArea.Name : null,
                    HolderAreaDescription = hArea != null ? hArea.Description : null,

                    // TransferredBy fields are left null here — filled in by ResolveTransferredByUsersAsync
                    TransferredByUserProfileId = null,
                    TransferredByFirstName = null,
                    TransferredByLastName = null,
                    TransferredByPhone = null,
                    TransferredByPicture = null,
                    TransferredByDesignation = null,
                    TransferredByDepartment = null,
                };
        }

        // ─────────────────────────────────────────────────────────────────────────
        // RESOLVE TRANSFERRED-BY USERS
        //
        // Instead of joining UserProfiles inside the main query (which causes a
        // slow correlated subquery), we collect all unique "CreatedBy" email
        // addresses from the result rows and resolve them in ONE separate query.
        // Then we merge the results back into the rows in-memory.
        // ─────────────────────────────────────────────────────────────────────────

        private async Task<Dictionary<string, TransferredByUserInfo>> GetTransferredByUserLookupAsync(
            List<AssetTransferFlatRow> rows, Guid orgId)
        {
            // Collect unique emails from the rows we already have
            var uniqueEmails = rows
                .Where(r => !string.IsNullOrEmpty(r.TransferredByEmail))
                .Select(r => r.TransferredByEmail!)
                .Distinct()
                .ToList();

            if (!uniqueEmails.Any())
                return new Dictionary<string, TransferredByUserInfo>(StringComparer.OrdinalIgnoreCase);

            // One query — get all matching user profiles + their designation/department
            var users = await (
                from up in _context.UserProfiles.AsNoTracking()
                where uniqueEmails.Contains(up.Email!) && up.OrganizationId == orgId && !up.Cancelled

                join desig in _context.Designation.AsNoTracking()
                    on up.Designation equals desig.Id into desigGroup
                from designation in desigGroup.DefaultIfEmpty()

                join dept in _context.Department.AsNoTracking()
                    on up.Department equals dept.Id into deptGroup
                from department in deptGroup.DefaultIfEmpty()

                select new TransferredByUserInfo
                {
                    Email = up.Email,
                    UserProfileId = up.UserProfileId,
                    FirstName = up.FirstName,
                    LastName = up.LastName,
                    PhoneNumber = up.PhoneNumber,
                    ProfilePicture = up.ProfilePicture,
                    DesignationName = designation != null ? designation.Name : null,
                    DepartmentName = department != null ? department.Name : null,
                }
            ).ToListAsync();

            // Build a dictionary keyed by email for fast lookup
            return users
                .GroupBy(u => u.Email ?? string.Empty, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        }

        /// <summary>Merge the transferred-by user info into each row (in-place mutation).</summary>
        private static void MergeTransferredByUsers(
            List<AssetTransferFlatRow> rows,
            Dictionary<string, TransferredByUserInfo> lookup)
        {
            foreach (var row in rows)
            {
                if (string.IsNullOrEmpty(row.TransferredByEmail)) continue;
                if (!lookup.TryGetValue(row.TransferredByEmail, out var user)) continue;

                row.TransferredByUserProfileId = user.UserProfileId;
                row.TransferredByFirstName = user.FirstName;
                row.TransferredByLastName = user.LastName;
                row.TransferredByPhone = user.PhoneNumber;
                row.TransferredByPicture = user.ProfilePicture;
                row.TransferredByDesignation = user.DesignationName;
                row.TransferredByDepartment = user.DepartmentName;
            }
        }

        // ─────────────────────────────────────────────────────────────────────────
        // PUBLIC METHODS
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<List<AssetTransferFlatRow>> GetTransferRowsByAssetRowIdAsync(
            long assetRowId, Guid orgId)
        {
            // Scope the join to this one asset by its numeric id
            var assetScope = _context.Asset.AsNoTracking()
                .Where(a => a.Id == assetRowId && a.OrganizationId == orgId)
                .Select(a => a.Id);

            var rows = await BuildTransferJoinQuery(assetScope)
                .OrderBy(r => r.AssignmentCreatedDate)
                .ToListAsync();

            if (!rows.Any())
                return rows;

            // Resolve who triggered each transfer
            var lookup = await GetTransferredByUserLookupAsync(rows, orgId);
            MergeTransferredByUsers(rows, lookup);

            return rows;
        }

        public async Task<List<AssetTransferFlatRow>> GetTransferRowsByAssetIdStringAsync(
            string assetId, Guid orgId)
        {
            // Scope the join to this one asset by its business AssetId string
            var assetScope = _context.Asset.AsNoTracking()
                .Where(a => a.AssetId == assetId && a.OrganizationId == orgId)
                .Select(a => a.Id);

            var rows = await BuildTransferJoinQuery(assetScope)
                .OrderBy(r => r.AssignmentCreatedDate)
                .ToListAsync();

            if (!rows.Any())
                return rows;

            var lookup = await GetTransferredByUserLookupAsync(rows, orgId);
            MergeTransferredByUsers(rows, lookup);

            return rows;
        }

        public async Task<List<AssetTransferFlatRow>> GetAllTransferRowsByOrgAsync(Guid orgId)
        {
            // Scope to all non-cancelled assets in this organisation
            var assetScope = _context.Asset.AsNoTracking()
                .Where(a => a.OrganizationId == orgId && !a.Cancelled)
                .Select(a => a.Id);

            var rows = await BuildTransferJoinQuery(assetScope)
                .OrderBy(r => r.AssetRowId)              // Group assets together
                .ThenBy(r => r.AssignmentCreatedDate)    // Oldest leg first within each asset
                .ToListAsync();

            if (!rows.Any())
                return rows;

            var lookup = await GetTransferredByUserLookupAsync(rows, orgId);
            MergeTransferredByUsers(rows, lookup);

            return rows;
        }

        public async Task<(int totalAssets, int totalLegs, int activeAssets, int disposedAssets, int pendingApprovals)>
            GetOrgSummaryCountsAsync(Guid orgId)
        {
            // ── IMPORTANT: Each query is awaited individually (sequential) ──────────
            // EF Core DbContext is NOT thread-safe. Running multiple queries in parallel
            // on the same context instance (via Task.WhenAll) causes:
            //   "A second operation was started on this context before a previous operation completed."
            // We await each count one at a time — it is slightly slower but correct and stable.

            var totalAssets = await _context.Asset
                .AsNoTracking()
                .Where(a => a.OrganizationId == orgId && !a.Cancelled)
                .CountAsync();

            var totalLegs = await _context.AssetAssigned
                .AsNoTracking()
                .Where(aa => aa.OrganizationId == orgId && !aa.Cancelled)
                .CountAsync();

            var activeAssets = await _context.Asset
                .AsNoTracking()
                .Where(a => a.OrganizationId == orgId
                         && !a.Cancelled
                         && a.AssignTo != (int)AssignToType.Disposed)
                .CountAsync();

            var disposedAssets = await _context.Asset
                .AsNoTracking()
                .Where(a => a.OrganizationId == orgId
                         && !a.Cancelled
                         && a.AssignTo == (int)AssignToType.Disposed)
                .CountAsync();

            var pendingApprovals = await _context.AssetAssigned
                .AsNoTracking()
                .Where(aa => aa.OrganizationId == orgId
                          && !aa.Cancelled
                          && aa.ApprovalStatus == (int)TransferApprovalStatus.Pending)
                .CountAsync();

            return (totalAssets, totalLegs, activeAssets, disposedAssets, pendingApprovals);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // Private helper type — only used inside GetTransferredByUserLookupAsync
        // ─────────────────────────────────────────────────────────────────────────

        private sealed class TransferredByUserInfo
        {
            public string? Email { get; set; }
            public long UserProfileId { get; set; }
            public string? FirstName { get; set; }
            public string? LastName { get; set; }
            public string? PhoneNumber { get; set; }
            public string? ProfilePicture { get; set; }
            public string? DesignationName { get; set; }
            public string? DepartmentName { get; set; }
        }
    }
}
