using SAMS.Models;
using SAMS.Services.ManageUserRoles.DTOs;
using SAMS.Services.ManageUserRolesAndRoleDetails.DTOs;

namespace SAMS.Services.ManageUserRoles.Interface
{
    public interface IManageUserRolesService
    {
        Task<ManageUserRolesDto> CreateRoleWithRoleDetailsAsync(ManageUserRolesDto request, string createdBy);

        Task<ManageUserRolesDto> CreateUserRolesAsync(ManageUserRolesDto request, string createdBy);

        Task<IEnumerable<ManageUserRolesDetailsDto>> CreateUserRolesDetailsAsync(IEnumerable<ManageUserRolesDetailsDto> request, string modifiedBy);

        Task<IEnumerable<ManageUserRole>> GetAllRolesAsync();

        Task<IEnumerable<ManageUserRolesDto>> GetAllRolesWithRoleDetailsAsync();

        Task<IEnumerable<ManageUserRolesDto>> GetUserRolesWithRoleDetailsAsync(string user);

        Task<IEnumerable<ManageUserRole>> GetUserRolesAsync(string user);

        Task<ManageUserRole> GetUserRoleByIdAsync(int id, string user);

        Task<ManageUserRole> GetUserRoleByIdWithOrgIdAsync(long id, Guid orgId);

        Task<ManageUserRolesDetail> GetUserRoleDetailsByIdAsync(int id, string user);

        Task<IEnumerable<ManageUserRolesDetail>> GetRoleDetailsByManagedRoleIdAsync(long roleId, string user);

        Task<(bool isSuccess, string message)> UpdateUserRolesWithRoleDetailsAsync(ManageUserRolesDto request, string modifiedBy);

        Task<ManageUserRolesDto> GetUserRoleByIdWithRoleDetailsAsync(long id);

        //Task<ManageUserRolesDto?> GetUserRoleByRoleIdInDetailsAsync(long roleId, Guid? organizationId);

        Task<(bool isSuccess, string message)> DeleteUserRoleWithRoleDetailsAsync(long id, string modifiedBy);

        Task<IEnumerable<RoleDto>> GetAllAspNetRolesAsync();
    }
}
