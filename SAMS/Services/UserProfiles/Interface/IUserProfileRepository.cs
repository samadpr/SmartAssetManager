using SAMS.API.UserProfileAPIs.ResponseObject;
using SAMS.Models;
using SAMS.Services.UserProfiles.DTOs;

namespace SAMS.Services.Profile.Interface;

public interface IUserProfileRepository
{
    Task<UserProfile> GetProfileData(string userEmail);

    Task<(GetProfileDetailsResponseObject responseObject, bool isSuccess, string message)> GetProfileDetails(string userEmail);

    Task<bool> UpdateProfileAsync(UserProfile user);

    Task<int> GetCreatedUsersCount(List<string> emails);

    Task<(bool isSuccess, string message)> CreateUserProfileAsync(UserProfile userProfile);

    Task<IEnumerable<UserProfile>> GetCreatedUsersProfile(List<string> emails);

    Task<(IEnumerable<GetProfileDetailsResponseObject> responseObject, bool isSuccess, string message)> GetCreatedUserProfilesDetails(List<string> emails);

    Task<(UserProfile user, string message)> GetUserProfileByProfileId(long profileId, List<string> emails);

    Task<(UserProfile user, string message)> GetUserProfileByOrganizationId(long userProfileId, Guid organizationId);

    Task<(bool success, string message)> UpdateUserProfileAsync(UserProfile user);

    Task<bool> IsEmailExistsAsync(string email, long userProfileId, Guid organizationId);

    Task<UserProfile> GetUserProfileByApplicationUserIdAsync(string applicationUserId, string email);
}
