using AutoMapper;
using Microsoft.AspNetCore.Identity;
using SAMS.API.UserProfileAPIs.RequestObject;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.Account;
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

    public UserProfileService(IUserProfileRepository userProfileRepository, 
                                ILogger<AccountRepository> logger,
                                UserManager<ApplicationUser> userManager,
                                SignInManager<ApplicationUser> signInManager,
                                IMapper mapper,
                                IManageUserRolesService manageUserRolesService,
                                IRolesService rolesService)
    {
        _userProfileRepository = userProfileRepository;
        _logger = logger;
        _userManager = userManager;
        _signInManager = signInManager;
        _mapper = mapper;
        _manageUserRolesService = manageUserRolesService;
        _rolesService = rolesService;
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
            int createdUsersCount = Convert.ToInt32(await _userProfileRepository.GetCreatedUsersCount(createdby));
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
            var userProfiles = await _userProfileRepository.GetCreatedUsersProfile(createdBy);
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
            var getUserProfile = await _userProfileRepository.GetUserProfileByProfileId(userProfileDto.UserProfileId, modifiedBy);
            if(getUserProfile.user == null)
                return (false, getUserProfile.message);

            if(getUserProfile.user.ApplicationUserId is not null && getUserProfile.user.Email != userProfileDto.Email)
                return(false, "You hvae not permission to update this user email.");

            var mappedProfile = _mapper.Map<UserProfile>(userProfileDto);
            mappedProfile.CreatedBy = getUserProfile.user.CreatedBy;
            mappedProfile.CreatedDate = getUserProfile.user.CreatedDate;
            mappedProfile.ModifiedBy = modifiedBy;
            mappedProfile.ModifiedDate = DateTime.Now;
            mappedProfile.EmployeeId = getUserProfile.user.EmployeeId;
            mappedProfile.ApplicationUserId = getUserProfile.user.ApplicationUserId;

            var userUpdated = await _userProfileRepository.UpdateUserProfileAsync(mappedProfile);
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

    public async Task<(bool Success, string Message)> AllowLoginAccessForCreatedUserAsync(LoginAccessRequestObject loginAccessRequestObject, string modifiedBy)
    {
        try
        {
            var getUserProfile = await _userProfileRepository.GetUserProfileByProfileId(loginAccessRequestObject.UserProfileId, modifiedBy);
            if(getUserProfile.user == null)
                return (false, getUserProfile.message);

            if(getUserProfile.user.ApplicationUserId is null && getUserProfile.user.Email == loginAccessRequestObject.Email)
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
                    _identityResult = await _userManager.CreateAsync(_applicationUser, loginAccessRequestObject.Password);
                }

                long? roleId = getUserProfile.user.RoleId;
                getUserProfile.user.ApplicationUserId = _applicationUser.Id;
                getUserProfile.user.ModifiedBy = modifiedBy;
                getUserProfile.user.ModifiedDate = DateTime.Now;
                getUserProfile.user.RoleId = loginAccessRequestObject.RoleId;
                getUserProfile.user.Email = _applicationUser.Email;

                var userUpdated = await _userProfileRepository.UpdateUserProfileAsync(getUserProfile.user);
                if (!userUpdated.success)
                {
                    _logger.LogWarning("Failed to update user profile: {UserProfileId}", loginAccessRequestObject.UserProfileId);
                    return (userUpdated.success, userUpdated.message);
                }

                if(roleId != loginAccessRequestObject.RoleId)
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
            else if(getUserProfile.user.ApplicationUserId is not null && getUserProfile.user.Email != loginAccessRequestObject.Email)
            {
                _logger.LogWarning("You hvae not permission to update this user email.");
                return (false, "You hvae not permission to update this user email.");
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
}
