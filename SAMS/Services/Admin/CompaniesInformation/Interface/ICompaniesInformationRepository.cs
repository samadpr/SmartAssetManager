using SAMS.Services.Admin.CompaniesInformation.DTOs;
using SAMS.Services.Company.DTOs;

namespace SAMS.Services.Admin.CompaniesInformation.Interface
{
    public interface ICompaniesInformationRepository
    {
        /// <summary>
        /// Resolves orgId from companyId if orgId is null/empty, then returns
        /// company, admin user, subscription, stats and login-access users in one go.
        /// </summary>
        Task<CompanyDetailDto?> GetCompanyDetailAsync(long companyId, string? orgId);

        /// <summary>
        /// Lightweight counts-only refresh.
        /// </summary>
        Task<CompanyStatsDto?> GetCompanyStatsAsync(long companyId, string? orgId);

        /// <summary>
        /// Returns all users with login access + session tracking data.
        /// </summary>
        Task<List<LoginAccessUserDto>> GetCompanyLoginUsersAsync(long companyId, string? orgId);

        /// <summary>
        /// Flips IsSubscriptionActive on the Company row.
        /// Returns false when the company is not found.
        /// </summary>
        Task<(bool found, bool activated)> ToggleActiveAsync(long companyId, bool isActive);

        /// <summary>
        /// Returns a single company with its admin user snapshot — used by the
        /// companies list to refresh one card after an assign-subscription save.
        /// </summary>
        Task<CompanyWithUserInfoDto?> GetByIdAsync(long id);
    }
}
