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
                    SignInRequireConfirmedEmail = true,
                    SignInRequireConfirmedAccount = true,
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

        public async Task CreateDefaultEmailSettingsAsync()
        {
            try
            {
                if(!_context.SMTPEmailSettings.Any())
                {
                    SMTPEmailSetting _SMTPEmailSetting = new SMTPEmailSetting
                    {
                        UserName = "codinguse341@gmail.com",
                        Password = "wxdm fhyz qunq kvjh", 
                        Host = "smtp.gmail.com",
                        Port = 587,
                        IsSSl = true,
                        FromEmail = "codinguse341@gmail.com",
                        FromFullName = "SAMS Notification",
                        IsDefault = true,

                        CreatedDate = DateTime.Now,
                        ModifiedDate = DateTime.Now,
                        CreatedBy = RoleModels.SuperAdmin,
                        ModifiedBy = RoleModels.SuperAdmin
                    };

                    await _context.SMTPEmailSettings.AddAsync(_SMTPEmailSetting);
                }

                if(!_context.SendGridSettings.Any())
                {
                    SendGridSetting _SendGridSetting = new SendGridSetting
                    {
                        SendGridUser = "SAMS System",
                        SendGridKey = "SG.your-real-sendgrid-api-key",
                        FromEmail = "noreply@sams.com",
                        FromFullName = "SAMS Notifications",
                        IsDefault = false,

                        CreatedDate = DateTime.Now,
                        ModifiedDate = DateTime.Now,
                        CreatedBy = RoleModels.SuperAdmin,
                        ModifiedBy = RoleModels.SuperAdmin
                    };
                }
                await _context.SaveChangesAsync();
            }
            catch(Exception ex)
            {
                throw new Exception("Error while creating default email settings: " + ex.Message);
            }
        }

        public async Task CreateDefaultIndustriesAsync()
        {
            if (!_context.Industries.Any())
            {
                var industriesList = _CommonData.GetDefaultIndustriesList();
                foreach (var industry in industriesList)
                {
                    industry.CreatedDate = DateTime.Now;
                    industry.ModifiedDate = DateTime.Now;
                    industry.CreatedBy = RoleModels.SuperAdmin;
                    industry.ModifiedBy = RoleModels.SuperAdmin;
                    await _context.Industries.AddAsync(industry);
                }
                await _context.SaveChangesAsync();
            }
        }

    }
}
