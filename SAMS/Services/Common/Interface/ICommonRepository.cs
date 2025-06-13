using SAMS.Models;

namespace SAMS.Services.Common.Interface
{
    public interface ICommonRepository
    {
        Task InsertLoginHistory(LoginHistory loginHistory);

        Task<List<string>> GetEmailsUnderAdminAsync(string targetUserEmail);
    }
}
