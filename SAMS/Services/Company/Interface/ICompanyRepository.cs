using SAMS.Models;

namespace SAMS.Services.Company.Interface
{
    public interface ICompanyRepository
    {
        Task <(bool, string)> AddCompanyAsync(CompanyInfo companyInfo);
        Task <(bool, string)> UpdateCompanyAsync(CompanyInfo companyInfo);
        Task <(bool success, string message, CompanyInfo company)> GetCompaniesAsync(Guid? OrganizationId);
        Task <(bool success, string message, CompanyInfo? company)> GetCompanyByIdAndOrganizationAsync(Guid? CompanyId, long id);
        Task <(bool success, string message, CompanyInfo? company)> GetCompaniesByIdAsync(long id);
    }
}
