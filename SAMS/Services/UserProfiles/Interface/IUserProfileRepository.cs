using SAMS.Models;
using SAMS.Services.UserProfiles.DTOs;

namespace SAMS.Services.Profile.Interface;

public interface IUserProfileRepository
{
    Task<UserProfile> GetProfileDetails(string userEmail);

    Task<bool> UpdateProfileAsync(UserProfile user);

    Task<IEnumerable<UserProfile>> GetUsersUsedByRoleIdAsync(long roleId);

    Task<int> GetCreatedUsersCount(string createdBy);

    Task<(bool isSuccess, string message)> CreateUserProfileAsync(UserProfile userProfile);

    Task<IEnumerable<UserProfile>> GetCreatedUsersProfile(string createdBy);

    Task<(UserProfile user, string message)> GetUserProfileByProfileId(long profileId, string createdBy);

    Task<(bool success, string message)> UpdateUserProfileAsync(UserProfile user);
}
