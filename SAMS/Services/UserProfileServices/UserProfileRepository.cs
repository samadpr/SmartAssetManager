using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Profile.Interface;

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

    public async Task<bool> UpdateUserProfileAsync(UserProfile user)
    {
        _context.UserProfiles.Update(user);
        return await _context.SaveChangesAsync() > 0;
    }
}
