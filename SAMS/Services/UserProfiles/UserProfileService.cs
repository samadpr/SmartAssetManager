using AutoMapper;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using SAMS.API.UserProfileAPIs.RequestObject;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.Account;
using SAMS.Services.Common.Interface;
using SAMS.Services.ManageUserRoles.DTOs;
using SAMS.Services.ManageUserRoles.Interface;
using SAMS.Services.Profile.Interface;
using SAMS.Services.Roles.Interface;
using SAMS.Services.UserProfiles.DTOs;

namespace SAMS.Services.Profile;

public class UserProfileService : IUserProfileService
{
    private readonly IUserProfileRepository _userProfileRepository;
    private readonly ILogger<AccountRepository> _logger;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IMapper _mapper;
    private readonly IManageUserRolesService _manageUserRolesService;
    private readonly IRolesService _rolesService;
    private readonly ICommonService _commonService;

    public UserProfileService(IUserProfileRepository userProfileRepository, 
                                ILogger<AccountRepository> logger,
                                UserManager<ApplicationUser> userManager,
                                SignInManager<ApplicationUser> signInManager,
                                IMapper mapper,
                                IManageUserRolesService manageUserRolesService,
                                IRolesService rolesService,
                                ICommonService commonService)
    {
        _userProfileRepository = userProfileRepository;
        _logger = logger;
        _userManager = userManager;
        _signInManager = signInManager;
        _mapper = mapper;
        _manageUserRolesService = manageUserRolesService;
        _rolesService = rolesService;
        _commonService = commonService;
    }


    public async Task<Models.UserProfile> GetProfileDetails()
    {
        try
        {
            var userEmail =  await _userManager.GetUserAsync(_signInManager.Context.User!);
            return await _userProfileRepository.GetProfileDetails(userEmail.Email);
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "An error occurred while retrieving profile details.");
            throw new Exception("An error occurred while retrieving profile details.", ex);
        }
    }

    public async Task<(bool Success, string Message)> UpdateProfileAsync(UserProfileRequestObject request)
    {
        var userEmail = await _userManager.GetUserAsync(_signInManager.Context.User!);
        var user = await _userProfileRepository.GetProfileDetails(userEmail.Email);
        if (user == null) 
            throw new Exception("Profile not found."); 

        if (user.Email != request.Email)
            return (false, "Email cannot be changed. you can only update your profile.");

        // Update properties
        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.PhoneNumber = request.PhoneNumber;
        user.DateOfBirth = request.DateOfBirth;
        user.Address = request.Address;
        user.Country = request.Country;
        user.JoiningDate = request.JoiningDate;
        user.LeavingDate = request.LeavingDate;
        user.Designation = request.Designation;
        user.Department = request.Department;
        user.SubDepartment = request.SubDepartment;
        user.Location = request.Location;
        user.Site = request.Site;
        user.ProfilePicture = request.ProfilePicture;

        var success = await _userProfileRepository.UpdateProfileAsync(user);

        return (success, "Profile updated successfully.");
    }

    public async Task<(bool Success, string Message)> CreateUserProfileAsync(UserProfileDto userProfileDto, string createdby)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(createdby);

            int createdUsersCount = Convert.ToInt32(await _userProfileRepository.GetCreatedUsersCount(emails));
            if (createdUsersCount < 100)
            {
                userProfileDto.CreatedBy = createdby;
                userProfileDto.CreatedDate = DateTime.Now;
                userProfileDto.ModifiedBy = createdby;
                userProfileDto.ModifiedDate = DateTime.Now;
                userProfileDto.EmployeeId = "EMP-" + StaticData.RandomDigits(6);

                var mapedProfile = _mapper.Map<UserProfile>(userProfileDto);

                var userCreated = await _userProfileRepository.CreateUserProfileAsync(mapedProfile);
                return (userCreated.isSuccess, userCreated.message);
            }
            _logger.LogWarning("User creation limit reached for user: {CreatedBy}", createdby);
            return (false, "You have reached the maximum limit of 100 users.");

        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "An error occurred while creating user profile.");
            throw new Exception("An error occurred while creating user profile.", ex);
        }
    }

    public async Task<IEnumerable<UserProfile>> GetCreatedUsersProfile(string createdBy)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(createdBy);
            var userProfiles = await _userProfileRepository.GetCreatedUsersProfile(emails);
            if(userProfiles == null)
                return Enumerable.Empty<UserProfile>();
            return userProfiles;
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "An error occurred while retrieving created users profile.");
            throw new Exception("An error occurred while retrieving created users profile.", ex);
        }
    }

    public async Task<(bool success, string message)> UpdateCreatedUserProfileAsync(UserProfileDto userProfileDto, string modifiedBy)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(modifiedBy);
            var getUserProfile = await _userProfileRepository.GetUserProfileByProfileId(userProfileDto.UserProfileId, emails);
            if(getUserProfile.user == null)
                return (false, getUserProfile.message);

            if(getUserProfile.user.ApplicationUserId != null && getUserProfile.user.Email != userProfileDto.Email)
                return(false, "You hvae not permission to update this user email.");

            getUserProfile.user.FirstName = userProfileDto.FirstName;
            getUserProfile.user.LastName = userProfileDto.LastName;
            getUserProfile.user.DateOfBirth = userProfileDto.DateOfBirth;
            getUserProfile.user.Designation = userProfileDto.Designation;
            getUserProfile.user.Department = userProfileDto.Department;
            getUserProfile.user.SubDepartment = userProfileDto.SubDepartment;
            getUserProfile.user.Site = userProfileDto.Site;
            getUserProfile.user.Location = userProfileDto.Location;
            getUserProfile.user.JoiningDate = userProfileDto.JoiningDate;
            getUserProfile.user.LeavingDate = userProfileDto.LeavingDate;
            getUserProfile.user.PhoneNumber = userProfileDto.PhoneNumber;
            getUserProfile.user.Email = userProfileDto.Email;
            getUserProfile.user.Address = userProfileDto.Address;
            getUserProfile.user.Country = userProfileDto.Country;
            getUserProfile.user.ProfilePicture = userProfileDto.ProfilePicture;
            getUserProfile.user.ModifiedBy = modifiedBy;
            getUserProfile.user.ModifiedDate = DateTime.Now;

            /*//var mappedProfile = _mapper.Map<UserProfile>(userProfileDto);
            //mappedProfile.CreatedBy = getUserProfile.user.CreatedBy;
            //mappedProfile.CreatedDate = getUserProfile.user.CreatedDate;
            //mappedProfile.ModifiedBy = modifiedBy;
            //mappedProfile.ModifiedDate = DateTime.Now;
            //mappedProfile.EmployeeId = getUserProfile.user.EmployeeId;
            //mappedProfile.ApplicationUserId = getUserProfile.user.ApplicationUserId;*/

            var userUpdated = await _userProfileRepository.UpdateUserProfileAsync(getUserProfile.user);
            if(!userUpdated.success)
            {
                _logger.LogWarning("Failed to update user profile: {UserProfileId}", userProfileDto.UserProfileId);
            }
            return (userUpdated.success, userUpdated.message);
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "An error occurred while updating created user profile.");
            throw new Exception("An error occurred while updating created user profile.", ex);
        }
    }

    public async Task<(bool success, string message)> DeleteCreatedUserProfile(long id, string modifiedBy)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(modifiedBy);
            var getUserProfile = await _userProfileRepository.GetUserProfileByProfileId(id, emails);
            if(getUserProfile.user == null)
                return (false, getUserProfile.message);
            if (getUserProfile.user.ApplicationUserId != null && getUserProfile.user.RoleId != null)
            {
                IdentityResult _identityResult = null!;
                var user = await _userManager.FindByIdAsync(getUserProfile.user.ApplicationUserId);
                if (user != null)
                    _identityResult = await _userManager.DeleteAsync(user);

                if (_identityResult.Succeeded)
                {
                    getUserProfile.user.ApplicationUserId = null;
                    getUserProfile.user.RoleId = null;
                    getUserProfile.user.ModifiedBy = modifiedBy;
                    getUserProfile.user.ModifiedDate = DateTime.Now;
                    getUserProfile.user.Cancelled = true;

                    var userUpdated = await _userProfileRepository.UpdateUserProfileAsync(getUserProfile.user);
                    if (!userUpdated.success)
                    {
                        _logger.LogWarning("Failed to update user profile: {UserProfileId}", id);
                        return (userUpdated.success, userUpdated.message);
                    }
                    return (userUpdated.success, userUpdated.message);
                }
                else
                {
                    _logger.LogWarning("Failed to delete user profile: {UserProfileId}", id);
                    return (false, "Failed to delete user profile: " + _identityResult.Errors.FirstOrDefault()?.Description);
                }
            }
            else
            {
                getUserProfile.user.Cancelled = true;
                getUserProfile.user.ModifiedBy = modifiedBy;
                getUserProfile.user.ModifiedDate = DateTime.Now;
                var userDeleted = await _userProfileRepository.UpdateUserProfileAsync(getUserProfile.user);
                if (!userDeleted.success)
                {
                    _logger.LogWarning("Failed to delete user profile: {UserProfileId}", id);
                    return (userDeleted.success, userDeleted.message);
                }
                return (userDeleted.success, userDeleted.message);
            }
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "An error occurred while deleting created user profile.");
            throw new Exception("An error occurred while deleting created user profile.", ex);
        }
    }

    public async Task<(bool Success, string Message)> AllowLoginAccessForCreatedUserAsync(LoginAccessRequestObject loginAccessRequestObject, string createdBy)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(createdBy);

            var getUserProfile = await _userProfileRepository.GetUserProfileByProfileId(loginAccessRequestObject.UserProfileId, emails);
            if(getUserProfile.user == null)
                return (false, getUserProfile.message);

            var roleExists = await _manageUserRolesService.GetUserRoleByIdAsync(Convert.ToInt32(loginAccessRequestObject.RoleId), createdBy);
            if(roleExists == null || roleExists.Id != loginAccessRequestObject.RoleId)
                return (false, "Role does not exist.");

            if(getUserProfile.user.ApplicationUserId is null && getUserProfile.user.Email == loginAccessRequestObject.Email && loginAccessRequestObject.UserProfileId > 0 && roleExists.Id == loginAccessRequestObject.RoleId)
            {
                IdentityResult _identityResult = null!;
                ApplicationUser _applicationUser = new ApplicationUser()
                {
                    UserName = loginAccessRequestObject.Email,
                    PhoneNumber = getUserProfile.user.PhoneNumber,
                    Email = loginAccessRequestObject.Email,
                    EmailConfirmed = true,
                };
                if (loginAccessRequestObject.Password.Equals(loginAccessRequestObject.ConfirmPassword))
                {
                    var exists = _userManager.Users.Any(u => u.Email == loginAccessRequestObject.Email);
                    if (exists)
                    {
                        _logger.LogWarning("User already exists with email: {Email}", loginAccessRequestObject.Email);
                    }
                    else
                    {
                        _identityResult = await _userManager.CreateAsync(_applicationUser, loginAccessRequestObject.Password);
                    }
                }

                if (_identityResult.Succeeded)
                {
                    long? roleId = getUserProfile.user.RoleId;
                    getUserProfile.user.ApplicationUserId = _applicationUser.Id;
                    getUserProfile.user.ModifiedBy = createdBy;
                    getUserProfile.user.ModifiedDate = DateTime.Now;
                    getUserProfile.user.RoleId = loginAccessRequestObject.RoleId;
                    getUserProfile.user.Email = _applicationUser.Email;

                    var userUpdated = await _userProfileRepository.UpdateUserProfileAsync(getUserProfile.user);
                    if (!userUpdated.success)
                    {
                        _logger.LogWarning("Failed to update user profile: {UserProfileId}", loginAccessRequestObject.UserProfileId);
                        return (userUpdated.success, userUpdated.message);
                    }

                    if (roleId != loginAccessRequestObject.RoleId)
                    {
                        var manageUserRoleDetails = await _manageUserRolesService.GetUserRoleByIdWithRoleDetailsAsync(loginAccessRequestObject.RoleId);
                        ManageUserRolesDto manageUserRolesDto = new ManageUserRolesDto()
                        {
                            ApplicationUserId = _applicationUser.Id,
                            RolePermissions = manageUserRoleDetails.RolePermissions
                        };
                        var roleUpdateResult = await _rolesService.UpdateUserRoles(manageUserRolesDto);
                        if (!roleUpdateResult.isSuccess)
                        {
                            _logger.LogWarning("Failed to update user roles: {UserProfileId}", loginAccessRequestObject.UserProfileId);
                            return (roleUpdateResult.isSuccess, roleUpdateResult.message);
                        }

                        _logger.LogInformation("User login access allowed for user: {UserProfileId}", loginAccessRequestObject.UserProfileId);
                        return (true, "User login access allowed successfully." + roleUpdateResult.message);
                    }
                }
                else
                {
                    foreach(var error in _identityResult.Errors)
                    {
                        _logger.LogWarning("Failed to create user profile: {UserProfileId}", loginAccessRequestObject.UserProfileId);
                        return (false, "Failed to create user profile: " + error.Description);
                    }
                }
            }
            else if(getUserProfile.user.ApplicationUserId is not null && getUserProfile.user.Email == loginAccessRequestObject.Email)
            {
                _logger.LogWarning("You hvae not permission to update this user email.");
                return (false, "You hvae not permission to update this user email.");
            }
            else
            {
                _logger.LogWarning("User already exists with email: {Email}", loginAccessRequestObject.Email);
                return (false, "User already exists with email: " + loginAccessRequestObject.Email);
            }
            _logger.LogInformation("User login access allowed for user: {UserProfileId}", loginAccessRequestObject.UserProfileId);
            return (true, "User login access allowed successfully.");
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "An error occurred while allowing login access for created user.");
            throw new Exception("An error occurred while allowing login access for created user.", ex);
        }
    }

    public async Task<(bool Success, string Message)> UpdateLoginAccessForCreatedUserAsync(UpdateLoginAccessRequestObject accessRequestObject, string modifiedBy)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(modifiedBy);

            var getUserProfile = await _userProfileRepository.GetUserProfileByProfileId(accessRequestObject.UserProfileId, emails);
            if (getUserProfile.user == null)
                return (false, getUserProfile.message);

            if (getUserProfile.user.ApplicationUserId is not null && getUserProfile.user.Email == accessRequestObject.Email)
            {
                IdentityResult _identityResult = null!;
                if (accessRequestObject.OldPassword != null)
                {
                    if(accessRequestObject.Password!.Equals(accessRequestObject.ConfirmPassword))
                    {
                        var exists = _userManager.Users.Any(u => u.Email == accessRequestObject.Email);
                        if (exists)
                        {
                            var user = await _userManager.FindByEmailAsync(getUserProfile.user.Email!);
                            _identityResult = await _userManager.ChangePasswordAsync(user!, accessRequestObject.OldPassword, accessRequestObject.Password);
                        }
                    }
                    
                }

                if(getUserProfile.user.RoleId != accessRequestObject.RoleId)
                {
                    long? roleId = getUserProfile.user.RoleId;
                    getUserProfile.user.ModifiedBy = modifiedBy;
                    getUserProfile.user.ModifiedDate = DateTime.Now;
                    getUserProfile.user.RoleId = accessRequestObject.RoleId;

                    var userUpdated = await _userProfileRepository.UpdateUserProfileAsync(getUserProfile.user);
                    if (!userUpdated.success)
                    {
                        _logger.LogWarning("Failed to update user profile: {UserProfileId}", accessRequestObject.UserProfileId);
                        return (userUpdated.success, userUpdated.message);
                    }

                    var manageUserRoleDetails = await _manageUserRolesService.GetUserRoleByIdWithRoleDetailsAsync(accessRequestObject.RoleId);
                    ManageUserRolesDto manageUserRolesDto = new ManageUserRolesDto()
                    {
                        ApplicationUserId = getUserProfile.user.ApplicationUserId,
                        RolePermissions = manageUserRoleDetails.RolePermissions
                    };
                    var roleUpdateResult = await _rolesService.UpdateUserRoles(manageUserRolesDto);
                    if (!roleUpdateResult.isSuccess)
                    {
                        _logger.LogWarning("Failed to update user roles: {UserProfileId}", accessRequestObject.UserProfileId);
                        return (roleUpdateResult.isSuccess, roleUpdateResult.message);
                    }

                    _logger.LogInformation("User login access updated for user: {UserProfileId}", accessRequestObject.UserProfileId);
                    return (true, "User login access updated successfully." + roleUpdateResult.message);
                }

                _logger.LogInformation("You not Updated login access for user: {UserProfileId}", accessRequestObject.UserProfileId);
                return (true, "You are not Updated any datas.");
            }
            else
            {
                _logger.LogWarning("You hvae not permission to update this user email.");
                return (false, "You hvae not permission to update this user email.");
            }
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "An error occurred while updating login access for created user.");
            throw new Exception("An error occurred while updating login access for created user.", ex);
        }
    }

    public async Task<(bool Success, string Message)> RevokeLoginAccessForCreatedUserProfile(long id, string modifiedBy)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(modifiedBy);

            var getUserProfile = await _userProfileRepository.GetUserProfileByProfileId(id, emails);
            if (getUserProfile.user == null)
                return (false, getUserProfile.message);

            if(getUserProfile.user.RoleId != null && getUserProfile.user.ApplicationUserId != null)
            {
                IdentityResult _identityResult = null!;
                var user = await _userManager.FindByIdAsync(getUserProfile.user.ApplicationUserId);
                if (user != null)
                     _identityResult = await _userManager.DeleteAsync(user);

                if (_identityResult.Succeeded)
                {
                    getUserProfile.user.ApplicationUserId = null;
                    getUserProfile.user.RoleId = null;
                    getUserProfile.user.ModifiedBy = modifiedBy;
                    getUserProfile.user.ModifiedDate = DateTime.Now;

                    var userUpdated = await _userProfileRepository.UpdateUserProfileAsync(getUserProfile.user);
                    if (!userUpdated.success)
                    {
                        _logger.LogWarning("Failed to update user profile: {UserProfileId}", id);
                        return (userUpdated.success, userUpdated.message);
                    }
                }

                _logger.LogInformation("User login access revoked for user: {UserProfileId}", id);
                return (true, "User login access revoked successfully.");
            }
            else
            {
                _logger.LogWarning("You hvae not permission to revoke this user login access.");
                return (false, "You hvae not permission to revoke this user login access.");
            }
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "An error occurred while revoking login access for created user.");
            throw new Exception("An error occurred while revoking login access for created user.", ex);
        }
    }

    public async Task<(IEnumerable<UserProfile> UserProfiles, bool Success, string Message)> GetUserProfilesUsedInRoleId(long roleId, string user)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(user);

            var roleIdUsedUsers = await _rolesService.GetUsersUsedByRoleIdAsync(roleId, emails);
            if(roleIdUsedUsers == null && roleIdUsedUsers.Count() == 0)
                return (null!, false, "User profiles not found.");

            return (roleIdUsedUsers, true, "User profiles used in role.");
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "An error occurred while getting user profiles used in role.");
            throw new Exception("An error occurred while getting user profiles used in role.", ex);
        }
    }
}
