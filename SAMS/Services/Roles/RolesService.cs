using Microsoft.AspNetCore.Identity;
using SAMS.Models;
using SAMS.Services.Roles.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.Services.Roles
{
    public class RolesService : IRolesService
    {
        private readonly IRolesRepository _rolesRepository;
        private readonly UserManager<ApplicationUser> _userManager;

        public RolesService(IRolesRepository rolesRepository, UserManager<ApplicationUser> userManager)
        {
            _rolesRepository = rolesRepository;
            _userManager = userManager;
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
                await _userManager.AddToRolesAsync(user, roleNames);
            }
        }
    }
}
