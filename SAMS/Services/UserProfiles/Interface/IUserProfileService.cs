using SAMS.API.UserProfileAPIs.RequestObject;
using SAMS.Models;
using SAMS.Services.UserProfiles.DTOs;

namespace SAMS.Services.Profile.Interface;

public interface IUserProfileService
{
    Task<UserProfile> GetProfileDetails();

    Task<(bool Success, string Message)> UpdateProfileAsync(UserProfileRequestObject user);

    Task<(bool Success, string Message)> CreateUserProfileAsync(UserProfileDto userProfile, string createdBy);

    Task<IEnumerable<UserProfile>> GetCreatedUsersProfile(string createdBy);

    Task<(bool success, string message)> UpdateCreatedUserProfileAsync( UserProfileDto userProfile, string createdBy);

    Task<(bool success, string message)> DeleteCreatedUserProfile(long id, string modifiedBy);

    Task<(bool Success, string Message)> AllowLoginAccessForCreatedUserAsync(LoginAccessRequestObject loginAccessRequestObject, string modifiedBy);

    Task<(bool Success, string Message)> UpdateLoginAccessForCreatedUserAsync(UpdateLoginAccessRequestObject updateLoginAccessRequestObject, string modifiedBy);

    Task<(bool Success, string Message)> RevokeLoginAccessForCreatedUserProfile(long id, string modifiedBy);

    Task<(IEnumerable<UserProfile> UserProfiles, bool Success, string Message)> GetUserProfilesUsedInRoleId(long roleId, string user);
}
