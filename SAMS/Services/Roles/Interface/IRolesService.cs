using SAMS.Models;
using SAMS.Services.ManageUserRoles.DTOs;

namespace SAMS.Services.Roles.Interface
{
    public interface IRolesService
    {
        Task GenerateRolesFromPageListAsync();

        Task AddToRolesAsync(ApplicationUser user);

        Task<(bool isSuccess, string message)> UpdateUserRoles(ManageUserRolesDto updatedRoles);
    }
}
