using Microsoft.AspNetCore.Identity;
using SAMS.API.UserProfileAPIs.RequestObject;
using SAMS.Models;
using SAMS.Services.Account;
using SAMS.Services.Profile.Interface;

namespace SAMS.Services.Profile;

public class UserProfileService : IUserProfileService
{
    private readonly IUserProfileRepository _userProfileRepository;
    private readonly ILogger<AccountRepository> _logger;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;

    public UserProfileService(IUserProfileRepository userProfileRepository, 
                                ILogger<AccountRepository> logger,
                                UserManager<ApplicationUser> userManager,
                                SignInManager<ApplicationUser> signInManager)
    {
        _userProfileRepository = userProfileRepository;
        _logger = logger;
        _userManager = userManager;
        _signInManager = signInManager;
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

    public async Task<(bool Success, string Message)> UpdateUserProfileAsync(UpdateUPRequestObject request)
    {
        var userEmail = await _userManager.GetUserAsync(_signInManager.Context.User!);
        var user = await _userProfileRepository.GetProfileDetails(userEmail.Email);
        if (user == null) 
            throw new Exception("User profile not found."); 

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

        var success = await _userProfileRepository.UpdateUserProfileAsync(user);

        return (success, "Profile updated successfully.");
    }
}
