using SAMS.Models;

namespace SAMS.Services.Profile.Interface;

public interface IUserProfileRepository
{
    Task<UserProfile> GetProfileDetails(string userEmail);
    Task<bool> UpdateUserProfileAsync(UserProfile user);
}
