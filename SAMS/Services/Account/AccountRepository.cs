using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Account.Interface;

namespace SAMS.Services.Account;

public class AccountRepository : IAccountRepository
{
    private readonly ApplicationDbContext _context;

    public AccountRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddUserProfile(UserProfile userProfile)
    {
        await _context.UserProfiles.AddAsync(userProfile);
        await _context.SaveChangesAsync();
    }

    public LoginHistory GetLoginHistory(string username)
    {
        var values = _context.LoginHistory.Where(x => x.UserName == username && x.Action == "Login").OrderByDescending(x => x.CreatedDate).Take(1).SingleOrDefault();
        if(values != null)
        {
            return values;
        }
        else
            return null!;
    }

    public async Task<UserProfile> GetUserProfileByApplicationUserId(string applicationUserId)
    {
        var userProfile = await _context.UserProfiles.Where(x => x.ApplicationUserId == applicationUserId && !x.Cancelled).FirstOrDefaultAsync();
        return userProfile!;
    }
}
