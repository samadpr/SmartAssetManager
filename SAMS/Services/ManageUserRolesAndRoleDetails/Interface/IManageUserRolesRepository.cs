using SAMS.Models;
using SAMS.Services.ManageUserRoles.DTOs;

namespace SAMS.Services.ManageUserRoles.Interface
{
    public interface IManageUserRolesRepository
    {
        Task<ManageUserRole> CreateRoleWithRoleDetailsAsync(ManageUserRole role, List<ManageUserRolesDetail> permissions);

        Task<ManageUserRole> CreateUserRolesAsync(ManageUserRole role);

        Task<IEnumerable<ManageUserRolesDetail>> CreateUserRolesDetailsAsync(IEnumerable<ManageUserRolesDetail> roles);

        Task<IEnumerable<ManageUserRole>> GetAllRolesAsync();

        Task<IEnumerable<ManageUserRolesDto>> GetUserRolesWithRoleDetailsAsync(List<string> emails);

        Task<IEnumerable<ManageUserRole>> GetUserRolesAsync(List<string> emails);

        Task<ManageUserRole> GetUserRoleByIdAsync(long id, List<string> emails);

        Task<ManageUserRolesDetail> GetUserRoleDetailsByIdAsync(long id, List<string> emails);

        Task<IEnumerable<ManageUserRolesDetail>> GetRoleDetailsByManagedRoleIdAsync(long managedRoleId);

        Task<IEnumerable<ManageUserRolesDto>> GetAllRolesWithRoleDetailsAsync();

        Task<bool> UpdateUserRoleWithRoleDetailsAsync(ManageUserRole manageUserRole, ManageUserRolesDto request);

        Task<bool> UpdateUserRoleDetailsAsync(ManageUserRolesDetail manageUserRolesDetail);

        Task<ManageUserRolesDto> GetUserRoleByIdWithRoleDetailsAsync(long id);

        Task<bool> UpdateUserRolesAsync(ManageUserRole manageUserRole);

    }
}
