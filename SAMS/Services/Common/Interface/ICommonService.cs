using SAMS.Models;
using UAParser;

namespace SAMS.Services.Common.Interface
{
    public interface ICommonService
    {
        Task<bool> InsertToLoginHistory(LoginHistory history);

    }
}
