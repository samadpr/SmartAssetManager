using SAMS.Services.Admin.CompaniesInformation.DTOs;
using SAMS.Services.Company.DTOs;

namespace SAMS.Services.Admin.CompaniesInformation.Interface
{
    public interface ICompaniesInformationService
    {
        Task<(bool success, string message, CompanyDetailDto? data)> GetCompanyDetailAsync(long companyId, string? orgId);

        Task<(bool success, string message, CompanyStatsDto? data)> GetCompanyStatsAsync(long companyId, string? orgId);

        Task<(bool success, string message, List<LoginAccessUserDto> data)> GetCompanyLoginUsersAsync(long companyId, string? orgId);

        Task<(bool success, string message)> ToggleActiveAsync(ToggleActiveRequestDto request);
        Task<(bool success, string message, CompanyWithUserInfoDto? data)> GetByIdAsync(long id);
    }
}
