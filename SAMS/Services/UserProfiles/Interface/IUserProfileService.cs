using SAMS.API.UserProfileAPIs.RequestObject;
using SAMS.Models;
using SAMS.Services.UserProfiles.DTOs;

namespace SAMS.Services.Profile.Interface;

public interface IUserProfileService
{
    Task<UserProfile> GetProfileDetails();

    Task<(bool Success, string Message)> UpdateProfileAsync(UserProfileRequestObject user);

    Task<(bool Success, string Message)> CreateUserProfileAsync(UserProfileDto userProfile, string CreatedBy);

    Task<IEnumerable<UserProfile>> GetCreatedUsersProfile(string createdBy);

    Task<(bool success, string message)> UpdateCreatedUserProfileAsync( UserProfileDto userProfile, string CreatedBy);

    Task<(bool Success, string Message)> AllowLoginAccessForCreatedUserAsync(LoginAccessRequestObject loginAccessRequestObject, string modifiedBy);
}
