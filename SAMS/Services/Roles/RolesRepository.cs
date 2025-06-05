using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SAMS.Models;
using SAMS.Services.ManageUserRoles.DTOs;
using SAMS.Services.Roles.Interface;

namespace SAMS.Services.Roles
{
    public class RolesRepository : IRolesRepository
    {
        private readonly RoleManager<IdentityRole> _roleManager;

        public RolesRepository(RoleManager<IdentityRole> roleManager)
        {
            _roleManager = roleManager;
        }

        public async Task<bool> RoleExistsAsync(string roleName)
        {
            return await _roleManager.RoleExistsAsync(roleName);
        }

        public async Task CreateRoleAsync(string roleName)
        {
            await _roleManager.CreateAsync(new IdentityRole(roleName));
        }

        public async Task<List<string>> GetAllRoleNamesAsync()
        {
            return await Task.FromResult(_roleManager.Roles.Select(r => r.Name).ToList());
        }

        public async Task<List<ManageUserRolesDetail>> GetRoleListAsync()
        {
            var roles = await _roleManager.Roles.ToListAsync();
            return roles.Select(role => new ManageUserRolesDetail
            {
                RoleId = role.Id,
                RoleName = role.Name,
                IsAllowed = false
            }).OrderBy(x => x.RoleName).ToList();
        }
    }
}

