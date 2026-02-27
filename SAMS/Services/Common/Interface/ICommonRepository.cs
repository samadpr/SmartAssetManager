using SAMS.Models;
using SAMS.Services.ManageUserRoles.DTOs;

namespace SAMS.Services.Common.Interface
{
    public interface ICommonRepository
    {
        Task InsertLoginHistory(LoginHistory loginHistory);

        Task<List<string>> GetEmailsUnderAdminAsync(string targetUserEmail);

        Task<ManageUserRolesDto> GetUserRoleIdWithRoleDetailsByOrgIdAsync(long roleId);

        Task<UserProfile> GetUserProfileData(string email, Guid? orgId);
    }
}
