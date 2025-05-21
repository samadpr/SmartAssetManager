using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.Functional.DTOs;
using SAMS.Services.Functional.Interface;
using SAMS.Services.Roles;
using SAMS.Services.Roles.Interface;

namespace SAMS.Services.Functional
{
    public class FunctionalService : IFunctionalService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IRolesService _rolesService;
        private readonly IRolesRepository _rolesRepo;
        private readonly IFunctionalRepository _functionalRepo;
        private readonly SuperAdminDefaultOptions _superAdminDefaultOptions;

        public FunctionalService(UserManager<ApplicationUser> userManager,
            IRolesService rolesService,
            IRolesRepository rolesRepo,
            IFunctionalRepository functionalRepo,
            SuperAdminDefaultOptions superAdminDefaultOptions)
        {
            _userManager = userManager;
            _rolesService = rolesService;
            _rolesRepo = rolesRepo;
            _functionalRepo = functionalRepo;
            _superAdminDefaultOptions = superAdminDefaultOptions;
        }


        public async Task CreateDefaultIdentitySettings()
        {
            await _functionalRepo.CreateDefaultIdentitySettingsAsync();
        }

        public async Task<DefaultIdentityOptions> GetDefaultIdentitySettings()
        {
            var settings = await _functionalRepo.GetDefaultIdentitySettingsAsync();
            return settings!;
        }

        public async Task GenerateUserUserRole()
        {

            await _rolesService.GenerateRolesFromPageListAsync();

            var manageRoles = await _functionalRepo.GetAllManageRolesAsync();
            var roleList = await _rolesRepo.GetRoleListAsync();

            foreach (var role in manageRoles)
            {
                foreach (var item in roleList)
                {
                    var details = new ManageUserRolesDetail
                    {
                        ManageRoleId = role.Id,
                        RoleId = item.RoleId,
                        RoleName = item.RoleName,
                        CreatedDate = DateTime.Now,
                        ModifiedDate = DateTime.Now,
                        CreatedBy = "Admin",
                        ModifiedBy = "Admin",
                        IsAllowed = role.Id == 1 ||
                                    (role.Id == 2 &&
                                        (item.RoleName == "User Profile" ||
                                         item.RoleName == "Leave MGS" ||
                                         item.RoleName == "Dashboard"))
                    };

                    await _functionalRepo.AddManageUserRoleDetailsAsync(details);
                }
            }
        }


        public async Task CreateDefaultSuperAdminAsync()
        {
            try
            {
                ApplicationUser superAdmin = new ApplicationUser();
                superAdmin.Email = _superAdminDefaultOptions.Email;
                superAdmin.UserName = superAdmin.Email;
                superAdmin.EmailConfirmed = true;

                var result = await _userManager.CreateAsync(superAdmin, _superAdminDefaultOptions.Password);

                if (result.Succeeded)
                {
                    var profile = new UserProfile
                    {
                        ApplicationUserId = superAdmin.Id,
                        FirstName = "Super",
                        LastName = "Admin",
                        Email = superAdmin.Email,
                        PhoneNumber = "1234567890",
                        Address = "Kochi,Kerala",
                        Country = "India",
                        ProfilePicture = "",
                        RoleId = 1,
                        Location = null,
                        Site = null,
                        IsApprover = 1,
                        EmployeeId = StaticData.RandomDigits(6),
                        DateOfBirth = DateTime.Now.AddYears(-22),
                        JoiningDate = DateTime.Now.AddYears(-1),
                        LeavingDate = null,
                        Designation = null,
                        Department = null,
                        SubDepartment = null,
                        CreatedDate = DateTime.Now,
                        ModifiedDate = DateTime.Now,
                        CreatedBy = "Admin",
                        ModifiedBy = "Admin"
                    };

                    await _functionalRepo.SaveUserProfileAsync(profile);
                    await _rolesService.AddToRolesAsync(superAdmin);

                }
            }
            catch (Exception ex)
            {
                throw new Exception("Failed to create default super admin", ex);
            }
        }
    }
}
