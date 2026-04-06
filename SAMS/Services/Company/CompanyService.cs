using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SAMS.API.CompanyAPIs.RequestObject;
using SAMS.Data;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.Company.DTOs;
using SAMS.Services.Company.Interface;
using SAMS.Services.Departments;
using SAMS.Services.Profile.Interface;
using System.Globalization;

namespace SAMS.Services.Company
{
    public class CompanyService : ICompanyService
    {
        private readonly IMapper _mapper;
        private readonly ILogger<CompanyService> _logger;
        private readonly ICompanyRepository _companyRepository;
        private readonly IUserProfileService _userProfileService;
        private readonly ApplicationDbContext _context;
        private readonly FileUploadHelper _fileUploadHelper;

        public CompanyService(IMapper mapper, ILogger<CompanyService> logger, ICompanyRepository companyRepository, IUserProfileService userProfileService, ApplicationDbContext context, FileUploadHelper fileUploadHelper)
        {
            _mapper = mapper;
            _logger = logger;
            _companyRepository = companyRepository;
            _userProfileService = userProfileService;
            _context = context;
            _fileUploadHelper = fileUploadHelper;
        }
        public async Task<(bool isSuccess, string message)> AddCompanyAsync(CompanyRequestObject companyRequestInfo, string user)
        {
            try
            {

                var company = new CompanyInfo
                {
                    OrganizationId = companyRequestInfo.OrganizationId ?? Guid.NewGuid(),
                    IndustriesId = companyRequestInfo.IndustriesId,
                    Name = companyRequestInfo.Name,
                    Currency = companyRequestInfo.Currency,
                    Address = companyRequestInfo.Address,
                    City = companyRequestInfo.City,
                    Country = companyRequestInfo.Country,
                    Phone = companyRequestInfo.Phone,
                    Email = companyRequestInfo.Email,
                    Fax = companyRequestInfo.Fax,
                    Website = companyRequestInfo.Website,
                    CreatedBy = user,
                    CreatedDate = DateTime.UtcNow,
                    ModifiedBy = user,
                    ModifiedDate = DateTime.UtcNow,
                };


                string logoPath = null;

                if (companyRequestInfo.Logo != null)
                {
                    var file = companyRequestInfo.Logo;

                    var (success, path, message) =
                        await _fileUploadHelper.UploadFileAsync(
                            file,
                            $"{company.OrganizationId}/TradeLicense",
                            FileUploadHelper.GetAllowedExtensions("image"),
                            5 * 1024 * 1024 // Optional: 5MB limit
                        );

                    logoPath = path;
                }

                company.Logo = logoPath;

                //companyRequestInfo.CreatedBy = user;
                //companyRequestInfo.ModifiedBy = user;
                //companyRequestInfo.CreatedDate = DateTime.UtcNow;
                //companyRequestInfo.ModifiedDate = DateTime.UtcNow;

                return await _companyRepository.AddCompanyAsync(company);

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

        public async Task<(bool isSuccess, string message)> UpdateCompanyAsync(CompanyRequestObject companyRequestInfo, string user)
        {
            try
            {
                var currentCompany = await _companyRepository.GetCompaniesByIdAsync(companyRequestInfo.Id);
                if (currentCompany.company == null)
                    return (false, "No companies found.");

                // Update only the fields you want to allow changes for
                var existingCompany = currentCompany.company;

                string? logoPath = existingCompany.Logo;
                if (companyRequestInfo.Logo != null)
                {
                    var (success, path, _) =
                        await _fileUploadHelper.UploadFileAsync(
                            companyRequestInfo.Logo,
                            $"{existingCompany.OrganizationId}/CompanyLogo",
                            FileUploadHelper.GetAllowedExtensions("image"));

                    if (success)
                        logoPath = path;
                }


                existingCompany.IndustriesId = companyRequestInfo.IndustriesId;
                existingCompany.Name = companyRequestInfo.Name;
                existingCompany.Logo = logoPath;
                existingCompany.Currency = companyRequestInfo.Currency;
                existingCompany.Address = companyRequestInfo.Address;
                existingCompany.City = companyRequestInfo.City;
                existingCompany.Country = companyRequestInfo.Country;
                existingCompany.Phone = companyRequestInfo.Phone;
                existingCompany.Email = companyRequestInfo.Email;
                existingCompany.Fax = companyRequestInfo.Fax;
                existingCompany.Website = companyRequestInfo.Website;
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

                string? logoPath = existingCompany.Logo;
                if (companyInfo.Logo != null)
                {
                    var (success, path, _) =
                        await _fileUploadHelper.UploadFileAsync(
                            companyInfo.Logo,
                            $"{existingCompany.OrganizationId}/CompanyLogo",
                            FileUploadHelper.GetAllowedExtensions("image"));

                    if (success)
                        logoPath = path;
                }

                existingCompany.IndustriesId = companyInfo.IndustriesId;
                existingCompany.Name = companyInfo.Name;
                existingCompany.Logo = logoPath;
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
