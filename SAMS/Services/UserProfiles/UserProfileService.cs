using System.Text;
using AutoMapper;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using SAMS.API.UserProfileAPIs.RequestObject;
using SAMS.API.UserProfileAPIs.ResponseObject;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Models.EmailServiceModels;
using SAMS.Services.Account;
using SAMS.Services.Common.Interface;
using SAMS.Services.EmailService.Interface;
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
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;

    public UserProfileService(IUserProfileRepository userProfileRepository,
                                ILogger<AccountRepository> logger,
                                UserManager<ApplicationUser> userManager,
                                SignInManager<ApplicationUser> signInManager,
                                IMapper mapper,
                                IManageUserRolesService manageUserRolesService,
                                IRolesService rolesService,
                                ICommonService commonService,
                                IConfiguration configuration,
                                IEmailService emailService)
    {
        _userProfileRepository = userProfileRepository;
        _logger = logger;
        _userManager = userManager;
        _signInManager = signInManager;
        _mapper = mapper;
        _manageUserRolesService = manageUserRolesService;
        _rolesService = rolesService;
        _commonService = commonService;
        _configuration = configuration;
        _emailService = emailService;
    }


    public async Task<Models.UserProfile> GetProfileData(string email)
    {
        try
        {
            var userEmail = await _userManager.GetUserAsync(_signInManager.Context.User!);
            if (userEmail != null)
                return await _userProfileRepository.GetProfileData(userEmail.Email!);
            return await _userProfileRepository.GetProfileData(email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while retrieving profile details.");
            throw new Exception("An error occurred while retrieving profile details.", ex);
        }
    }

    public async Task<(GetProfileDetailsResponseObject responseObject, bool isSuccess, string message)> GetProfileDetails(string email)
    {
        try
        {
            var user = await _userProfileRepository.GetProfileData(email);
            if (user == null)
            {
                _logger.LogWarning("Profile not found for email: {Email}", email);
                return (null, false, "Profile not found.")!;
            }

            return await _userProfileRepository.GetProfileDetails(email);

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while retrieving profile details.");
            throw new Exception("An error occurred while retrieving profile details.", ex);
        }
    }

    public async Task<(bool Success, string Message)> UpdateProfileAsync(UserProfileRequestObject request, string email)
    {
        try
        {
            var user = await _userProfileRepository.GetProfileData(email);
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
            user.ModifiedDate = DateTime.Now;
            user.ModifiedBy = email;

            var success = await _userProfileRepository.UpdateProfileAsync(user);

            return (success, "Profile updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while updating profile.");
            throw new Exception("An error occurred while updating profile.", ex);
        }

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

                mapedProfile.OrganizationId = await _commonService.GetOrganizationIdAsync(createdby);

                var userCreated = await _userProfileRepository.CreateUserProfileAsync(mapedProfile);

                if (userProfileDto.IsEmailConfirmed == true)
                {
                    IdentityResult _identityResult = null!;
                    ApplicationUser _applicationUser = new ApplicationUser()
                    {
                        UserName = userProfileDto.Email,
                        PhoneNumber = userProfileDto.PhoneNumber,
                        Email = userProfileDto.Email,
                    };
                    var exists = _userManager.Users.Any(u => u.Email == userProfileDto.Email);
                    if (exists)
                    {
                        _logger.LogWarning("User already exists with email: {Email}", userProfileDto.Email);
                    }
                    else
                    {
                        _identityResult = await _userManager.CreateAsync(_applicationUser);

                        if (_identityResult.Succeeded)
                        {
                            _logger.LogInformation("User created successfully with email: {Email}", userProfileDto.Email);

                            // 🔑 Generate confirmation token
                            var token = await _userManager.GenerateEmailConfirmationTokenAsync(_applicationUser);
                            var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

                            // 🔗 Build verification link (Angular route)
                            var verificationLink = $"{_configuration["AppSettings:ClientUrl"]}/user-email-verification?userId={_applicationUser.Id}&token={encodedToken}";

                            // 📧 Send email using your SendMail method
                            var mailSent = await SendMail(_applicationUser.Email!, verificationLink, $"{userProfileDto.FirstName} {userProfileDto.LastName}");

                            if (!mailSent)
                            {
                                _logger.LogWarning("Failed to send verification email to user with email: {Email}", userProfileDto.Email);
                                await _userManager.DeleteAsync(_applicationUser);
                            }
                            else
                            {
                                _logger.LogInformation("Verification email sent successfully to user with email: {Email}", userProfileDto.Email);
                                return (userCreated.isSuccess, $"{userCreated.message}, Mail sended successfully.");
                            }

                        }
                        else
                        {
                            _logger.LogWarning("User creation failed with email: {Email}", userProfileDto.Email);
                            return (userCreated.isSuccess, $"{userCreated.message}, Identity User creation failed.");

                        }
                    }
                }

                return (userCreated.isSuccess, $"{userCreated.message}");
            }
            _logger.LogWarning("User creation limit reached for user: {CreatedBy}", createdby);
            return (false, "You have reached the maximum limit of 100 users.");

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while creating user profile.");
            throw new Exception("An error occurred while creating user profile.", ex);
        }
    }

    private async Task<bool> SendMail(string email, string link, string name)
    {
        var mailRequest = new MailRequest
        {
            Email = email,
            Subject = "Smart Asset Manager - Email Verification",
            Body = GenerateEmailBody(name, link)
        };

        return await _emailService.SendEmail(mailRequest);
    }

    private string GenerateEmailBody(string name, string link)
    {
        string emailBody = $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>SAMS Email Verification</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
            min-height: 100vh;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.2);
            margin-top: 20px;
            margin-bottom: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }}
        .company-name {{
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            letter-spacing: 1px;
        }}
        .tagline {{
            font-size: 14px;
            margin: 8px 0 0 0;
            opacity: 0.9;
            letter-spacing: 0.5px;
        }}
        .content {{
            padding: 40px 30px;
            text-align: center;
        }}
        .welcome-text {{
            font-size: 24px;
            color: #374151;
            margin-bottom: 10px;
            font-weight: 600;
        }}
        .subtitle {{
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.5;
        }}
        .info-box {{
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: left;
        }}
        .info-box-text {{
            color: #1e40af;
            font-size: 15px;
            margin: 0;
            line-height: 1.6;
        }}
        .button-section {{
            background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            border: 2px solid #e9d5ff;
        }}
        .button-label {{
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 20px;
            font-weight: 500;
        }}
        .verify-button {{
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            color: #ffffff !important;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        .verify-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
        }}
        .link-validity {{
            font-size: 14px;
            color: #ef4444;
            margin-top: 20px;
            font-weight: 500;
        }}
        .alternative-link {{
            margin-top: 20px;
            padding: 15px;
            background-color: #f8fafc;
            border-radius: 8px;
            font-size: 13px;
            color: #6b7280;
            word-break: break-all;
        }}
        .alternative-text {{
            margin-bottom: 10px;
            font-weight: 500;
            color: #374151;
        }}
        .instructions {{
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: left;
        }}
        .instructions h3 {{
            color: #374151;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
        }}
        .instructions ul {{
            color: #6b7280;
            padding-left: 20px;
            line-height: 1.6;
        }}
        .instructions li {{
            margin-bottom: 8px;
        }}
        .features {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }}
        .feature {{
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }}
        .feature-icon {{
            font-size: 32px;
            margin-bottom: 10px;
        }}
        .feature-title {{
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 5px;
        }}
        .feature-desc {{
            font-size: 14px;
            color: #6b7280;
            line-height: 1.4;
        }}
        .footer {{
            background-color: #f8fafc;
            padding: 25px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }}
        .footer-text {{
            color: #6b7280;
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
        }}
        .contact-info {{
            margin-top: 15px;
            font-size: 13px;
            color: #9ca3af;
        }}
        .social-links {{
            margin-top: 15px;
        }}
        .social-links a {{
            color: #8b5cf6;
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
        }}
        @media (max-width: 600px) {{
            .email-container {{
                margin: 10px;
                border-radius: 12px;
            }}
            .content {{
                padding: 30px 20px;
            }}
            .features {{
                grid-template-columns: 1fr;
            }}
            .verify-button {{
                padding: 14px 30px;
                font-size: 16px;
            }}
        }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='header'>
            <h1 class='company-name'>Smart Asset Management System</h1>
            <p class='tagline'>Intelligent Asset Tracking & Management</p>
        </div>
        
        <div class='content'>
            <h2 class='welcome-text'>Hello, {name}!</h2>
            <p class='subtitle'>Your account has been created in the Smart Asset Management System. To activate your account and start using SAMS, please verify your email address.</p>
            
            <div class='info-box'>
                <p class='info-box-text'>
                    <strong>👤 Account Created by Administrator</strong><br><br>
                    An administrator has set up your account on SAMS. You need to verify your email address to confirm your identity and gain access to the system.
                </p>
            </div>
            
            <div class='button-section'>
                <p class='button-label'>Click the button below to verify your email address:</p>
                <a href='{link}' class='verify-button'>✓ Verify Email Address</a>
                <p class='link-validity'>⏰ This link expires in 24 hours</p>
                
                <div class='alternative-link'>
                    <div class='alternative-text'>Or copy and paste this link into your browser:</div>
                    <a href='{link}' style='color: #8b5cf6; word-break: break-all;'>{link}</a>
                </div>
            </div>
            
            <div class='instructions'>
                <h3>📋 Next Steps:</h3>
                <ul>
                    <li>Click the verification button above to confirm your email</li>
                    <li>Your account will be activated automatically</li>
                    <li>You'll receive your login credentials separately (if not already provided)</li>
                    <li>Access the SAMS platform and start managing assets</li>
                </ul>
            </div>
            
            <div class='features'>
                <div class='feature'>
                    <div class='feature-icon'>📊</div>
                    <div class='feature-title'>Asset Tracking</div>
                    <div class='feature-desc'>Real-time monitoring of all your valuable assets</div>
                </div>
                <div class='feature'>
                    <div class='feature-icon'>📱</div>
                    <div class='feature-title'>Mobile Ready</div>
                    <div class='feature-desc'>Access your assets from anywhere, anytime</div>
                </div>
                <div class='feature'>
                    <div class='feature-icon'>🔒</div>
                    <div class='feature-title'>Secure</div>
                    <div class='feature-desc'>Enterprise-grade security for your data</div>
                </div>
            </div>
        </div>
        
        <div class='footer'>
            <p class='footer-text'>
                <strong>SAMS Team</strong><br>
                If you did not expect this email or have questions about your account, please contact your system administrator or our support team.
            </p>
            <div class='contact-info'>
                📧 support@sams.com | 📞 +1 (555) 123-4567<br>
                🌐 www.sams.com | 📍 123 Business Ave, Tech City, TC 12345
            </div>
            <div class='social-links'>
                <a href='#'>LinkedIn</a> | 
                <a href='#'>Twitter</a> | 
                <a href='#'>Support</a>
            </div>
        </div>
    </div>
</body>
</html>";

        return emailBody;
    }

    public async Task<(bool Success, string Message, bool isLoginAccess)> UserEmailConfirmAsync(string userId, string token)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return (false, "User not found.", false);

            var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token));
            var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

            if (result.Succeeded)
            {
                _logger.LogInformation("Email confirmed for {Email}", user.Email);
                var userProfile = await _userProfileRepository.GetProfileData(user.Email!);
                if (userProfile == null)
                    return (true, "User profile not found.", false);

                if(userProfile.IsAllowLoginAccess == true && userProfile.ApplicationUserId != null)
                {
                    return (true, "Email confirmed successfully.", true);
                }
                return (true, "Email confirmed successfully.", false);
            }

            return (false, "Email confirmation failed.", false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming email.");
            return (false, "Error confirming email.", false);
        }
    }

    public async Task<IEnumerable<UserProfile>> GetCreatedUsersProfile(string createdBy)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(createdBy);
            var userProfiles = await _userProfileRepository.GetCreatedUsersProfile(emails);
            if (userProfiles == null)
                return Enumerable.Empty<UserProfile>();
            return userProfiles;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while retrieving created users profile.");
            throw new Exception("An error occurred while retrieving created users profile.", ex);
        }
    }


    public async Task<(IEnumerable<GetProfileDetailsResponseObject> responseObject, bool isSuccess, string message)> GetCreatedUserProfilesDetails(string email)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(email);
            var userProfilesDeails = await _userProfileRepository.GetCreatedUserProfilesDetails(emails);
            if (userProfilesDeails.responseObject == null || !userProfilesDeails.responseObject.Any())
            {
                _logger.LogWarning("User profiles not found for email: {Email}", email);
                return (Enumerable.Empty<GetProfileDetailsResponseObject>(), true, "User profiles not found.");
            }

            return (userProfilesDeails.responseObject, true, "User profiles found.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while retrieving created users profile details.");
            throw new Exception("An error occurred while retrieving created users profile details.", ex);
        }
    }

    public async Task<(bool success, string message)> UpdateCreatedUserProfileAsync(UserProfileDto userProfileDto, string modifiedBy)
    {
        try
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(modifiedBy);
            var getUserProfile = await _userProfileRepository.GetUserProfileByProfileId(userProfileDto.UserProfileId, emails);
            if (getUserProfile.user == null)
                return (false, getUserProfile.message);

            var user = await _userManager.FindByEmailAsync(userProfileDto.Email!);
            IdentityResult _identityDeleteResult = null!;
            var existUser = await _userManager.FindByEmailAsync(getUserProfile.user.Email!);
            if(existUser != null && existUser.Email != userProfileDto.Email)
                _identityDeleteResult = await _userManager.DeleteAsync(existUser);

            if (getUserProfile.user.ApplicationUserId != null && getUserProfile.user.Email != userProfileDto.Email)
                return (false, "You have not permission to update this user email.");

            getUserProfile.user.FirstName = userProfileDto.FirstName;
            getUserProfile.user.LastName = userProfileDto.LastName;
            getUserProfile.user.DateOfBirth = userProfileDto.DateOfBirth;
            getUserProfile.user.Designation = userProfileDto.Designation;
            getUserProfile.user.Department = userProfileDto.Department;
            getUserProfile.user.SubDepartment = userProfileDto.SubDepartment;
            getUserProfile.user.Site = userProfileDto.Site;
            getUserProfile.user.Location = userProfileDto.Location;
            getUserProfile.user.RoleId = userProfileDto.RoleId;
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
            if (!userUpdated.success)
            {
                _logger.LogWarning("Failed to update user profile: {UserProfileId}", userProfileDto.UserProfileId);
                return (false, "Failed to update user profile.");
            }

            if (user == null && userProfileDto.IsEmailConfirmed == true)
            {
                IdentityResult _identityResult = null!;
                ApplicationUser _applicationUser = new ApplicationUser()
                {
                    UserName = userProfileDto.Email,
                    PhoneNumber = getUserProfile.user.PhoneNumber,
                    Email = userProfileDto.Email,
                };

                _identityResult = await _userManager.CreateAsync(_applicationUser);
                if (_identityResult.Succeeded)
                {
                    _logger.LogInformation("User created successfully with email: {Email}", userProfileDto.Email);

                    // 🔑 Generate confirmation token
                    var token = await _userManager.GenerateEmailConfirmationTokenAsync(_applicationUser);
                    var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

                    // 🔗 Build verification link (Angular route)
                    var verificationLink = $"{_configuration["AppSettings:ClientUrl"]}/user-email-verification?userId={_applicationUser.Id}&token={encodedToken}";

                    // 📧 Send email using your SendMail method
                    var mailSent = await SendMail(_applicationUser.Email!, verificationLink, $"{userProfileDto.FirstName} {userProfileDto.LastName}");

                    if (!mailSent)
                    {
                        _logger.LogWarning("Failed to send verification email to user with email: {Email}", userProfileDto.Email);
                        return (false, "Failed to send verification email to user.");
                    }
                    _logger.LogInformation("Verification email sent to user with email: {Email}", userProfileDto.Email);
                }
                else
                {
                    _logger.LogWarning("Failed to create user with email: {Email}", userProfileDto.Email);
                    return (false, "Failed to create application user.");
                }
            }
            return (userUpdated.success, $"{userUpdated.message}, Email sent to: {userProfileDto.Email}, successfully.");
        }
        catch (Exception ex)
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
            if (getUserProfile.user == null)
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
        catch (Exception ex)
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
            if (getUserProfile.user == null)
                return (false, getUserProfile.message);

            var roleExists = await _manageUserRolesService.GetUserRoleByIdAsync(Convert.ToInt32(loginAccessRequestObject.RoleId), createdBy);
            if (roleExists == null || roleExists.Id != loginAccessRequestObject.RoleId)
                return (false, "Role does not exist.");

            if (!loginAccessRequestObject.IsPasswordCreated && string.IsNullOrEmpty(loginAccessRequestObject.Password) && string.IsNullOrEmpty(loginAccessRequestObject.ConfirmPassword))
            {
                var exists = _userManager.Users.Any(u => u.Email == loginAccessRequestObject.Email);
                if (!exists)
                {
                    IdentityResult _identityResult = null!;
                    ApplicationUser _applicationUser = new ApplicationUser()
                    {
                        UserName = loginAccessRequestObject.Email,
                        PhoneNumber = getUserProfile.user.PhoneNumber,
                        Email = loginAccessRequestObject.Email,
                    };

                    _identityResult = await _userManager.CreateAsync(_applicationUser);
                    if (!_identityResult.Succeeded)
                    {
                        _logger.LogWarning("Failed to create Identity user with email: {Email}", loginAccessRequestObject.Email);
                        return (false, "Failed to create Identity user with email: " + _identityResult.Errors.FirstOrDefault()?.Description);
                    }
                }

                long? roleId = getUserProfile.user.RoleId;
                getUserProfile.user.ApplicationUserId = _userManager.Users.FirstOrDefault(u => u.Email == loginAccessRequestObject.Email)?.Id;
                getUserProfile.user.RoleId = roleExists.Id;
                getUserProfile.user.ModifiedBy = createdBy;
                getUserProfile.user.ModifiedDate = DateTime.Now;
                getUserProfile.user.IsAllowLoginAccess = loginAccessRequestObject.IsAllowLoginAccess;
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
                        ApplicationUserId = _userManager.Users.FirstOrDefault(u => u.Email == loginAccessRequestObject.Email)?.Id!,
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
            else if (loginAccessRequestObject.IsPasswordCreated && !string.IsNullOrEmpty(loginAccessRequestObject.Password) && !string.IsNullOrEmpty(loginAccessRequestObject.ConfirmPassword))
            {
                IdentityResult _identityResult = null!;
                ApplicationUser _applicationUser = new ApplicationUser()
                {
                    UserName = loginAccessRequestObject.Email,
                    PhoneNumber = getUserProfile.user.PhoneNumber,
                    Email = loginAccessRequestObject.Email,
                };
                if (loginAccessRequestObject.Password.Equals(loginAccessRequestObject.ConfirmPassword))
                {
                    var existingUser = await _userManager.FindByEmailAsync(loginAccessRequestObject.Email!);
                    if (existingUser != null)
                    {
                        _logger.LogWarning("User already exists with email: {Email}", loginAccessRequestObject.Email);

                        _identityResult = await _userManager.AddPasswordAsync(existingUser, loginAccessRequestObject.Password);
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
                    getUserProfile.user.IsAllowLoginAccess = loginAccessRequestObject.IsAllowLoginAccess;
                    var userUpdated = await _userProfileRepository.UpdateUserProfileAsync(getUserProfile.user);
                    if (!userUpdated.success)
                    {
                        _logger.LogWarning("Failed to update user profile: {UserProfileId}", loginAccessRequestObject.UserProfileId);
                        return (userUpdated.success, $"{userUpdated.message}, user roles not allowed.");
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
                            return (roleUpdateResult.isSuccess, $"{roleUpdateResult.message}, error in updating user roles.");
                        }

                        _logger.LogInformation("User login access allowed for user: {UserProfileId}", loginAccessRequestObject.UserProfileId);
                        return (true, "User login access allowed successfully." + roleUpdateResult.message);
                    }
                }
                else
                {
                    foreach (var error in _identityResult.Errors)
                    {
                        _logger.LogWarning("Failed to create user profile: {UserProfileId}", loginAccessRequestObject.UserProfileId);
                        return (false, "Failed to create user profile: " + error.Description);
                    }
                }
            }
            else
            {
                _logger.LogWarning("User login access denied for user: {UserProfileId}", loginAccessRequestObject.UserProfileId);
                return (false, "User login access denied successfully.");
            }
            
            return (true, "User login access allowed successfully.");

        }
        catch (Exception ex)
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
                    if (accessRequestObject.Password!.Equals(accessRequestObject.ConfirmPassword))
                    {
                        var exists = _userManager.Users.Any(u => u.Email == accessRequestObject.Email);
                        if (exists)
                        {
                            var user = await _userManager.FindByEmailAsync(getUserProfile.user.Email!);
                            _identityResult = await _userManager.ChangePasswordAsync(user!, accessRequestObject.OldPassword, accessRequestObject.Password);
                        }
                    }

                }

                if (getUserProfile.user.RoleId != accessRequestObject.RoleId)
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
        catch (Exception ex)
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

            if (getUserProfile.user.RoleId != null && getUserProfile.user.ApplicationUserId != null)
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
                    getUserProfile.user.IsAllowLoginAccess = false;
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
        catch (Exception ex)
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
            if (roleIdUsedUsers == null && roleIdUsedUsers.Count() == 0)
                return (null!, false, "User profiles not found.");

            return (roleIdUsedUsers, true, "User profiles used in role.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while getting user profiles used in role.");
            throw new Exception("An error occurred while getting user profiles used in role.", ex);
        }
    }
}
