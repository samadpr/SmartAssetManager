using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Helpers.Enum;
using SAMS.Services.Dashboard.DTOs;
using SAMS.Services.Dashboard.Interface;
using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Services.Dashboard
{
    public class DashboardRepository : IDashboardRepository
    {
        private readonly ApplicationDbContext _context;

        public DashboardRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // ─── 1. KPI Stats ────────────────────────────────────────────────────────
        public async Task<KpiStatsDto> GetKpiStatsAsync(Guid orgId)
        {
            var now = DateTime.Now;
            var prevMonthStart = new DateTime(now.Year, now.Month, 1).AddMonths(-1);
            var currMonthStart = new DateTime(now.Year, now.Month, 1);

            // Total Assets (non-cancelled, non-disposed)
            var allAssets = await _context.Asset
                .Where(a => a.OrganizationId == orgId && !a.Cancelled)
                .ToListAsync();

            var totalAssets = allAssets.Count;
            var prevTotalAssets = allAssets.Count(a => a.CreatedDate < currMonthStart);
            var totalAssetsTrend = prevTotalAssets == 0 ? 0
                : Math.Round((decimal)(totalAssets - prevTotalAssets) / prevTotalAssets * 100, 1);

            var assetSparkline = GetMonthlySparkline(allAssets.Select(a => a.CreatedDate).ToList(), 12);

            // Active Users
            var allUsers = await _context.UserProfiles
                .Where(u => u.OrganizationId == orgId && !u.Cancelled)
                .ToListAsync();

            var activeUsers = allUsers.Count;
            var prevActiveUsers = allUsers.Count(u => u.CreatedDate < currMonthStart);
            var activeUsersTrend = prevActiveUsers == 0 ? 0
                : Math.Round((decimal)(activeUsers - prevActiveUsers) / prevActiveUsers * 100, 1);

            var userSparkline = GetMonthlySparkline(allUsers.Select(u => u.CreatedDate).ToList(), 12);

            // Open Issues (excluding Closed=9 and Resolved=3)
            var allIssues = await _context.AssetIssue
                .Where(i => i.OrganizationId == orgId && !i.Cancelled)
                .ToListAsync();

            var openIssues = allIssues.Count(i => i.Status != AssetIssueStatus.Closed && i.Status != AssetIssueStatus.Resolved);
            var prevOpenIssues = allIssues.Count(i =>
                i.CreatedDate < currMonthStart &&
                i.Status != AssetIssueStatus.Closed &&
                i.Status != AssetIssueStatus.Resolved);
            var openIssuesTrend = prevOpenIssues == 0 ? 0
                : Math.Round((decimal)(openIssues - prevOpenIssues) / prevOpenIssues * 100, 1);

            var issueSparkline = GetMonthlySparkline(
                allIssues.Where(i => i.Status != AssetIssueStatus.Closed && i.Status != AssetIssueStatus.Resolved)
                         .Select(i => i.CreatedDate).ToList(), 12);

            // Pending Approvals
            var pendingApprovals = await _context.AssetAssigned
                .CountAsync(a => a.OrganizationId == orgId && !a.Cancelled &&
                                 a.ApprovalStatus == (int)TransferApprovalStatus.Pending &&
                                 a.Status == AssetEnums.AssetAssignedStatus.Hold);

            var prevPendingApprovals = await _context.AssetAssigned
                .CountAsync(a => a.OrganizationId == orgId && !a.Cancelled &&
                                 a.ApprovalStatus == (int)TransferApprovalStatus.Pending &&
                                 a.Status == AssetEnums.AssetAssignedStatus.Hold &&
                                 a.CreatedDate < currMonthStart);

            var pendingApprovalsTrend = prevPendingApprovals == 0 ? 0
                : Math.Round((decimal)(pendingApprovals - prevPendingApprovals) / prevPendingApprovals * 100, 1);

            // Total Asset Value
            var totalValue = allAssets.Sum(a => (decimal)(a.UnitPrice ?? 0) * (a.Quantity ?? 1));
            var prevTotalValue = allAssets
                .Where(a => a.CreatedDate < currMonthStart)
                .Sum(a => (decimal)(a.UnitPrice ?? 0) * (a.Quantity ?? 1));
            var totalValueTrend = prevTotalValue == 0 ? 0
                : Math.Round((totalValue - prevTotalValue) / prevTotalValue * 100, 1);

            var valueSparkline = GetMonthlyValueSparkline(
                allAssets.Select(a => (a.CreatedDate, (decimal)(a.UnitPrice ?? 0) * (a.Quantity ?? 1))).ToList(), 12);

            // Depreciable Assets
            var depreciableAssets = allAssets.Count(a => a.IsDepreciable == true);
            var prevDepreciable = allAssets.Count(a => a.IsDepreciable == true && a.CreatedDate < currMonthStart);
            var depreciableTrend = prevDepreciable == 0 ? 0
                : Math.Round((decimal)(depreciableAssets - prevDepreciable) / prevDepreciable * 100, 1);

            var depSparkline = GetMonthlySparkline(
                allAssets.Where(a => a.IsDepreciable == true).Select(a => a.CreatedDate).ToList(), 12);

            // Sites and Branches
            var allSites = await _context.AssetSite
                .Where(s => s.OrganizationId == orgId && !s.Cancelled)
                .ToListAsync();

            var sitesCount = allSites.Count;
            var prevSites = allSites.Count(s => s.CreatedDate < currMonthStart);
            var sitesTrend = prevSites == 0 ? 0
                : Math.Round((decimal)(sitesCount - prevSites) / prevSites * 100, 1);

            var siteSparkline = GetMonthlySparkline(allSites.Select(s => s.CreatedDate).ToList(), 12);

            // Disposed Assets
            var disposedAssets = allAssets.Count(a => a.AssetType == (int)AssetType.Disposed);
            var prevDisposed = allAssets.Count(a => a.AssetType == (int)AssetType.Disposed && a.DisposalDate < currMonthStart);
            var disposedTrend = prevDisposed == 0 ? 0
                : Math.Round((decimal)(disposedAssets - prevDisposed) / prevDisposed * 100, 1);

            var disposedSparkline = GetMonthlySparkline(
                allAssets.Where(a => a.AssetType == (int)AssetType.Disposed && a.DisposalDate.HasValue)
                         .Select(a => a.DisposalDate!.Value).ToList(), 12);

            return new KpiStatsDto
            {
                TotalAssets = new KpiStatItemDto { Value = totalAssets, Trend = totalAssetsTrend, Sparkline = assetSparkline },
                ActiveUsers = new KpiStatItemDto { Value = activeUsers, Trend = activeUsersTrend, Sparkline = userSparkline },
                OpenIssues = new KpiStatItemDto { Value = openIssues, Trend = openIssuesTrend, Sparkline = issueSparkline },
                PendingApprovals = new KpiStatItemDto { Value = pendingApprovals, Trend = pendingApprovalsTrend, Sparkline = new List<object>() },
                TotalAssetValue = new KpiStatItemDto { Value = totalValue, Trend = totalValueTrend, Sparkline = valueSparkline },
                DepreciableAssets = new KpiStatItemDto { Value = depreciableAssets, Trend = depreciableTrend, Sparkline = depSparkline },
                SitesAndBranches = new KpiStatItemDto { Value = sitesCount, Trend = sitesTrend, Sparkline = siteSparkline },
                DisposedAssets = new KpiStatItemDto { Value = disposedAssets, Trend = disposedTrend, Sparkline = disposedSparkline }
            };
        }

        // ─── 2. Asset Status Distribution ────────────────────────────────────────
        public async Task<IEnumerable<AssetStatusDistributionDto>> GetAssetStatusDistributionAsync(Guid orgId, string filter)
        {
            var query = _context.Asset
                .Where(a => a.OrganizationId == orgId && !a.Cancelled && a.AssetStatus != null);

            if (filter == "active")
                query = query.Where(a => a.IsAvilable == true);

            var grouped = await query
                .GroupBy(a => a.AssetStatus)
                .Select(g => new { StatusId = g.Key, Count = g.Count() })
                .ToListAsync();

            var statusMap = new Dictionary<int, (string Key, string Label)>
            {
                { (int)AssetStatusEnum.InUse,              ("inuse",       "In Use")         },
                { (int)AssetStatusEnum.Available,          ("available",   "Available")      },
                { (int)AssetStatusEnum.Damaged,            ("damaged",     "Damaged")        },
                { (int)AssetStatusEnum.UnderMaintenance,   ("maintenance", "Maintenance")    },
                { (int)AssetStatusEnum.Expired,            ("expired",     "Expired")        },
                { (int)AssetStatusEnum.New,                ("new",         "New")            },
                { (int)AssetStatusEnum.Returned,           ("returned",    "Returned")       },
            };

            return grouped
                .Where(g => g.StatusId.HasValue && statusMap.ContainsKey((int)g.StatusId.Value))
                .Select(g => new AssetStatusDistributionDto
                {
                    StatusKey = statusMap[(int)g.StatusId!.Value].Key,
                    Label = statusMap[(int)g.StatusId!.Value].Label,
                    Count = g.Count
                })
                .OrderByDescending(x => x.Count)
                .ToList();
        }

        // ─── 3. Asset Growth ─────────────────────────────────────────────────────
        public async Task<IEnumerable<AssetGrowthDto>> GetAssetGrowthAsync(Guid orgId, string period)
        {
            int months = period switch { "3m" => 3, "6m" => 6, _ => 12 };

            var startDate = DateTime.Now.AddMonths(-months + 1);
            startDate = new DateTime(startDate.Year, startDate.Month, 1);

            var acquired = await _context.Asset
                .Where(a => a.OrganizationId == orgId && !a.Cancelled && a.CreatedDate >= startDate)
                .GroupBy(a => new { a.CreatedDate.Year, a.CreatedDate.Month })
                .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
                .ToListAsync();

            var disposed = await _context.Asset
                .Where(a => a.OrganizationId == orgId && !a.Cancelled &&
                            a.AssetType == (int)AssetType.Disposed &&
                            a.DisposalDate >= startDate)
                .GroupBy(a => new { a.DisposalDate!.Value.Year, a.DisposalDate!.Value.Month })
                .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
                .ToListAsync();

            var result = new List<AssetGrowthDto>();
            for (int i = 0; i < months; i++)
            {
                var date = startDate.AddMonths(i);
                var acqCount = acquired.FirstOrDefault(a => a.Year == date.Year && a.Month == date.Month)?.Count ?? 0;
                var dispCount = disposed.FirstOrDefault(d => d.Year == date.Year && d.Month == date.Month)?.Count ?? 0;

                result.Add(new AssetGrowthDto
                {
                    Month = date.ToString("MMM yyyy"),
                    Acquired = acqCount,
                    Disposed = dispCount
                });
            }

            return result;
        }

        // ─── 4. Asset Value By Category ──────────────────────────────────────────
        public async Task<IEnumerable<AssetValueByCategoryDto>> GetAssetValueByCategoryAsync(Guid orgId, string sort)
        {
            var result = await (
                from a in _context.Asset
                join cat in _context.AssetCategorie on a.Category equals cat.Id into catGroup
                from category in catGroup.DefaultIfEmpty()
                where a.OrganizationId == orgId && !a.Cancelled && a.Category != null
                group new { a, category } by new { a.Category, category.Name } into g
                select new AssetValueByCategoryDto
                {
                    CategoryId = g.Key.Category!.Value,
                    Label = g.Key.Name ?? "Unknown",
                    TotalValue = g.Sum(x => (decimal)(x.a.UnitPrice ?? 0) * (x.a.Quantity ?? 1)),
                    Count = g.Count()
                }
            ).ToListAsync();

            return sort == "count"
                ? result.OrderByDescending(x => x.Count).ToList()
                : result.OrderByDescending(x => x.TotalValue).ToList();
        }

        // ─── 5. Depreciation Summary ─────────────────────────────────────────────
        public async Task<IEnumerable<DepreciationSummaryDto>> GetDepreciationSummaryAsync(Guid orgId, string groupBy)
        {
            var assets = await _context.Asset
                .Where(a => a.OrganizationId == orgId && !a.Cancelled && a.IsDepreciable == true)
                .ToListAsync();

            if (groupBy == "method")
            {
                var methodMap = new Dictionary<int, string>
                {
                    { (int)DepreciationMethod.StraightLine,           "Straight Line"       },
                    { (int)DepreciationMethod.DecliningBalance,       "Declining Balance"   },
                    { (int)DepreciationMethod.DoubleDecliningBalance, "Double Declining"    },
                    { (int)DepreciationMethod.OneFiftyDecliningBalance, "150% Declining"    },
                    { (int)DepreciationMethod.SumOfYearsDigits,       "Sum of Years Digits" }
                };

                return assets
                    .Where(a => a.DepreciationMethod.HasValue && methodMap.ContainsKey(a.DepreciationMethod.Value))
                    .GroupBy(a => a.DepreciationMethod!.Value)
                    .Select(g => new DepreciationSummaryDto
                    {
                        Label = methodMap[g.Key],
                        Total = g.Sum(a => a.DepreciableCost ?? 0)
                    })
                    .OrderByDescending(x => x.Total)
                    .ToList();
            }

            if (groupBy == "category")
            {
                return await (
                    from a in _context.Asset
                    join cat in _context.AssetCategorie on a.Category equals cat.Id into catGroup
                    from category in catGroup.DefaultIfEmpty()
                    where a.OrganizationId == orgId && !a.Cancelled && a.IsDepreciable == true
                    group new { a, category } by category.Name into g
                    select new DepreciationSummaryDto
                    {
                        Label = g.Key ?? "Unknown",
                        Total = g.Sum(x => x.a.DepreciableCost ?? 0)
                    }
                ).OrderByDescending(x => x.Total).ToListAsync();
            }

            if (groupBy == "dept")
            {
                return await (
                    from a in _context.Asset
                    join dept in _context.Department on a.Department equals dept.Id into deptGroup
                    from department in deptGroup.DefaultIfEmpty()
                    where a.OrganizationId == orgId && !a.Cancelled && a.IsDepreciable == true
                    group new { a, department } by department.Name into g
                    select new DepreciationSummaryDto
                    {
                        Label = g.Key ?? "Unknown",
                        Total = g.Sum(x => x.a.DepreciableCost ?? 0)
                    }
                ).OrderByDescending(x => x.Total).ToListAsync();
            }

            return Enumerable.Empty<DepreciationSummaryDto>();
        }

        // ─── 6. Issue Summary ────────────────────────────────────────────────────
        public async Task<IEnumerable<IssueSummaryDto>> GetIssueSummaryAsync(Guid orgId, string groupBy)
        {
            if (groupBy == "status")
            {
                var statusMap = new Dictionary<AssetIssueStatus, (string Key, string Label)>
                {
                    { AssetIssueStatus.New,        ("new",        "New")         },
                    { AssetIssueStatus.InProgress, ("inprogress", "In Progress") },
                    { AssetIssueStatus.Pending,    ("pending",    "Pending")     },
                    { AssetIssueStatus.Blocker,    ("blocker",    "Blocker")     },
                    { AssetIssueStatus.Resolved,   ("resolved",   "Resolved")   },
                    { AssetIssueStatus.Closed,     ("closed",     "Closed")     }
                };

                var grouped = await _context.AssetIssue
                    .Where(i => i.OrganizationId == orgId && !i.Cancelled)
                    .GroupBy(i => i.Status)
                    .Select(g => new { StatusId = g.Key, Count = g.Count() })
                    .ToListAsync();

                return grouped
                    .Where(g => statusMap.ContainsKey(g.StatusId!.Value))
                    .Select(g => new IssueSummaryDto
                    {
                        StatusKey = statusMap[g.StatusId!.Value].Key,
                        Label = statusMap[g.StatusId.Value].Label,
                        Count = g.Count
                    })
                    .ToList();
            }

            if (groupBy == "month")
            {
                var sixMonthsAgo = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1).AddMonths(-5);

                var monthlyData = await _context.AssetIssue
                    .Where(i => i.OrganizationId == orgId && !i.Cancelled && i.CreatedDate >= sixMonthsAgo)
                    .GroupBy(i => new { i.CreatedDate.Year, i.CreatedDate.Month })
                    .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
                    .ToListAsync();

                var result = new List<IssueSummaryDto>();
                for (int i = 0; i < 6; i++)
                {
                    var date = sixMonthsAgo.AddMonths(i);
                    var count = monthlyData.FirstOrDefault(m => m.Year == date.Year && m.Month == date.Month)?.Count ?? 0;
                    result.Add(new IssueSummaryDto
                    {
                        StatusKey = null,
                        Label = date.ToString("MMM yyyy"),
                        Count = count
                    });
                }
                return result;
            }

            return Enumerable.Empty<IssueSummaryDto>();
        }

        // ─── 7. User Distribution ────────────────────────────────────────────────
        public async Task<IEnumerable<UserDistributionDto>> GetUserDistributionAsync(Guid orgId, string groupBy)
        {
            if (groupBy == "department")
            {
                return await (
                    from u in _context.UserProfiles
                    join dept in _context.Department on u.Department equals dept.Id into deptGroup
                    from department in deptGroup.DefaultIfEmpty()
                    where u.OrganizationId == orgId && !u.Cancelled
                    group u by department.Name into g
                    select new UserDistributionDto { Label = g.Key ?? "Unknown", Count = g.Count() }
                ).OrderByDescending(x => x.Count).ToListAsync();
            }

            if (groupBy == "designation")
            {
                return await (
                    from u in _context.UserProfiles
                    join des in _context.Designation on u.Designation equals des.Id into desGroup
                    from designation in desGroup.DefaultIfEmpty()
                    where u.OrganizationId == orgId && !u.Cancelled
                    group u by designation.Name into g
                    select new UserDistributionDto { Label = g.Key ?? "Unknown", Count = g.Count() }
                ).OrderByDescending(x => x.Count).ToListAsync();
            }

            if (groupBy == "site")
            {
                return await (
                    from u in _context.UserProfiles
                    join site in _context.AssetSite on u.Site equals site.Id into siteGroup
                    from assetSite in siteGroup.DefaultIfEmpty()
                    where u.OrganizationId == orgId && !u.Cancelled
                    group u by assetSite.Name into g
                    select new UserDistributionDto { Label = g.Key ?? "Unknown", Count = g.Count() }
                ).OrderByDescending(x => x.Count).ToListAsync();
            }

            if (groupBy == "role")
            {
                return await (
                    from u in _context.UserProfiles
                    join role in _context.ManageUserRoles on u.RoleId equals role.Id into roleGroup
                    from manageRole in roleGroup.DefaultIfEmpty()
                    where u.OrganizationId == orgId && !u.Cancelled
                    group u by manageRole.Name into g
                    select new UserDistributionDto { Label = g.Key ?? "Unknown", Count = g.Count() }
                ).OrderByDescending(x => x.Count).ToListAsync();
            }

            return Enumerable.Empty<UserDistributionDto>();
        }

        // ─── 8. Approval Pipeline ────────────────────────────────────────────────
        public async Task<ApprovalPipelineDto> GetApprovalPipelineAsync(Guid orgId)
        {
            var data = await _context.AssetAssigned
                .Where(a => a.OrganizationId == orgId && !a.Cancelled)
                .GroupBy(a => a.ApprovalStatus)
                .Select(g => new { StatusId = g.Key, Count = g.Count() })
                .ToListAsync();

            return new ApprovalPipelineDto
            {
                Pending = data.FirstOrDefault(d => d.StatusId == (int)TransferApprovalStatus.Pending)?.Count ?? 0,
                Approved = data.FirstOrDefault(d => d.StatusId == (int)TransferApprovalStatus.Approved)?.Count ?? 0,
                Rejected = data.FirstOrDefault(d => d.StatusId == (int)TransferApprovalStatus.Rejected)?.Count ?? 0
            };
        }

        // ─── 9. Sites Asset Summary ──────────────────────────────────────────────
        public async Task<IEnumerable<SiteAssetSummaryDto>> GetSitesAssetSummaryAsync(Guid orgId, string filter)
        {
            var siteQuery = _context.AssetSite.Where(s => s.OrganizationId == orgId && !s.Cancelled);

            if (filter == "1")
                siteQuery = siteQuery.Where(s => s.Type == SiteOrBranch.Site);
            else if (filter == "2")
                siteQuery = siteQuery.Where(s => s.Type == SiteOrBranch.Branch);

            var sites = await siteQuery
                .Join(_context.AssetCities, s => s.City, c => c.Id, (s, c) => new { Site = s, CityName = c.Name })
                .ToListAsync();

            var siteIds = sites.Select(s => s.Site.Id).ToList();

            var assets = await _context.Asset
                .Where(a => a.OrganizationId == orgId && !a.Cancelled && a.SiteId.HasValue && siteIds.Contains(a.SiteId.Value) && a.AssignTo != (int)AssignToType.Disposed)
                .Join(_context.AssetStatuses, a => a.AssetStatus, s => s.Id, (a, s) => new
                {
                    a.Id,
                    a.AssetId,
                    a.Name,
                    a.SiteId,
                    a.UnitPrice,
                    a.Quantity,
                    StatusName = s.Name,
                    a.AssetStatus,
                    a.CreatedDate,
                    a.Category,
                    a.ImageUrl,
                    a.AssignTo
                })
                .ToListAsync();

            var statusKeyMap = new Dictionary<int, string>
            {
                { (int)AssetStatusEnum.InUse, "inuse" },
                { (int)AssetStatusEnum.Available, "available" },
                { (int)AssetStatusEnum.Damaged, "damaged" },
                { (int)AssetStatusEnum.UnderMaintenance, "maintenance" },
                { (int)AssetStatusEnum.Expired, "expired" },
                { (int)AssetStatusEnum.New, "new" },
                { (int)AssetStatusEnum.Returned, "returned" }
            };

            return sites.Select(s => new SiteAssetSummaryDto
            {
                SiteId = s.Site.Id,
                Name = s.Site.Name,
                City = s.CityName,
                Type = (int)s.Site.Type,
                AssetCount = assets.Count(a => a.SiteId == s.Site.Id),
                TotalValue = assets
                    .Where(a => a.SiteId == s.Site.Id)
                    .Sum(a => (decimal)(a.UnitPrice ?? 0) * (a.Quantity ?? 1)),
                Assets = assets
                    .Where(a => a.SiteId == s.Site.Id)
                    .OrderByDescending(a => a.CreatedDate)
                    .Take(8)
                    .Select(a => new SiteAssetMiniDto
                    {
                        Id = a.Id,
                        AssetId = a.AssetId,
                        Name = a.Name ?? string.Empty,
                        Status = a.StatusName ?? string.Empty,
                        StatusKey = a.AssetStatus.HasValue && statusKeyMap.ContainsKey((int)a.AssetStatus.Value)
                            ? statusKeyMap[(int)a.AssetStatus.Value]
                            : "unknown",
                        CategoryDisplay = a.Category.HasValue ? _context.AssetCategorie.FirstOrDefault(c => c.Id == a.Category && c.OrganizationId == orgId)?.Name ?? string.Empty : string.Empty,
                        UnitPrice = a.UnitPrice,
                        AssetImageUrl = a.ImageUrl,
                        AssetAssignTo = (AssignToType)a.AssignTo!
                    })
                    .ToList()
            }).ToList();
        }

        // ─── 10. Recent Assets ───────────────────────────────────────────────────
        public async Task<IEnumerable<RecentAssetDto>> GetRecentAssetsAsync(Guid orgId, int count)
        {
            var statusKeyMap = new Dictionary<int, string>
            {
                { (int)AssetStatusEnum.InUse, "inuse" },
                { (int)AssetStatusEnum.Available, "available" },
                { (int)AssetStatusEnum.Damaged, "damaged" },
                { (int)AssetStatusEnum.UnderMaintenance, "maintenance" },
                { (int)AssetStatusEnum.Expired, "expired" },
                { (int)AssetStatusEnum.New, "new" },
                { (int)AssetStatusEnum.Returned, "returned" }
            };

            return await (
                from a in _context.Asset
                join cat in _context.AssetCategorie on a.Category equals cat.Id into catGroup
                from category in catGroup.DefaultIfEmpty()
                join site in _context.AssetSite on a.SiteId equals site.Id into siteGroup
                from assetSite in siteGroup.DefaultIfEmpty()
                where a.OrganizationId == orgId && !a.Cancelled
                orderby a.CreatedDate descending
                select new RecentAssetDto
                {
                    AssetId = a.AssetId,
                    Name = a.Name,
                    Category = category.Name,
                    CategoryId = a.Category,
                    Status = ((AssetStatusEnum)a.AssetStatus!).ToString(),
                    StatusKey = a.AssetStatus != null
                        ? (statusKeyMap.ContainsKey((int)a.AssetStatus) ? statusKeyMap[(int)a.AssetStatus] : "unknown")
                        : "unknown",
                    UnitPrice = a.UnitPrice,
                    SiteDisplay = assetSite.Name,
                    CreatedDate = a.CreatedDate,
                    AssetImageUrl = a.ImageUrl
                }
            ).Take(count).ToListAsync();
        }

        // ─── 11. Recent Users ────────────────────────────────────────────────────
        public async Task<IEnumerable<RecentUserDto>> GetRecentUsersAsync(Guid orgId, int count)
        {
            return await (
                from u in _context.UserProfiles
                join dept in _context.Department on u.Department equals dept.Id into deptGroup
                from department in deptGroup.DefaultIfEmpty()
                join des in _context.Designation on u.Designation equals des.Id into desGroup
                from designation in desGroup.DefaultIfEmpty()
                join role in _context.ManageUserRoles on u.RoleId equals role.Id into roleGroup
                from manageRole in roleGroup.DefaultIfEmpty()
                where u.OrganizationId == orgId && !u.Cancelled && u.CreatedBy != "Admin"
                orderby u.CreatedDate descending
                select new RecentUserDto
                {
                    UserProfileId = u.UserProfileId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    DepartmentDisplay = department.Name,
                    DesignationDisplay = designation.Name,
                    RoleIdDisplay = manageRole.Name,
                    ProfilePicture = u.ProfilePicture,
                    JoiningDate = u.JoiningDate
                }
            ).Take(count).ToListAsync();
        }

        // ─── 12. Pending Approval Alerts ─────────────────────────────────────────
        public async Task<IEnumerable<PendingApprovalAlertDto>> GetPendingApprovalAlertsAsync(Guid orgId)
        {
            return await (
                from aa in _context.AssetAssigned
                join a in _context.Asset on aa.AssetId equals a.Id

                join reqUser in _context.UserProfiles
                    on new { Email = aa.CreatedBy, OrgId = orgId }
                    equals new { Email = reqUser.Email, OrgId = reqUser.OrganizationId }
                    into reqUserGroup
                from requestedUser in reqUserGroup.DefaultIfEmpty()

                join assUser in _context.UserProfiles on aa.UserId equals assUser.UserProfileId into assUserGroup
                from assignUser in assUserGroup.DefaultIfEmpty()

                join site in _context.AssetSite on aa.SiteId equals site.Id into siteGroup
                from assetSite in siteGroup.DefaultIfEmpty()

                where aa.OrganizationId == orgId
                      && !aa.Cancelled
                      && aa.ApprovalStatus == (int)TransferApprovalStatus.Pending
                      && aa.Status == AssetEnums.AssetAssignedStatus.Hold
                orderby aa.CreatedDate descending
                select new PendingApprovalAlertDto
                {
                    AssignmentId = aa.Id,
                    AssetId = a.AssetId,
                    AssetName = a.Name,
                    RequestedByEmail = aa.CreatedBy,
                    RequestedByName = requestedUser != null
                        ? $"{requestedUser.FirstName} {requestedUser.LastName}".Trim()
                        : aa.CreatedBy,
                    RequestedByProfilePicture = requestedUser != null ? requestedUser.ProfilePicture : null,
                    RequestedDate = aa.CreatedDate,
                    AssignUserName = assignUser != null
                        ? $"{assignUser.FirstName} {assignUser.LastName}".Trim()
                        : null,
                    SiteName = assetSite != null ? assetSite.Name : null,
                    AssetImageUrl = a.ImageUrl,
                    AssetType = ((AssetType)aa.AssetType!).ToString()
                }
            ).ToListAsync();
        }

        // ─── 13. Open Issues Alerts ──────────────────────────────────────────────
        public async Task<IEnumerable<OpenIssueAlertDto>> GetOpenIssueAlertsAsync(Guid orgId)
        {
            var statusMap = new Dictionary<int, (string Key, string Label)>
            {
                { (int)AssetIssueStatus.New,        ("new",        "New")         },
                { (int)AssetIssueStatus.InProgress, ("inprogress", "In Progress") },
                { (int)AssetIssueStatus.Pending,    ("pending",    "Pending")     },
                { (int)AssetIssueStatus.Blocker,    ("blocker",    "Blocker")     },
                { (int)AssetIssueStatus.Hold,       ("hold",       "Hold")        },
                { (int)AssetIssueStatus.Accepted,   ("accepted",   "Accepted")    }
            };

            return await (
                from i in _context.AssetIssue
                join a in _context.Asset on i.AssetId equals a.Id into assetGroup
                from asset in assetGroup.DefaultIfEmpty()
                where i.OrganizationId == orgId
                      && !i.Cancelled
                      && i.Status != AssetIssueStatus.Closed
                      && i.Status != AssetIssueStatus.Resolved
                orderby i.CreatedDate descending
                select new OpenIssueAlertDto
                {
                    IssueId = i.Id,
                    Title = i.IssueTitle,
                    Description = i.IssueDescription,
                    AssetId = asset != null ? asset.AssetId : null,
                    AssetName = asset != null ? asset.Name : null,
                    StatusKey = statusMap.ContainsKey((int)i.Status!.Value) ? statusMap[(int)i.Status].Key : "unknown",
                    StatusDisplay = statusMap.ContainsKey((int)i.Status) ? statusMap[(int)i.Status].Label : "Unknown",
                    CreatedDate = i.CreatedDate,
                    CreatedBy = i.CreatedBy
                }
            ).ToListAsync();
        }

        // ─── 14. Warranty Expiring ───────────────────────────────────────────────
        public async Task<IEnumerable<WarrantyExpiringDto>> GetWarrantyExpiringAsync(Guid orgId, int days)
        {
            var today = DateTime.Today;
            var limitDate = today.AddDays(days);

            return await (
                from a in _context.Asset
                join site in _context.AssetSite on a.SiteId equals site.Id into siteGroup
                from assetSite in siteGroup.DefaultIfEmpty()
                where a.OrganizationId == orgId
                      && !a.Cancelled
                      && a.DateOfPurchase.HasValue
                      && a.WarranetyInMonth.HasValue
                select new WarrantyExpiringDto
                {
                    AssetId = a.Id,
                    AssetCode = a.AssetId,
                    Name = a.Name,
                    WarrantyExpiryDate = a.DateOfPurchase!.Value.AddMonths(a.WarranetyInMonth!.Value),
                    DaysLeft = (int)(a.DateOfPurchase.Value.AddMonths(a.WarranetyInMonth.Value) - today).TotalDays,
                    SiteDisplay = assetSite != null ? assetSite.Name : null
                }
            )
            .Where(x => x.WarrantyExpiryDate >= today && x.WarrantyExpiryDate <= limitDate)
            .OrderBy(x => x.WarrantyExpiryDate)
            .ToListAsync();
        }

        // ─── Private Helpers ─────────────────────────────────────────────────────
        private static List<object> GetMonthlySparkline(List<DateTime> dates, int months)
        {
            var start = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1).AddMonths(-months + 1);
            var result = new List<object>();

            for (int i = 0; i < months; i++)
            {
                var month = start.AddMonths(i);
                var count = dates.Count(d => d.Year == month.Year && d.Month == month.Month);
                result.Add(count);
            }

            // Build cumulative counts for a running-total sparkline
            var running = new List<object>();
            int total = 0;
            foreach (var item in result)
            {
                total += (int)item;
                running.Add(total);
            }

            return running;
        }

        private static List<object> GetMonthlyValueSparkline(List<(DateTime Date, decimal Value)> items, int months)
        {
            var start = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1).AddMonths(-months + 1);
            var result = new List<object>();
            decimal running = 0;

            for (int i = 0; i < months; i++)
            {
                var month = start.AddMonths(i);
                var sum = items.Where(x => x.Date.Year == month.Year && x.Date.Month == month.Month).Sum(x => x.Value);
                running += sum;
                result.Add(running);
            }

            return result;
        }
    }
}
