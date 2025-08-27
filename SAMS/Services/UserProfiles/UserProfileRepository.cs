using Microsoft.EntityFrameworkCore;
using SAMS.API.UserProfileAPIs.ResponseObject;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Profile.Interface;
using SAMS.Services.UserProfiles.DTOs;

namespace SAMS.Services.Profile;

public class UserProfileRepository : IUserProfileRepository
{
    private readonly ApplicationDbContext _context;

    public UserProfileRepository(ApplicationDbContext context)
    {
        _context = context;
    }


    public async Task<UserProfile> GetProfileData(string userEmail)
    {
        var user = await _context.UserProfiles.FirstOrDefaultAsync(u => u.Email == userEmail && !u.Cancelled);
        if(user == null) return null!;
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

    public async Task<(GetProfileDetailsResponseObject responseObject, bool isSuccess, string message)> GetProfileDetails(string userEmail)
    {
        try
        {
            var result = await (from vm in _context.UserProfiles
                                join _Department in _context.Department on vm.Department equals _Department.Id into _Department
                                from objDepartment in _Department.DefaultIfEmpty()
                                join _SubDepartment in _context.SubDepartment on vm.SubDepartment equals _SubDepartment.Id into _SubDepartment
                                from objSubDepartment in _SubDepartment.DefaultIfEmpty()
                                join _Designation in _context.Designation on vm.Designation equals _Designation.Id into _Designation
                                from objDesignation in _Designation.DefaultIfEmpty()
                                join _ManageRole in _context.ManageUserRoles on vm.RoleId equals _ManageRole.Id into _ManageRole
                                from objManageRole in _ManageRole.DefaultIfEmpty()
                                where vm.Cancelled == false && vm.Email == userEmail
                                select new GetProfileDetailsResponseObject
                                {
                                    UserProfileId = vm.UserProfileId,
                                    ApplicationUserId = vm.ApplicationUserId,
                                    EmployeeId = vm.EmployeeId,
                                    FirstName = vm.FirstName,
                                    LastName = vm.LastName,
                                    DateOfBirth = vm.DateOfBirth,
                                    DesignationDisplay = objDesignation.Name,
                                    DepartmentDisplay = objDepartment.Name,
                                    SubDepartmentDisplay = objSubDepartment.Name,
                                    JoiningDate = vm.JoiningDate,
                                    LeavingDate = vm.LeavingDate,
                                    PhoneNumber = vm.PhoneNumber,
                                    Email = vm.Email,
                                    Address = vm.Address,
                                    Country = vm.Country,
                                    ProfilePicture = vm.ProfilePicture,
                                    RoleIdDisplay = objManageRole.Name,
                                })
                            .FirstOrDefaultAsync();

            if (result == null)
                return (null!, false, "Profile not found.");
            
            return (result, true, "Profile found.");
        }
        catch(Exception ex)
        {
            return (null!, false, "Error retrieving profile details: " + ex.Message);
        }
    }
}
