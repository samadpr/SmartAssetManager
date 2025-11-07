using AutoMapper;
using SAMS.Models;
using SAMS.Services.Company.Interface;
using SAMS.Services.Departments;
using SAMS.Services.Profile.Interface;

namespace SAMS.Services.Company
{
    public class CompanyService : ICompanyService
    {
        private readonly IMapper _mapper;
        private readonly ILogger<DepartmentService> _logger;
        private readonly ICompanyRepository _companyRepository;
        private readonly IUserProfileService _userProfileService;

        public CompanyService(IMapper mapper, ILogger<DepartmentService> logger, ICompanyRepository companyRepository, IUserProfileService userProfileService)
        {
            _mapper = mapper;
            _logger = logger;
            _companyRepository = companyRepository;
            _userProfileService = userProfileService;
        }
        public async Task<(bool isSuccess, string message)> AddCompanyAsync(CompanyInfo companyInfo, string user)
        {
            try
            {
                companyInfo.CreatedBy = user;
                companyInfo.ModifiedBy = user;
                companyInfo.CreatedDate = DateTime.UtcNow;
                companyInfo.ModifiedDate = DateTime.UtcNow;

                return await _companyRepository.AddCompanyAsync(companyInfo);

            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error occurred while adding company.");
                return (false, "Error occurred while adding company.");
            }
        }

        public async Task<(bool isSuccess, string message)> DeleteCompanyAsync(long id, string user)
        {
            try
            {
                var userProfile = await _userProfileService.GetProfileData(user);
                if(userProfile == null || userProfile.OrganizationId == null)
                    return (false, "User profile not found. No companies found.");

                var company = await _companyRepository.GetCompanyByIdAndOrganizationAsync(userProfile.OrganizationId, id);
                if (company.company == null)
                    return (false, "No companies found.");

                company.company.Cancelled = true;
                company.company.ModifiedBy = user;
                company.company.ModifiedDate = DateTime.UtcNow;

                return await _companyRepository.UpdateCompanyAsync(company.company);

            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting company.");
                return (false, "Error occurred while deleting company.");
            }
        }

        public async Task<(bool isSuccess, string message, CompanyInfo? data)> GetCompaniesAsync(string user)
        {
            try
            {
                var userProfile = await _userProfileService.GetProfileData(user);
                if(userProfile == null || userProfile.OrganizationId == null)
                    return (false, "User profile not found. No companies found.", null);

                var company = await _companyRepository.GetCompaniesAsync(userProfile.OrganizationId);
                if (company.company == null)
                    return (false, "No companies found.", null);

                return (true, company.message, company.company);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting companies.");
                return (false, "Error occurred while getting companies.", null);
            }
        }

        public async Task<(bool isSuccess, string message, CompanyInfo? data)> GetCompanyByIdAsync(long id, string user)
        {
            try
            {
                var company = await _companyRepository.GetCompaniesByIdAsync(id);
                if (company.company == null)
                    return (false, "No companies found.", null);

                return (true, company.message, company.company);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting company by id.");
                return (false, "Error occurred while getting company by id.", null);
            }
        }

        public async Task<(bool isSuccess, string message)> UpdateCompanyAsync(CompanyInfo companyInfo, string user)
        {
            try
            {
                var currentCompany = await _companyRepository.GetCompaniesByIdAsync(companyInfo.Id);
                if (currentCompany.company == null)
                    return (false, "No companies found.");

                // Update only the fields you want to allow changes for
                var existingCompany = currentCompany.company;

                existingCompany.IndustriesId = companyInfo.IndustriesId;
                existingCompany.Name = companyInfo.Name;
                existingCompany.Logo = companyInfo.Logo;
                existingCompany.Currency = companyInfo.Currency;
                existingCompany.Address = companyInfo.Address;
                existingCompany.City = companyInfo.City;
                existingCompany.Country = companyInfo.Country;
                existingCompany.Phone = companyInfo.Phone;
                existingCompany.Email = companyInfo.Email;
                existingCompany.Fax = companyInfo.Fax;
                existingCompany.Website = companyInfo.Website;
                existingCompany.CreatedBy = existingCompany.CreatedBy;
                existingCompany.CreatedDate = existingCompany.CreatedDate;
                existingCompany.ModifiedBy = user;
                existingCompany.ModifiedDate = DateTime.UtcNow;

                return await _companyRepository.UpdateCompanyAsync(existingCompany);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating company.");
                return (false, "Error occurred while updating company.");
            }
        }
    }
}
