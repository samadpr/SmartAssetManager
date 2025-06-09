using Microsoft.EntityFrameworkCore;
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


    public async Task<UserProfile> GetProfileDetails(string userEmail)
    {
        var user = await _context.UserProfiles.FirstOrDefaultAsync(u => u.Email == userEmail);
        if(user == null) return null!;
        return user!;
    }

    public async Task<IEnumerable<UserProfile>> GetUsersUsedByRoleIdAsync(long roleId)
    {
        return await _context.UserProfiles.Where(u => u.RoleId == roleId && !u.Cancelled).ToListAsync();
    }

    public async Task<bool> UpdateProfileAsync(UserProfile user)
    {
        _context.UserProfiles.Update(user);
        return await _context.SaveChangesAsync() > 0;
    }

    public Task<int> GetCreatedUsersCount(string createdBy)
    {
        return _context.UserProfiles.CountAsync(u => u.CreatedBy == createdBy && !u.Cancelled);
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

    public async Task<IEnumerable<UserProfile>> GetCreatedUsersProfile(string createdBy)
    {
        return await _context.UserProfiles.Where(u => u.CreatedBy == createdBy && !u.Cancelled).ToListAsync();
    }

    public async Task<(UserProfile user, string message)> GetUserProfileByProfileId(long profileId, string createdBy)
    {
        var user = await _context.UserProfiles.FirstOrDefaultAsync(u => u.UserProfileId == profileId && u.CreatedBy == createdBy && !u.Cancelled);

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
}
