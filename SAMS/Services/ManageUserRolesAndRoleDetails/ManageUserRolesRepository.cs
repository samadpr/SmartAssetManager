using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.ManageUserRoles.DTOs;
using SAMS.Services.ManageUserRoles.Interface;

namespace SAMS.Services.ManageUserRoles
{
    public class ManageUserRolesRepository : IManageUserRolesRepository
    {
        private readonly ApplicationDbContext _context;

        public ManageUserRolesRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ManageUserRole> CreateRoleWithRoleDetailsAsync(ManageUserRole role, List<ManageUserRolesDetail> permissions)
        {
            await _context.ManageUserRoles.AddAsync(role);
            await _context.SaveChangesAsync();

            foreach (var permission in permissions)
            {
                permission.ManageRoleId = role.Id;
                await _context.ManageUserRolesDetails.AddAsync(permission);
            }

            await _context.SaveChangesAsync();
            return role;
        }

        public async Task<ManageUserRole> CreateUserRolesAsync(ManageUserRole role)
        {
            await _context.ManageUserRoles.AddAsync(role);
            await _context.SaveChangesAsync();
            return role;
        }

        public async Task<IEnumerable<ManageUserRolesDetail>> CreateUserRolesDetailsAsync(IEnumerable<ManageUserRolesDetail> rolesDetails)
        {
            await _context.ManageUserRolesDetails.AddRangeAsync(rolesDetails);
            await _context.SaveChangesAsync();
            return rolesDetails;
        }

        public async Task<IEnumerable<ManageUserRole>> GetAllRolesAsync() =>
            await _context.ManageUserRoles.Where(x => !x.Cancelled).ToListAsync();

        public async Task<IEnumerable<ManageUserRolesDto>> GetAllRolesWithRoleDetailsAsync()
        {
            var userRoles = await _context.ManageUserRoles
                .Where(ur => !ur.Cancelled)
                .Include(ur => ur.ManageUserRolesDetails)
                .Select(ur => new ManageUserRolesDto
                {
                    Id = ur.Id,
                    Name = ur.Name,
                    Description = ur.Description,
                    CreatedBy = ur.CreatedBy,
                    CreatedDate = ur.CreatedDate,
                    ModifiedBy = ur.ModifiedBy,
                    ModifiedDate = ur.ModifiedDate,
                    RolePermissions = ur.ManageUserRolesDetails.Select(rp => new ManageUserRolesDetailsDto
                    {
                        Id = rp.Id,
                        ManageRoleId = rp.ManageRoleId,
                        RoleId = rp.RoleId,
                        RoleName = rp.RoleName,
                        IsAllowed = rp.IsAllowed,
                        CreatedBy = rp.CreatedBy,
                        CreatedDate = rp.CreatedDate,
                        ModifiedBy = rp.ModifiedBy,
                        ModifiedDate = rp.ModifiedDate
                    }).ToList()
                })
                .ToListAsync();

            if (userRoles == null)
                return null!;

            return userRoles;
        }

        public async Task<IEnumerable<ManageUserRolesDetail>> GetRoleDetailsByManagedRoleIdAsync(long managedRoleId)
        {
            var roleDetails = await _context.ManageUserRolesDetails.Where(ur => ur.ManageRoleId == managedRoleId && !ur.Cancelled).ToListAsync();
            if (roleDetails == null)
                return null!;
            return roleDetails;

        }

        public Task<ManageUserRole> GetUserRoleByIdAsync(long id, List<string> emails)
        {
            var userRole = _context.ManageUserRoles.Where(ur => ur.Id == id && emails.Contains(ur.CreatedBy) && !ur.Cancelled).FirstOrDefaultAsync();
            return userRole!;
        }

        public async Task<ManageUserRolesDto> GetUserRoleByIdWithRoleDetailsAsync(long id)
        {
            var userRole = await _context.ManageUserRoles
                .Where(ur => !ur.Cancelled && ur.Id == id)
                .Include(ur => ur.ManageUserRolesDetails)
                .Select(ur => new ManageUserRolesDto
                {
                    Id = ur.Id,
                    Name = ur.Name,
                    Description = ur.Description,
                    CreatedBy = ur.CreatedBy,
                    CreatedDate = ur.CreatedDate,
                    ModifiedBy = ur.ModifiedBy,
                    ModifiedDate = ur.ModifiedDate,
                    RolePermissions = ur.ManageUserRolesDetails.Select(rp => new ManageUserRolesDetailsDto
                    {
                        Id = rp.Id,
                        ManageRoleId = rp.ManageRoleId,
                        RoleId = rp.RoleId,
                        RoleName = rp.RoleName,
                        IsAllowed = rp.IsAllowed,
                        CreatedBy = rp.CreatedBy,
                        CreatedDate = rp.CreatedDate,
                        ModifiedBy = rp.ModifiedBy,
                        ModifiedDate = rp.ModifiedDate
                    }).ToList()
                }).FirstOrDefaultAsync();

            if (userRole == null)
                return null!;
            return userRole;
        }


        public Task<ManageUserRolesDetail> GetUserRoleDetailsByIdAsync(long id, List<string> emails)
        {
            var userRoleDetails = _context.ManageUserRolesDetails.Where(ur => ur.Id == id && emails.Contains(ur.CreatedBy) && !ur.Cancelled).FirstOrDefaultAsync();
            return userRoleDetails!;
        }

        public async Task<IEnumerable<ManageUserRole>> GetUserRolesAsync(List<string> emails)
        {
            var userRoles = await _context.ManageUserRoles
                            .Where(ur => emails.Contains(ur.CreatedBy) && ur.Cancelled == false)
                            .OrderByDescending(ur => ur.CreatedDate)
                            .ToListAsync();
            return userRoles;
        }

        public async Task<IEnumerable<ManageUserRolesDto>> GetUserRolesWithRoleDetailsAsync(List<string> emails)
        {
            var userRoles = await _context.ManageUserRoles
                .Where(ur => emails.Contains(ur.CreatedBy) && !ur.Cancelled)
                .Include(ur => ur.ManageUserRolesDetails)
                .Select(ur => new ManageUserRolesDto
                {
                    Id = ur.Id,
                    Name = ur.Name,
                    Description = ur.Description,
                    CreatedBy = ur.CreatedBy,
                    CreatedDate = ur.CreatedDate,
                    ModifiedBy = ur.ModifiedBy,
                    ModifiedDate = ur.ModifiedDate,
                    RolePermissions = ur.ManageUserRolesDetails.Select(rp => new ManageUserRolesDetailsDto
                    {
                        Id = rp.Id,
                        ManageRoleId = rp.ManageRoleId,
                        RoleId = rp.RoleId,
                        RoleName = rp.RoleName,
                        IsAllowed = rp.IsAllowed,
                        CreatedBy = rp.CreatedBy,
                        CreatedDate = rp.CreatedDate,
                        ModifiedBy = rp.ModifiedBy,
                        ModifiedDate = rp.ModifiedDate
                    }).ToList()
                }).OrderByDescending(ur => ur.CreatedDate)
                .ToListAsync();

            if (userRoles == null)
                return null!;

            return userRoles;
        }

        public Task<bool> UpdateUserRoleDetailsAsync(ManageUserRolesDetail manageUserRolesDetail)
        {
            _context.Entry(manageUserRolesDetail).State = EntityState.Modified;
            _context.SaveChanges();
            return Task.FromResult(true);
        }

        public async Task<bool> UpdateUserRoleWithRoleDetailsAsync(ManageUserRole manageUserRole, ManageUserRolesDto request)
        {
            _context.Entry(manageUserRole).CurrentValues.SetValues(request);
            await _context.SaveChangesAsync();
            return true;
        }

        public Task<bool> UpdateUserRolesAsync(ManageUserRole manageUserRole)
        {
            _context.Entry(manageUserRole).State = EntityState.Modified;
            _context.SaveChanges();
            return Task.FromResult(true);
        }
    }
}
