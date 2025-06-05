using Microsoft.AspNetCore.Identity;
using SAMS.Models;
using SAMS.Services.ManageUserRoles.DTOs;
using SAMS.Services.Roles.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.Services.Roles
{
    public class RolesService : IRolesService
    {
        private readonly IRolesRepository _rolesRepository;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<RolesService> _logger;

        public RolesService(IRolesRepository rolesRepository, UserManager<ApplicationUser> userManager, ILogger<RolesService> logger)
        {
            _rolesRepository = rolesRepository;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task GenerateRolesFromPageListAsync()
        {
            Type roleType = typeof(RoleModels);
            foreach (var field in roleType.GetFields())
            {
                string roleName = (string)field.GetValue(field)!;
                if (!await _rolesRepository.RoleExistsAsync(roleName))
                {
                    await _rolesRepository.CreateRoleAsync(roleName);
                }
            }
        }

        public async Task AddToRolesAsync(ApplicationUser user)
        {
            if (user != null)
            {
                var roleNames = await _rolesRepository.GetAllRoleNamesAsync();

                if(user.Email == "admin@gmail.com")
                {
                    await _userManager.AddToRolesAsync(user, roleNames);
                }
                else
                {
                    var rolesToAssign = roleNames.Where(r => !string.Equals(r, "Super Admin", StringComparison.OrdinalIgnoreCase)).ToList();
                    await _userManager.AddToRolesAsync(user, rolesToAssign);
                }
            }
        }

        public async Task<(bool isSuccess, string message)> UpdateUserRoles(ManageUserRolesDto updatedRoles)
        {
            try
            {
                var _applicationUser = await _userManager.FindByIdAsync(updatedRoles.ApplicationUserId);
                if (_applicationUser == null)
                    return (false, "User not found.");

                var roles = await _userManager.GetRolesAsync(_applicationUser);
                var result = IdentityResult.Success;
                if(roles.Count > 0)
                    result = await _userManager.RemoveFromRolesAsync(_applicationUser, roles);

                if (!result.Succeeded)
                {
                    _logger.LogError("Failed to remove user roles.");
                    return (false, "Failed to remove user roles.");
                }

                var allowedRoles = updatedRoles.RolePermissions?.Where(r => r.IsAllowed).Select(r => r.RoleName).ToList();

                if (allowedRoles is not null)
                {
                    foreach(var role in allowedRoles)
                    {
                        result = await _userManager.AddToRoleAsync(_applicationUser, role!);
                        if (!result.Succeeded)
                        {
                            _logger.LogError("Failed to add user roles.");
                            return (false, "Failed to add user roles.");
                        }
                    }
                }
                /*//foreach (var roleTrue in updatedRoles.RolePermissions!.Where(x => x.IsAllowed == true).Select(x => x.RoleName))
                //{
                //    await _userManager.AddToRoleAsync(_applicationUser, roleTrue!);
                //}*/

                // Update security stamp to force re-evaluation of user roles
                if(roles.Count > 0)
                {
                    await _userManager.UpdateSecurityStampAsync(_applicationUser);
                    await _userManager.UpdateAsync(_applicationUser);
                }
                

                _logger.LogInformation("User roles updated successfully for user {UserId}.", _applicationUser.Id);
                return (true, "User roles updated successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating user roles.");
                return (false, ex.Message);
            }
        }
    }
}
