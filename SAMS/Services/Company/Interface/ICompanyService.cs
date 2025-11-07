using SAMS.Models;

namespace SAMS.Services.Company.Interface
{
    public interface ICompanyService
    {
        Task<(bool isSuccess, string message)> AddCompanyAsync(CompanyInfo companyInfo, string user);
        Task<(bool isSuccess, string message)> UpdateCompanyAsync(CompanyInfo companyInfo, string user);
        Task<(bool isSuccess, string message, CompanyInfo data)> GetCompaniesAsync(string user);
        Task<(bool isSuccess, string message)> DeleteCompanyAsync(long id, string user);
        Task<(bool isSuccess, string message, CompanyInfo? data)> GetCompanyByIdAsync(long id, string user);
    }
}
