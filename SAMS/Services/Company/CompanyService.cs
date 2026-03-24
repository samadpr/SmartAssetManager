using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SAMS.API.CompanyAPIs.RequestObject;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Company.DTOs;
using SAMS.Services.Company.Interface;
using SAMS.Services.Departments;
using SAMS.Services.Profile.Interface;

namespace SAMS.Services.Company
{
    public class CompanyService : ICompanyService
    {
        private readonly IMapper _mapper;
        private readonly ILogger<CompanyService> _logger;
        private readonly ICompanyRepository _companyRepository;
        private readonly IUserProfileService _userProfileService;
        private readonly ApplicationDbContext _context;

        public CompanyService(IMapper mapper, ILogger<CompanyService> logger, ICompanyRepository companyRepository, IUserProfileService userProfileService, ApplicationDbContext context)
        {
            _mapper = mapper;
            _logger = logger;
            _companyRepository = companyRepository;
            _userProfileService = userProfileService;
            _context = context;
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


        public async Task<(bool isSuccess, string message, List<CompanyWithUserInfoDto>? data)> GetAllCompaniesWithUser(string user)
        {
            try
            {
                var response = _companyRepository.GetAllCompaniesWithUser(user);
                return (response.Result.success, response.Result.message, response.Result.company);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting all companies with user.");
                return (false, "Error occurred while getting all companies with user.", null);
            }
        }

        public async Task<(bool isSuccess, string message)> UpdateCompanyWithSubscriptionAsync(CompanyRequestObjectWithSubscription companyInfo, string user)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                SubscriptionPlan? subscription = null;
                
                var currentCompany = await _companyRepository.GetCompaniesByIdAsync(companyInfo.Id);
                if (currentCompany.company == null)
                    return (false, "No companies found.");

                if (companyInfo.Subscription != null && companyInfo.Subscription.AssetCount > 0 && companyInfo.Subscription.SystemUserCount > 0 && companyInfo.Subscription.TotalUserCount > 0)
                {
                    if(currentCompany.company.SubscriptionId != null)
                    {
                        subscription = await _context.SubscriptionPlans.FirstOrDefaultAsync(x => x.Id == currentCompany.company.SubscriptionId);
                        if (subscription != null)
                        {
                            subscription.Name = companyInfo.Name + " Subscription Plan";
                            subscription.AssetLimit = companyInfo.Subscription.AssetCount ?? 0;
                            subscription.SystemUserLimit = companyInfo.Subscription.SystemUserCount ?? 0;
                            subscription.TotalUserLimit = companyInfo.Subscription.TotalUserCount ?? 0;
                            subscription.ModifiedBy = user;
                            subscription.ModifiedDate = DateTime.UtcNow;
                            _context.SubscriptionPlans.Update(subscription);
                            await _context.SaveChangesAsync();
                        }
                    }
                    else
                    {
                        subscription = new SubscriptionPlan
                        {
                            Name = companyInfo.Name + " Subscription Plan",
                            AssetLimit = companyInfo.Subscription.AssetCount ?? 0,
                            SystemUserLimit = companyInfo.Subscription.SystemUserCount ?? 0,
                            TotalUserLimit = companyInfo.Subscription.TotalUserCount ?? 0,
                            CreatedBy = user,
                            CreatedDate = DateTime.UtcNow,
                            ModifiedBy = user,
                            ModifiedDate = DateTime.UtcNow
                        };
                        await _context.SubscriptionPlans.AddAsync(subscription);
                        await _context.SaveChangesAsync();
                    }
                }


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

                if(subscription != null)
                {
                    existingCompany.SubscriptionId = subscription.Id;
                }

                var response = await _companyRepository.UpdateCompanyAsync(existingCompany);

                await transaction.CommitAsync();

                return response;
            }
            catch(Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error occurred while updating company with subscription.");
                return (false, "Error occurred while updating company with subscription.");
            }
        }
    }
}
