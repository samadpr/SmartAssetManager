using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Pipelines.Sockets.Unofficial.Arenas;
using SAMS.Data;
using SAMS.Helpers.Enum;
using SAMS.Models;
using SAMS.Services.Admin.CompaniesInformation.DTOs;
using SAMS.Services.Admin.CompaniesInformation.Interface;
using SAMS.Services.Company.DTOs;
using StackExchange.Redis;

namespace SAMS.Services.Admin.CompaniesInformation
{
    public class CompaniesInformationRepository : ICompaniesInformationRepository
    {
        private readonly ApplicationDbContext _context;

        public CompaniesInformationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // ── helpers ───────────────────────────────────────────────────────────

        /// <summary>
        /// Returns the resolved Guid orgId.
        /// If orgId string is supplied and valid, it is parsed directly (skips JOIN).
        /// Otherwise it is resolved from companyId.
        /// Returns Guid.Empty when the company is not found.
        /// </summary>
        private async Task<Guid> ResolveOrgIdAsync(long companyId, string? orgId)
        {
            if (!string.IsNullOrWhiteSpace(orgId) && Guid.TryParse(orgId, out var parsed))
                return parsed;

            // Bypass global tenant filter so SuperAdmin can read any company
            var id = await _context.CompanyInfo
                .IgnoreQueryFilters()
                .Where(c => c.Id == companyId)
                .Select(c => c.OrganizationId)
                .FirstOrDefaultAsync();

            return id;
        }

        // ─────────────────────────────────────────────────────────────────────
        // 1. GetCompanyDetailAsync
        // ─────────────────────────────────────────────────────────────────────
        public async Task<CompanyDetailDto?> GetCompanyDetailAsync(long companyId, string? orgId)
        {
            var resolvedOrgId = await ResolveOrgIdAsync(companyId, orgId);
            if (resolvedOrgId == Guid.Empty) return null;

            // ── Company + Industry + Subscription Plan ────────────────────────
            var company = await _context.CompanyInfo
                .IgnoreQueryFilters()
                .Include(c => c.Industry)
                .Include(c => c.SubscriptionPlan)
                .FirstOrDefaultAsync(c => c.OrganizationId == resolvedOrgId);

            if (company == null) return null;

            // ── Admin User (role = "Admin", first match) ──────────────────────
            var adminUser = await _context.UserProfiles
                .IgnoreQueryFilters()
                .Include(u => u.DesignationNavigation)
                .Include(u => u.DepartmentNavigation)
                .Include(u => u.SubDepartmentNavigation)
                .Include(u => u.SiteNavigation)
                .Include(u => u.AreaNavigation)
                .Include(u => u.Role)
                .Where(u => u.OrganizationId == resolvedOrgId
                         && u.Role != null && u.CreatedBy == "Admin")
                .Select(u => new AdminUserDetailDto
                {
                    UserProfileId = u.UserProfileId,
                    ApplicationUserId = u.ApplicationUserId,
                    EmployeeId = u.UserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    DateOfBirth = u.DateOfBirth,
                    Address = u.Address,
                    Country = u.Country,
                    ProfilePicture = u.ProfilePicture,
                    IsEmailConfirmed = _context.ApplicationUsers
                                            .Where(a => a.Id == u.ApplicationUserId)
                                            .Select(a => a.EmailConfirmed)
                                            .FirstOrDefault(),
                    RoleName = u.Role != null ? u.Role.Name : null,
                    DesignationName = u.DesignationNavigation != null ? u.DesignationNavigation.Name : null,
                    DepartmentName = u.DepartmentNavigation != null ? u.DepartmentNavigation.Name : null,
                    SubDepartmentName = u.SubDepartmentNavigation != null ? u.SubDepartmentNavigation.Name : null,
                    SiteName = u.SiteNavigation != null ? u.SiteNavigation.Name : null,
                    AreaName = u.AreaNavigation != null ? u.AreaNavigation.Name : null,
                    JoiningDate = u.JoiningDate,
                    IsApprover = u.IsApprover == 1
                })
                .FirstOrDefaultAsync();

            // ── Stats ─────────────────────────────────────────────────────────
            var stats = await BuildStatsAsync(resolvedOrgId);

            // ── Login Access Users ────────────────────────────────────────────
            var loginUsers = await BuildLoginUsersAsync(resolvedOrgId);

            // ── Subscription DTO ──────────────────────────────────────────────
            SubscriptionDetailDto? subDto = null;
            if (company.SubscriptionPlan != null && company.SubscriptionDate.HasValue && company.SubscriptionExpiryDate.HasValue)
            {
                var daysRemaining = (int)(company.SubscriptionExpiryDate.Value - DateTime.UtcNow).TotalDays;
                subDto = new SubscriptionDetailDto
                {
                    SubscriptionId = company.SubscriptionPlan.Id,
                    PlanName = company.SubscriptionPlan.Name ?? string.Empty,
                    PlanAmount = company.SubscriptionPlan.PlanAmount,
                    DurationDays = company.SubscriptionPlan.DurationDays,
                    StartDate = company.SubscriptionDate.Value,
                    EndDate = company.SubscriptionExpiryDate.Value,
                    IsActive = company.IsActive,
                    DaysRemaining = daysRemaining < 0 ? 0 : daysRemaining,
                    AssetLimit = company.SubscriptionPlan.AssetLimit,
                    TotalUserLimit = company.SubscriptionPlan.TotalUserLimit,
                    SystemUserLimit = company.SubscriptionPlan.SystemUserLimit,
                };
            }

            return new CompanyDetailDto
            {
                Company = new CompanyFullInfoDto
                {
                    Id = company.Id,
                    OrganizationId = company.OrganizationId.ToString(),
                    Name = company.Name,
                    Logo = company.Logo,
                    Email = company.Email,
                    Phone = company.Phone,
                    Fax = company.Fax,
                    Website = company.Website,
                    Address = company.Address,
                    City = company.City,
                    Country = company.Country,
                    Currency = company.Currency,
                    IndustriesId = company.IndustriesId,
                    IndustryName = company.Industry?.Name,
                    SubscriptionId = company.SubscriptionId,
                    SubscriptionDate = company.SubscriptionDate,
                    SubscriptionExpiryDate = company.SubscriptionExpiryDate,
                    CreatedDate = company.CreatedDate,
                    IsActive = company.IsActive
                },
                AdminUser = adminUser,
                Subscription = subDto,
                Stats = stats,
                LoginAccessUsers = loginUsers
            };
        }

        // ─────────────────────────────────────────────────────────────────────
        // 2. GetCompanyStatsAsync
        // ─────────────────────────────────────────────────────────────────────
        public async Task<CompanyStatsDto?> GetCompanyStatsAsync(long companyId, string? orgId)
        {
            var resolvedOrgId = await ResolveOrgIdAsync(companyId, orgId);
            if (resolvedOrgId == Guid.Empty) return null;

            return await BuildStatsAsync(resolvedOrgId);
        }

        // ─────────────────────────────────────────────────────────────────────
        // 3. GetCompanyLoginUsersAsync
        // ─────────────────────────────────────────────────────────────────────
        public async Task<List<LoginAccessUserDto>> GetCompanyLoginUsersAsync(long companyId, string? orgId)
        {
            var resolvedOrgId = await ResolveOrgIdAsync(companyId, orgId);
            if (resolvedOrgId == Guid.Empty) return new List<LoginAccessUserDto>();

            return await BuildLoginUsersAsync(resolvedOrgId);
        }

        // ─────────────────────────────────────────────────────────────────────
        // 4. ToggleActiveAsync
        // ─────────────────────────────────────────────────────────────────────
        public async Task<(bool found, bool activated)> ToggleActiveAsync(long companyId, bool isActive)
        {
            var company = await _context.CompanyInfo
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.Id == companyId);

            if (company == null) return (false, false);

            // Guard: do not activate if no subscription plan assigned
            if (isActive && company.SubscriptionId == null)
                throw new InvalidOperationException("Assign a subscription plan before activating the company.");

            company.IsActive = isActive;
            await _context.SaveChangesAsync();

            return (true, isActive);
        }

        // ─────────────────────────────────────────────────────────────────────
        // 5. GetByIdAsync — single company refresh for the companies list
        // ─────────────────────────────────────────────────────────────────────
        public async Task<CompanyWithUserInfoDto?> GetByIdAsync(long id)
        {
            var response = await (
                from company in _context.CompanyInfo.AsNoTracking()

                join userProfile in _context.UserProfiles
                    on company.OrganizationId equals userProfile.OrganizationId into userGroup
                from u in userGroup.DefaultIfEmpty()

                join subscription in _context.SubscriptionPlans
                    on company.SubscriptionId equals subscription.Id into subGroup
                from sub in subGroup.DefaultIfEmpty()

                join dept in _context.Department
                    on u.Department equals dept.Id into deptGroup
                from department in deptGroup.DefaultIfEmpty()

                join des in _context.Designation
                    on u.Designation equals des.Id into desGroup
                from designation in desGroup.DefaultIfEmpty()

                join subDept in _context.SubDepartment
                    on u.SubDepartment equals subDept.Id into subDeptGroup
                from subDepartment in subDeptGroup.DefaultIfEmpty()

                join siteTbl in _context.AssetSite
                    on u.Site equals siteTbl.Id into siteGroup
                from site in siteGroup.DefaultIfEmpty()

                join areaTbl in _context.AssetArea
                    on u.Area equals areaTbl.Id into areaGroup
                from area in areaGroup.DefaultIfEmpty()

                join roleTbl in _context.ManageUserRoles
                    on u.RoleId equals roleTbl.Id into roleGroup
                from role in roleGroup.DefaultIfEmpty()

                join aspNetUser in _context.Users
                    on u.Email equals aspNetUser.Email into aspNetUserGroup
                from objAspNetUser in aspNetUserGroup.DefaultIfEmpty()

                where company.Id == id && !company.Cancelled && u.CreatedBy == "Admin"

                select new CompanyWithUserInfoDto
                {
                    Id = company.Id,
                    OrganizationId = company.OrganizationId,
                    IndustriesId = company.IndustriesId,
                    Name = company.Name,
                    Logo = company.Logo,
                    Currency = company.Currency,
                    Address = company.Address,
                    City = company.City,
                    Country = company.Country,
                    Phone = company.Phone,
                    Email = company.Email,
                    Fax = company.Fax,
                    Website = company.Website,

                    SubscriptionId = company.SubscriptionId,
                    SubscriptionDate = company.SubscriptionDate,
                    SubscriptionExpiryDate = company.SubscriptionExpiryDate,
                    IsActive = company.IsActive,

                    SubscriptionPlan = sub,

                    CreatedBy = company.CreatedBy,
                    CreatedDate = company.CreatedDate,
                    ModifiedBy = company.ModifiedBy,
                    ModifiedDate = company.ModifiedDate,
                    Cancelled = company.Cancelled,

                    UserInfo = u == null ? null : new UserProfileInfo
                    {
                        UserProfileId = u.UserProfileId,
                        EmployeeId = u.UserId,
                        ApplicationUserId = u.ApplicationUserId,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        DateOfBirth = u.DateOfBirth,
                        Designation = u.Designation,
                        Department = u.Department,
                        SubDepartment = u.SubDepartment,
                        Site = u.Site,
                        Area = u.Area,
                        RoleId = u.RoleId,

                        DesignationName = designation != null ? designation.Name : null,
                        DepartmentName = department != null ? department.Name : null,
                        SubDepartmentName = subDepartment != null ? subDepartment.Name : null,
                        SiteName = site != null ? site.Name : null,
                        AreaName = area != null ? area.Name : null,
                        RoleName = role != null ? role.Name : null,

                        PhoneNumber = u.PhoneNumber,
                        Email = u.Email,
                        IsEmailConfirmed = objAspNetUser != null ? objAspNetUser.EmailConfirmed : false,
                        Address = u.Address,
                        Country = u.Country,
                        ProfilePicture = u.ProfilePicture,
                        IsApprover = u.IsApprover
                    }
                }
            ).FirstOrDefaultAsync();

            return response;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Private helpers
        // ─────────────────────────────────────────────────────────────────────

        private async Task<CompanyStatsDto> BuildStatsAsync(Guid orgId)
        {
            var totalAssets = await _context.Asset
                .IgnoreQueryFilters()
                .CountAsync(a => a.OrganizationId == orgId);

            var totalUsers = await _context.UserProfiles
                .IgnoreQueryFilters()
                .CountAsync(u => u.OrganizationId == orgId);

            var systemUsers = await _context.UserProfiles
                .IgnoreQueryFilters()
                .CountAsync(u => u.OrganizationId == orgId && u.ApplicationUserId != null);

            var departments = await _context.Department
                .IgnoreQueryFilters()
                .CountAsync(d => d.OrganizationId == orgId);

            var subDepartments = await _context.SubDepartment
                .IgnoreQueryFilters()
                .CountAsync(s => s.OrganizationId == orgId);

            var designations = await _context.Designation
                .IgnoreQueryFilters()
                .CountAsync(d => d.OrganizationId == orgId);

            var roles = await _context.ManageUserRoles
                .IgnoreQueryFilters()
                .CountAsync(r => r.OrganizationId == orgId);

            var sites = await _context.AssetSite
                .IgnoreQueryFilters()
                .CountAsync(s => s.OrganizationId == orgId && s.Type == SiteOrBranch.Site);

            var branches = await _context.AssetSite
                .IgnoreQueryFilters()
                .CountAsync(s => s.OrganizationId == orgId && s.Type == SiteOrBranch.Branch);

            var areas = await _context.AssetArea
                .IgnoreQueryFilters()
                .CountAsync(a => a.OrganizationId == orgId);

            var cities = await _context.AssetCities
                .IgnoreQueryFilters()
                .CountAsync(c => c.OrganizationId == orgId);

            var suppliers = await _context.Suppliers
                .IgnoreQueryFilters()
                .CountAsync(s => s.OrganizationId == orgId);

            var assetCategories = await _context.AssetCategorie
                .IgnoreQueryFilters()
                .CountAsync(c => c.OrganizationId == orgId);

            var assetSubCategories = await _context.AssetSubCategories
                .IgnoreQueryFilters()
                .CountAsync(c => c.OrganizationId == orgId);

            return new CompanyStatsDto
            {
                TotalAssets = totalAssets,
                TotalUsers = totalUsers,
                SystemUsers = systemUsers,
                Departments = departments,
                SubDepartments = subDepartments,
                Designations = designations,
                Roles = roles,
                Sites = sites,
                Branches = branches,
                Areas = areas,
                Cities = cities,
                Suppliers = suppliers,
                AssetCategories = assetCategories,
                AssetSubCategories = assetSubCategories
            };
        }

        private async Task<List<LoginAccessUserDto>> BuildLoginUsersAsync(Guid orgId)
        {
            // Users that have been granted login access (ApplicationUserId is set)
            var users = await _context.UserProfiles
                .IgnoreQueryFilters()
                .Include(u => u.DesignationNavigation)
                .Include(u => u.DepartmentNavigation)
                .Include(u => u.Role)
                .Where(u => u.OrganizationId == orgId && u.ApplicationUserId != null)
                .ToListAsync();

            var appUserIds = users
                .Where(u => u.ApplicationUserId != null)
                .Select(u => u.ApplicationUserId!)
                .Distinct()
                .ToList();

            // Email confirmed flags from AspNetUsers
            var emailConfirmedMap = await _context.ApplicationUsers
                .Where(a => appUserIds.Contains(a.Id))
                .ToDictionaryAsync(a => a.Id, a => a.EmailConfirmed);

            // Login session data from LoginHistory table
            var loginStats = await _context.LoginHistory
                .IgnoreQueryFilters()
                .Where(l => l.OrganizationId == orgId && l.UserName != null && appUserIds.Contains(l.UserName))
                .GroupBy(l => l.UserName!)
                .Select(g => new
                {
                    UserName = g.Key,
                    LastLoginDate = g.OrderByDescending(x => x.LoginTime).Select(x => (DateTime?)x.LoginTime).FirstOrDefault(),
                    LastLogoutDate = g.OrderByDescending(x => x.LogoutTime).Select(x => x.LogoutTime).FirstOrDefault(),
                    TotalLoginCount = g.Count(x => x.Action == "Login" || x.ActionStatus == "Success")
                })
                .ToDictionaryAsync(x => x.UserName);

            return users.Select(u =>
            {
                loginStats.TryGetValue(u.ApplicationUserId ?? string.Empty, out var session);
                emailConfirmedMap.TryGetValue(u.ApplicationUserId ?? string.Empty, out var emailConfirmed);

                return new LoginAccessUserDto
                {
                    UserProfileId = u.UserProfileId,
                    ApplicationUserId = u.ApplicationUserId,
                    EmployeeId = u.UserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    ProfilePicture = u.ProfilePicture,
                    RoleName = u.Role?.Name,
                    DesignationName = u.DesignationNavigation?.Name,
                    DepartmentName = u.DepartmentNavigation?.Name,
                    IsEmailConfirmed = emailConfirmed,
                    IsActive = u.IsAllowLoginAccess ?? false,
                    LastLoginDate = session?.LastLoginDate,
                    LastLogoutDate = session?.LastLogoutDate,
                    TotalLoginCount = session?.TotalLoginCount ?? 0,
                    CreatedDate = u.CreatedDate
                };
            }).ToList();
        }
    }
}
