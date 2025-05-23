using SAMS.API.UserProfileAPIs.RequestObject;
using SAMS.Models;

namespace SAMS.Services.Profile.Interface;

public interface IUserProfileService
{
    Task<UserProfile> GetProfileDetails();

    Task<(bool Success, string Message)> UpdateUserProfileAsync(UpdateUPRequestObject user);
}
