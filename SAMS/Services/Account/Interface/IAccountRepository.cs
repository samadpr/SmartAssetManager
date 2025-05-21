using SAMS.API.Account.RequestObject;
using SAMS.Models;
using SAMS.Services.Account.DTOs;

namespace SAMS.Services.Account.Interface
{
    public interface IAccountRepository
    {
        Task AddUserProfile(UserProfile userProfile);
        LoginHistory GetLoginHistory(string username);

    }
}
