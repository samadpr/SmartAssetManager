using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.ManageUserRoles.DTOs;
using SAMS.Services.Roles.Interface;

namespace SAMS.Services.Roles
{
    public class RolesRepository : IRolesRepository
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ApplicationDbContext _context;

        public RolesRepository(RoleManager<IdentityRole> roleManager, ApplicationDbContext context)
        {
            _roleManager = roleManager;
            _context = context;
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
            var roles = await Task.FromResult(_roleManager.Roles.Select(r => r.Name).ToList());
            if (roles is null)
                return null!;
            return roles!;
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


        public async Task<IEnumerable<UserProfile>> GetUsersUsedByRoleIdAsync(long roleId, List<string> emails)
        {
            return await _context.UserProfiles.Where(u => u.RoleId == roleId && emails.Contains(u.Email!) && !u.Cancelled).ToListAsync();
        }
    }
}

