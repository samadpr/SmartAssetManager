using SAMS.Models;
using SAMS.Services.ManageUserRoles.DTOs;

namespace SAMS.Services.Common.Interface
{
    public interface ICommonRepository
    {
        Task InsertLoginHistory(LoginHistory loginHistory);

        Task<List<string>> GetEmailsUnderAdminAsync(string targetUserEmail);

        Task<ManageUserRolesDto> GetUserRoleIdWithRoleDetailsByOrgIdAsync(long roleId);
    }
}
