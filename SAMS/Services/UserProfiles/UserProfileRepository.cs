using Microsoft.EntityFrameworkCore;
using SAMS.API.UserProfileAPIs.ResponseObject;
using SAMS.Data;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.Account;
using SAMS.Services.Profile.Interface;
using SAMS.Services.UserProfiles.DTOs;

namespace SAMS.Services.Profile;

public class UserProfileRepository : IUserProfileRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AccountRepository> _logger;
    private readonly ICompanyContext _companyContext;

    public UserProfileRepository(ApplicationDbContext context, ILogger<AccountRepository> logger, ICompanyContext companyContext)
    {
        _context = context;
        _logger = logger;
        _companyContext = companyContext;
    }


    public async Task<UserProfile> GetProfileData(string userEmail)
    {
        var user = await _context.UserProfiles.FirstOrDefaultAsync(u => u.Email == userEmail && !u.Cancelled);
        if (user == null) return null!;
        return user!;
    }

    public async Task<bool> UpdateProfileAsync(UserProfile user)
    {
        _context.UserProfiles.Update(user);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<int> GetCreatedUsersCount(List<string> emails)
    {
        return await _context.UserProfiles.CountAsync(u => emails.Contains(u.CreatedBy) && !u.Cancelled);
    }

    public Task<(bool isSuccess, string message)> CreateUserProfileAsync(UserProfile userProfile)
    {
        try
        {
            _context.UserProfiles.Add(userProfile);
            _context.SaveChanges();
            return Task.FromResult((true, "User profile created successfully."));
        }
        catch (Exception ex)
        {
            return Task.FromResult((false, "Failed to create user profile: " + ex.Message));
        }
    }

    public async Task<IEnumerable<UserProfile>> GetCreatedUsersProfile(List<string> emails)
    {
        return await _context.UserProfiles.AsNoTracking().Where(u => emails.Contains(u.CreatedBy) && !u.Cancelled).OrderByDescending(d => d.CreatedDate).ToListAsync();
    }

    public async Task<(UserProfile user, string message)> GetUserProfileByProfileId(long profileId, List<string> emails)
    {
        var user = await _context.UserProfiles.FirstOrDefaultAsync(u => u.UserProfileId == profileId && emails.Contains(u.CreatedBy) && !u.Cancelled);

        return (user!, user != null ? "User profile found." : "User profile not found.");
    }


    public async Task<(bool success, string message)> UpdateUserProfileAsync(UserProfile user)
    {
        try
        {
            _context.UserProfiles.Update(user);
            await _context.SaveChangesAsync();
            return (true, "User profile updated successfully.");
        }
        catch (Exception ex)
        {
            return (false, "Failed to update user profile: " + ex.Message);
        }

    }

    public async Task<bool> IsEmailExistsAsync(string email, long userProfileId, Guid organizationId)
    {
        return await _context.UserProfiles
            .AnyAsync(u =>
                u.Email == email &&
                u.UserProfileId != userProfileId &&
                u.OrganizationId == organizationId &&
                !u.Cancelled);
    }


    public async Task<(GetProfileDetailsResponseObject responseObject, bool isSuccess, string message)> GetProfileDetails(string userEmail)
    {
        try
        {
            var result = await (from vm in _context.UserProfiles

                                    // Department
                                join _Department in _context.Department on vm.Department equals _Department.Id into _Department
                                from objDepartment in _Department.DefaultIfEmpty()

                                    // SubDepartment
                                join _SubDepartment in _context.SubDepartment on vm.SubDepartment equals _SubDepartment.Id into _SubDepartment
                                from objSubDepartment in _SubDepartment.DefaultIfEmpty()

                                    // Designation
                                join _Designation in _context.Designation on vm.Designation equals _Designation.Id into _Designation
                                from objDesignation in _Designation.DefaultIfEmpty()

                                    // ManageRole
                                join _ManageRole in _context.ManageUserRoles on vm.RoleId equals _ManageRole.Id into _ManageRole
                                from objManageRole in _ManageRole.DefaultIfEmpty()

                                    // AspNetUser
                                join _AspNetUser in _context.Users on vm.Email equals _AspNetUser.Email into _AspNetUser
                                from objAspNetUser in _AspNetUser.DefaultIfEmpty()

                                    // ⭐ NEW — Join AssetSite → SiteDisplay
                                join _Site in _context.AssetSite on vm.Site equals _Site.Id into _Site
                                from objSite in _Site.DefaultIfEmpty()

                                    // ⭐ NEW — Join AssetArea → AreaDisplay
                                join _Area in _context.AssetArea on vm.Area equals _Area.Id into _Area
                                from objArea in _Area.DefaultIfEmpty()

                                where vm.Cancelled == false && vm.Email == userEmail
                                select new GetProfileDetailsResponseObject
                                {
                                    UserProfileId = vm.UserProfileId,
                                    ApplicationUserId = vm.ApplicationUserId,
                                    UserId = vm.UserId,
                                    FirstName = vm.FirstName,
                                    LastName = vm.LastName,
                                    DateOfBirth = vm.DateOfBirth,
                                    Designation = vm.Designation,
                                    DesignationDisplay = objDesignation.Name,
                                    Department = vm.Department,
                                    DepartmentDisplay = objDepartment.Name,
                                    SubDepartment = vm.SubDepartment,
                                    SubDepartmentDisplay = objSubDepartment.Name,
                                    Site = vm.Site,
                                    SiteDisplay = objSite.Name,
                                    Area = vm.Area,
                                    AreaDisplay = objArea.Name,
                                    JoiningDate = vm.JoiningDate,
                                    LeavingDate = vm.LeavingDate,
                                    PhoneNumber = vm.PhoneNumber,
                                    Email = vm.Email,
                                    IsEmailVerified = objAspNetUser != null ? objAspNetUser.EmailConfirmed : false,
                                    Address = vm.Address,
                                    Country = vm.Country,
                                    ProfilePicture = vm.ProfilePicture,
                                    RoleIdDisplay = objManageRole.Name,
                                    RoleId = vm.RoleId,
                                })
                            .FirstOrDefaultAsync();

            if (result == null)
                return (null!, false, "Profile not found.");

            return (result, true, "Profile found.");
        }
        catch (Exception ex)
        {
            return (null!, false, "Error retrieving profile details: " + ex.Message);
        }
    }

    public async Task<(IEnumerable<GetProfileDetailsResponseObject> responseObject, bool isSuccess, string message)> GetCreatedUserProfilesDetails(List<string> emails)
    {
        try
        {
            var result = await (from vm in _context.UserProfiles

                                    // ⭐ Department Join
                                join _Department in _context.Department on vm.Department equals _Department.Id into _Department
                                from objDepartment in _Department.DefaultIfEmpty()

                                    // ⭐ SubDepartment Join
                                join _SubDepartment in _context.SubDepartment on vm.SubDepartment equals _SubDepartment.Id into _SubDepartment
                                from objSubDepartment in _SubDepartment.DefaultIfEmpty()

                                    // ⭐ Designation Join
                                join _Designation in _context.Designation on vm.Designation equals _Designation.Id into _Designation
                                from objDesignation in _Designation.DefaultIfEmpty()

                                    // ⭐ ManageRole Join
                                join _ManageRole in _context.ManageUserRoles on vm.RoleId equals _ManageRole.Id into _ManageRole
                                from objManageRole in _ManageRole.DefaultIfEmpty()

                                    // ⭐ AspNetUser Join
                                join _AspNetUser in _context.Users on vm.Email equals _AspNetUser.Email into _AspNetUser
                                from objAspNetUser in _AspNetUser.DefaultIfEmpty()

                                    // ⭐ AssetSite Join → SiteDisplay
                                join _Site in _context.AssetSite on vm.Site equals _Site.Id into _Site
                                from objSite in _Site.DefaultIfEmpty()

                                    // ⭐ AssetArea Join → AreaDisplay
                                join _Area in _context.AssetArea on vm.Area equals _Area.Id into _Area
                                from objArea in _Area.DefaultIfEmpty()

                                where !vm.Cancelled && emails.Contains(vm.CreatedBy)
                                orderby vm.CreatedDate descending
                                select new GetProfileDetailsResponseObject
                                {
                                    UserProfileId = vm.UserProfileId,
                                    ApplicationUserId = vm.ApplicationUserId,
                                    UserId = vm.UserId,
                                    FirstName = vm.FirstName,
                                    LastName = vm.LastName,
                                    DateOfBirth = vm.DateOfBirth,
                                    Designation = vm.Designation,
                                    DesignationDisplay = objDesignation.Name,
                                    Department = vm.Department,
                                    DepartmentDisplay = objDepartment.Name,
                                    SubDepartment = vm.SubDepartment,
                                    SubDepartmentDisplay = objSubDepartment.Name,
                                    Site = vm.Site,
                                    SiteDisplay = objSite.Name,
                                    Area = vm.Area,
                                    AreaDisplay = objArea.Name,
                                    JoiningDate = vm.JoiningDate,
                                    LeavingDate = vm.LeavingDate,
                                    PhoneNumber = vm.PhoneNumber,
                                    Email = vm.Email,
                                    IsEmailVerified = objAspNetUser != null ? objAspNetUser.EmailConfirmed : false,
                                    Address = vm.Address,
                                    Country = vm.Country,
                                    ProfilePicture = vm.ProfilePicture,
                                    RoleIdDisplay = objManageRole.Name,
                                    RoleId = vm.RoleId,
                                    IsAllowLoginAccess = vm.IsAllowLoginAccess,
                                }).ToListAsync();

            if (!result.Any())
                return (Enumerable.Empty<GetProfileDetailsResponseObject>(), false, "No created user profiles found.");

            return (result, true, "Created user profiles retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while retrieving created user profiles.");
            return (Enumerable.Empty<GetProfileDetailsResponseObject>(), false, $"Error retrieving created user profiles: {ex.Message}");
        }
    }

    public async Task<(UserProfile user, string message)> GetUserProfileByOrganizationId(long userProfileId, Guid organizationId)
    {
        try
        {
            var result = await _context.UserProfiles.FirstOrDefaultAsync(u => u.UserProfileId == userProfileId && u.OrganizationId == organizationId && !u.Cancelled);

            if (result == null)
                return (null!, "User profile not found.");

            return (result, "User profile found.");
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "An error occurred while retrieving user profile by organization ID.");
            return (null!, "An error occurred while retrieving user profile.");
        }
    }

    public async Task<UserProfile> GetUserProfileByApplicationUserIdAsync(string applicationUserId, string email)
    {
        var user = await _context.UserProfiles.FirstOrDefaultAsync(u => u.ApplicationUserId == applicationUserId && u.Email == email && !u.Cancelled);
        if (user == null) return null!;
        return user;
    }

    public async Task<(IEnumerable<UsersListDto> users, string message)> GetUsersListByOrg(Guid? orgId)
    {
        try
        {
            var result = await (from vm in _context.UserProfiles

                                    // ⭐ Department Join
                                join _Department in _context.Department on vm.Department equals _Department.Id into _Department
                                from objDepartment in _Department.DefaultIfEmpty()

                                    // ⭐ SubDepartment Join
                                join _SubDepartment in _context.SubDepartment on vm.SubDepartment equals _SubDepartment.Id into _SubDepartment
                                from objSubDepartment in _SubDepartment.DefaultIfEmpty()

                                    // ⭐ Designation Join
                                join _Designation in _context.Designation on vm.Designation equals _Designation.Id into _Designation
                                from objDesignation in _Designation.DefaultIfEmpty()

                                    // ⭐ ManageRole Join
                                join _ManageRole in _context.ManageUserRoles on vm.RoleId equals _ManageRole.Id into _ManageRole
                                from objManageRole in _ManageRole.DefaultIfEmpty()

                                    // ⭐ AspNetUser Join
                                join _AspNetUser in _context.Users on vm.Email equals _AspNetUser.Email into _AspNetUser
                                from objAspNetUser in _AspNetUser.DefaultIfEmpty()

                                    // ⭐ AssetSite Join → SiteDisplay
                                join _Site in _context.AssetSite on vm.Site equals _Site.Id into _Site
                                from objSite in _Site.DefaultIfEmpty()

                                    // ⭐ AssetArea Join → AreaDisplay
                                join _Area in _context.AssetArea on vm.Area equals _Area.Id into _Area
                                from objArea in _Area.DefaultIfEmpty()

                                where !vm.Cancelled && orgId == vm.OrganizationId
                                orderby vm.CreatedDate descending
                                select new UsersListDto
                                {
                                    UserProfileId = vm.UserProfileId,
                                    ApplicationUserId = vm.ApplicationUserId,
                                    UserId = vm.UserId,
                                    FirstName = vm.FirstName,
                                    LastName = vm.LastName,
                                    Designation = vm.Designation,
                                    DesignationDisplay = objDesignation.Name,
                                    Department = vm.Department,
                                    DepartmentDisplay = objDepartment.Name,
                                    SubDepartment = vm.SubDepartment,
                                    SubDepartmentDisplay = objSubDepartment.Name,
                                    Site = vm.Site,
                                    SiteDisplay = objSite.Name,
                                    Area = vm.Area,
                                    AreaDisplay = objArea.Name,
                                    PhoneNumber = vm.PhoneNumber,
                                    Email = vm.Email,
                                    IsEmailConfirmed = objAspNetUser != null ? objAspNetUser.EmailConfirmed : false,
                                    ProfilePicture = vm.ProfilePicture,
                                    RoleIdDisplay = objManageRole.Name,
                                    RoleId = vm.RoleId,
                                    OrganizationId = vm.OrganizationId
                                }).ToListAsync();

            if (!result.Any())
                return (null!, "No created user profiles found.");

            return (result, "Created user profiles retrieved successfully.");
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "An error occurred while retrieving user profile by organization ID.");
            return (null!, "An error occurred while retrieving user profile.");
        }
    }
}
