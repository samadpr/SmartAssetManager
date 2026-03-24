using SAMS.Models;
using SAMS.Services.Company.DTOs;

namespace SAMS.Services.Company.Interface
{
    public interface ICompanyRepository
    {
        Task <(bool, string)> AddCompanyAsync(CompanyInfo companyInfo);
        Task <(bool isSuccess, string message)> UpdateCompanyAsync(CompanyInfo companyInfo);
        Task <(bool success, string message, CompanyInfo company)> GetCompaniesAsync(Guid? OrganizationId);
        Task <(bool success, string message, CompanyInfo? company)> GetCompanyByIdAndOrganizationAsync(Guid? CompanyId, long id);
        Task <(bool success, string message, CompanyInfo? company)> GetCompaniesByIdAsync(long id);
        Task <(bool success, string message, List<CompanyWithUserInfoDto>? company)> GetAllCompaniesWithUser(string user);
    }
}
