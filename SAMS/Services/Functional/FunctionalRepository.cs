using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Functional.Interface;
using SAMS.Services.Roles.PagesModel;

namespace SAMS.Services.Functional
{
    public class FunctionalRepository : IFunctionalRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly SeedData _CommonData = new SeedData();

        public FunctionalRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DefaultIdentityOptions?> GetDefaultIdentitySettingsAsync()
        {
            return await _context.DefaultIdentityOption
                                 .Where(x => x.Id == 1)
                                 .SingleOrDefaultAsync();
        }

        public async Task CreateDefaultIdentitySettingsAsync()
        {
            if (!_context.DefaultIdentityOption.Any())
            {
                var defaultOptions = new DefaultIdentityOptions
                {
                    PasswordRequireDigit = false,
                    PasswordRequiredLength = 3,
                    PasswordRequireNonAlphanumeric = false,
                    PasswordRequireUppercase = false,
                    PasswordRequireLowercase = false,
                    PasswordRequiredUniqueChars = 0,
                    LockoutDefaultLockoutTimeSpanInMinutes = 30,
                    LockoutMaxFailedAccessAttempts = 5,
                    LockoutAllowedForNewUsers = false,
                    UserRequireUniqueEmail = true,
                    SignInRequireConfirmedEmail = false,
                    CookieHttpOnly = true,
                    CookieExpiration = 150,
                    CookieExpireTimeSpan = 120,
                    LoginPath = "/Account/Login",
                    LogoutPath = "/Account/Logout",
                    AccessDeniedPath = "/Account/AccessDenied",
                    SlidingExpiration = true,
                    CreatedDate = DateTime.Now,
                    ModifiedDate = DateTime.Now,
                    CreatedBy = RoleModels.SuperAdmin,
                    ModifiedBy = RoleModels.SuperAdmin,
                };

                await _context.DefaultIdentityOption.AddAsync(defaultOptions);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<ManageUserRole>> GetAllManageRolesAsync()
        {
            var roles = await _context.ManageUserRoles.ToListAsync();
            if (roles.Count == 0)
            {
                var _GetManageRoleList = _CommonData.GetManageRoleList();
                foreach (var item in _GetManageRoleList)
                {
                    item.CreatedDate = DateTime.Now;
                    item.ModifiedDate = DateTime.Now;
                    item.CreatedBy = RoleModels.SuperAdmin;
                    item.ModifiedBy = RoleModels.SuperAdmin;
                    _context.ManageUserRoles.Add(item);
                    await _context.SaveChangesAsync();
                }
                roles = await _context.ManageUserRoles.ToListAsync();
            }
            return roles;
        }

        public async Task AddManageUserRoleDetailsAsync(ManageUserRolesDetail detail)
        {
            _context.ManageUserRolesDetails.Add(detail);
            await _context.SaveChangesAsync();
        }

        public async Task SaveUserProfileAsync(UserProfile profile)
        {
            await _context.UserProfiles.AddAsync(profile);
            await _context.SaveChangesAsync();
        }

    }
}
