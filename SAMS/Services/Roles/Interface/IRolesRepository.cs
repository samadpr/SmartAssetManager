using SAMS.Models;
using SAMS.Services.ManageUserRoles.DTOs;

namespace SAMS.Services.Roles.Interface
{
    public interface IRolesRepository
    {
        Task<List<ManageUserRolesDetail>> GetRoleListAsync();

        Task<bool> RoleExistsAsync(string roleName);

        Task CreateRoleAsync(string roleName);

        Task<List<string>> GetAllRoleNamesAsync();

        Task<IEnumerable<UserProfile>> GetUsersUsedByRoleIdAsync(long roleId, List<string> emails);

    }
}
