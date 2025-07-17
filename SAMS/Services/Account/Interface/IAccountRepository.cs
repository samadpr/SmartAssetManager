using SAMS.API.Account.RequestObject;
using SAMS.Models;

namespace SAMS.Services.Account.Interface
{
    public interface IAccountRepository
    {
        Task AddUserProfile(UserProfile userProfile);

        LoginHistory GetLoginHistory(string username);

        Task<UserProfile> GetUserProfileByApplicationUserId(string applicationUserId);

    }
}
