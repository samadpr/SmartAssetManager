using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Helpers.Enum;
using SAMS.Models;
using SAMS.Services.Common.Interface;
using SAMS.Services.ManageUserRoles.DTOs;

namespace SAMS.Services.Common
{
    public class CommonRepository : ICommonRepository
    {
        private readonly ApplicationDbContext _context;
        public CommonRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<string>> GetEmailsUnderAdminAsync(string targetUserEmail)
        {
            try
            {
                var targetUser = await _context.UserProfiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Email == targetUserEmail && !u.Cancelled);

                if (targetUser == null)
                    return new List<string>();

                string? rootAdminEmail = await GetRootAdminEmailAsync(targetUser);

                if (string.IsNullOrEmpty(rootAdminEmail))
                    return new List<string>();

                // Now get all users created by root admin (and their children)
                var allEmails = await _context.UserProfiles
                    .AsNoTracking()
                    .Where(u => u.CreatedBy != null)
                    .ToListAsync();

                var resultEmails = new HashSet<string> { rootAdminEmail };

                var queue = new Queue<string>();
                queue.Enqueue(rootAdminEmail);

                while (queue.Count > 0)
                {
                    var currentEmail = queue.Dequeue();

                    var children = allEmails
                        .Where(u => u.CreatedBy == currentEmail)
                        .Select(u => u.Email!)
                        .ToList();

                    foreach (var email in children)
                    {
                        if (resultEmails.Add(email)) // add if not already present
                            queue.Enqueue(email);
                    }
                }

                return resultEmails.ToList();

                /*//var allEmailsUnderAdmin = await _context.UserProfiles
                //    .AsNoTracking()
                //    .Where(u => u.CreatedBy == adminEmail && u.ApplicationUserId != null && !u.Cancelled)
                //    .Select(u => u.Email)
                //    .ToListAsync();

                //var allEmailsUnderAdminAndRole = await _context.UserProfiles.Where(u => allEmailsUnderAdmin.Contains(u.CreatedBy) && !u.Cancelled).OrderByDescending(d => d.CreatedDate).ToListAsync();

                //if (allEmailsUnderAdminAndRole.Count != 0)
                //{
                //    foreach (var item in allEmailsUnderAdminAndRole)
                //    {
                //        allEmailsUnderAdmin.Add(item.Email!);
                //    }
                //}
                //// Include the admin themselves
                //allEmailsUnderAdmin.Add(adminEmail);


                //return allEmailsUnderAdmin.Distinct().ToList()!;*/
            }
            catch (Exception ex)
            {
                // Log the exception (consider using a logging framework)
                Console.WriteLine($"Error retrieving emails under admin: {ex.Message}");
                return new List<string>();
            }
        }

        private async Task<string?> GetRootAdminEmailAsync(UserProfile user)
        {
            while (true)
            {
                if (user.RoleId == (long)RolesEnum.Admin)
                    return user.Email;

                if (string.IsNullOrEmpty(user.CreatedBy) || user.CreatedBy.ToLower() == "admin")
                    return null;

                var parent = await _context.UserProfiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Email == user.CreatedBy);

                if (parent == null)
                    return null;

                user = parent;
            }
        }

        public async Task InsertLoginHistory(LoginHistory loginHistory)
        {
            await _context.LoginHistory.AddAsync(loginHistory);
            await _context.SaveChangesAsync();
        }

        public async Task<ManageUserRolesDto> GetUserRoleIdWithRoleDetailsByOrgIdAsync(long roleId)
        {
            var userRole = await _context.ManageUserRoles
                .Where(ur => !ur.Cancelled && ur.Id == roleId)
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
                    RolePermissions = ur.ManageUserRolesDetails.Where(rp => !rp.Cancelled).Select(rp => new ManageUserRolesDetailsDto
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
    }
}
