using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Company.DTOs;
using SAMS.Services.Company.Interface;

namespace SAMS.Services.Company
{
    public class CompanyRepository : ICompanyRepository
    {
        private readonly ApplicationDbContext _context;

        public CompanyRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<(bool, string)> AddCompanyAsync(CompanyInfo companyInfo)
        {
            try
            {

                // Only check for duplicates if Email is provided (non-null and not empty)
                if (!string.IsNullOrWhiteSpace(companyInfo.Email))
                {
                    bool emailExists = await _context.CompanyInfo.AnyAsync(c => c.Email != null && c.Email.ToLower() == companyInfo.Email.ToLower() && !c.Cancelled);

                    if (emailExists)
                    {
                        return (false, "Company with the same email already exists");
                    }
                }
                _context.CompanyInfo.Add(companyInfo);
                await _context.SaveChangesAsync();
                return (true, "Company added successfully");
            }
            catch(Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public async Task<(bool success, string message, CompanyInfo? company)> GetCompanyByIdAndOrganizationAsync(Guid? OrganizationId, long id)
        {
            try
            {
                var companyById = await _context.CompanyInfo.Where(c => c.OrganizationId == OrganizationId && c.Id == id && !c.Cancelled).FirstOrDefaultAsync();
                if (companyById == null)
                    return (false, "Company not found", null!);
                return (true, "Company found successfully", companyById);
            }
            catch(Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public async Task<(bool, string, CompanyInfo)> GetCompaniesAsync(Guid? OrganizationId)
        {
            try
            {
                var company = await _context.CompanyInfo.FirstOrDefaultAsync(c => c.OrganizationId == OrganizationId && !c.Cancelled);
                if (company == null)
                    return (false, "No companies found", null!);
                return (true, "Companies found successfully", company);
            }
            catch(Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public Task<(bool isSuccess, string message)> UpdateCompanyAsync(CompanyInfo companyInfo)
        {
            try
            {
                _context.CompanyInfo.Update(companyInfo);
                _context.SaveChanges();
                return Task.FromResult((true, "Company updated successfully"));
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public async Task<(bool success, string message, CompanyInfo? company)> GetCompaniesByIdAsync(long id)
        {
            try
            {
                var company = await _context.CompanyInfo.FirstOrDefaultAsync(c => c.Id == id && !c.Cancelled);
                if (company == null)
                    return (false, "No companies found", null!);
                return (true, "Companies found successfully", company);
            }
            catch(Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public async Task<(bool success, string message, List<CompanyWithUserInfoDto>? company)> GetAllCompaniesWithUser(string user)
        {
            try
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
                
                    where !company.Cancelled && u.CreatedBy == "Admin"
                
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
                ).ToListAsync();


                if (!response.Any())
                    return (false, "No companies found", null);

                return (true, "Companies fetched successfully", response);
            }
            catch(Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }
    }
}
