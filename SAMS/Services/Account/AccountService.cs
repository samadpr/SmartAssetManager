using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Models.EmailServiceModels;
using SAMS.Services.Account.DTOs;
using SAMS.Services.Account.Interface;
using SAMS.Services.Common.Interface;
using SAMS.Services.Company.Interface;
using SAMS.Services.EmailService.Interface;
using SAMS.Services.Roles.Interface;
using SAMS.Services.Roles.PagesModel;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using static Org.BouncyCastle.Crypto.Engines.SM2Engine;

namespace SAMS.Services.Account
{
    public class AccountService : IAccountService
    {
        private readonly IAccountRepository _accountRepository;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<AccountService> _logger;
        private readonly ICommonService _commonService;
        private readonly IConfiguration _configuration;
        private readonly IRolesService _roleService;
        private readonly IEmailService _emailService;
        private readonly ICompanyService _companyService;

        public AccountService(IAccountRepository accountRepository,
                                 UserManager<ApplicationUser> userManager,
                                 SignInManager<ApplicationUser> signInManager,
                                 RoleManager<IdentityRole> roleManager,
                                 ILogger<AccountService> logger,
                                 ICommonService commonService,
                                 IConfiguration configuration,
                                 IRolesService roleService,
                                 IEmailService emailService,
                                 ICompanyService companyService)
        {
            _accountRepository = accountRepository;
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _logger = logger;
            _commonService = commonService;
            _configuration = configuration;
            _roleService = roleService;
            _emailService = emailService;
            _companyService = companyService;
        }

        public async Task<LoginResponseDto> LoginAsync(LoginRequestDto loginRequestDto)
        {
            try
            {
                var loginResponseDto = new LoginResponseDto();

                var result = await _signInManager.PasswordSignInAsync(loginRequestDto.Email, loginRequestDto.Password, loginRequestDto.RememberMe, lockoutOnFailure: true );
                var user = await _userManager.FindByEmailAsync(loginRequestDto.Email);

                var loginHistory = new LoginHistory
                {
                    UserName = loginRequestDto.Email,
                    Latitude = loginRequestDto.Latitude,
                    Longitude = loginRequestDto.Longitude,
                    PublicIp = loginRequestDto.PublicIp,
                    Browser = loginRequestDto.Browser,
                    OperatingSystem = loginRequestDto.OperatingSystem,
                    Device = loginRequestDto.Device,
                    Action = "Login"
                };
                await InsertLoginHistory(true, result.Succeeded, loginHistory);

                if (user == null)
                {
                    _logger.LogWarning("User {Email} not found.", loginRequestDto.Email);
                    return new LoginResponseDto
                    {
                        IsAuthenticated = false,
                        Message = "User not found."
                    };
                }

                if (!user.EmailConfirmed)
                {
                    _logger.LogWarning("User {Email} is not confirmed.", loginRequestDto.Email);
                    return new LoginResponseDto
                    {
                        IsAuthenticated = false,
                        Message = "Email not verified."
                    };
                }

                if (!result.Succeeded)
                {
                    _logger.LogWarning("User {Email} failed to log in.", loginRequestDto.Email);
                    return new LoginResponseDto
                    {
                        IsAuthenticated = false,
                        Message = "Login failed due to invalid credentials."
                    };
                }

                var tokenResponse = await GenerateJwtToken(loginRequestDto);
                if (string.IsNullOrEmpty(tokenResponse.Token))
                {
                    _logger.LogWarning("Failed to generate token for user {Email}.", loginRequestDto.Email);
                    return new LoginResponseDto
                    {
                        IsAuthenticated = false,
                        Message = "Failed to generate token."
                    };
                }

                var userDetails = await _accountRepository.GetUserProfileByApplicationUserId(user.Id);
                tokenResponse.FullName = $"{userDetails?.FirstName} {userDetails?.LastName}";
                tokenResponse.CreatedBy = userDetails?.CreatedBy;

                _logger.LogInformation("User {Email} logged in successfully.", loginRequestDto.Email);
                tokenResponse.IsAuthenticated = true;
                tokenResponse.Message = "Login successful.";
                return tokenResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while logging in user.");
                throw;
            }
        }

        public async Task<(bool isSuccess, string message)> RegisterAsync(RegisterRequestDto requestDto)
        {
            try
            {
                var user = new ApplicationUser
                {
                    UserName = requestDto.Email,
                    Email = requestDto.Email,
                    PhoneNumber = requestDto.PhoneNumber
                };

                var result = await _userManager.CreateAsync(user, requestDto.Password);
                if (!result.Succeeded)
                {
                    string error = result.Errors.Skip(1).FirstOrDefault()?.Description
                                    ?? result.Errors.FirstOrDefault()?.Description
                                    ?? "User registration failed.";
                    _logger.LogWarning("User registration failed: {Error}", error);
                    return (false, error);
                }
                //create company initial
                Guid OrganizationId = Guid.NewGuid();
                var company = new CompanyInfo
                {
                    OrganizationId = OrganizationId,
                };
                var companyResult = await _companyService.AddCompanyAsync(company, requestDto.Email);
                if (!companyResult.isSuccess)
                {
                    string error = "User registration failed.";
                    _logger.LogWarning("User registration failed: {Error}", error);
                    return (false, error);
                }

                // Create UserProfile
                var profile = new UserProfile
                {
                    ApplicationUserId = user.Id,
                    FirstName = requestDto.FirstName,
                    LastName = requestDto.LastName,
                    PhoneNumber = requestDto.PhoneNumber,
                    Email = requestDto.Email,
                    Address = requestDto.Address,
                    Country = requestDto.Country,
                    ProfilePicture = "",
                    IsAllowLoginAccess = true,
                    RoleId = 2,
                    EmployeeId = "GA-" + StaticData.RandomDigits(6),
                    CreatedDate = DateTime.Now,
                    ModifiedDate = DateTime.Now,
                    CreatedBy = "Admin",
                    ModifiedBy = requestDto.Email,
                    OrganizationId = OrganizationId
                };

                await _accountRepository.AddUserProfile(profile);
                _logger.LogInformation("User created a new account with password.");

                // Assign default roles
                //await _userManager.AddToRoleAsync(user, RoleModels.Dashboard);
                //await _userManager.AddToRoleAsync(user, RoleModels.UserProfile);
                await _roleService.AddToRolesAsync(user);
                _logger.LogInformation("User assigned default roles.");

                var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                bool isSent = await SendOtpMail(requestDto.Email, code, requestDto.FirstName+" "+requestDto.LastName);
                if (!isSent) 
                    return (false, "Failed to send OTP to user.");
                _logger.LogInformation("OTP sent to user.");

                //await _signInManager.SignInAsync(user, isPersistent: false);
                //_logger.LogInformation("User signed in after registration.");

                // Insert Login History
                LoginHistory loginHistory = new LoginHistory
                {
                    UserName = requestDto.Email,
                    Latitude = requestDto.Latitude,
                    Longitude = requestDto.Longitude,
                    PublicIp = requestDto.PublicIP,
                    Browser = requestDto.Browser,
                    OperatingSystem = requestDto.OperatingSystem,
                    Device =    requestDto.Device,
                    Action = "Register"
                };
                await InsertLoginHistory(true, true, loginHistory);

                _logger.LogInformation("User {Email} registered successfully.", user.Email);
                return (true, $"User registered successfully. Varify your email use this token: {code}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while registering user.");
                return (false, $"An error occurred: {ex.Message}");
            }
        }

        public async Task<LoginResponseDto> EmailVarificationAsync(string email, string otpText)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                    return new LoginResponseDto
                    {
                        IsAuthenticated = false,
                        Message = "User not found."
                    };

                // Confirm email
                var result = await _userManager.ConfirmEmailAsync(user, otpText);
                if (!result.Succeeded)
                {
                    return new LoginResponseDto
                    {
                        IsAuthenticated = false,
                        Message = "Email verification failed or OTP invalid."
                    };
                }

                // Email confirmed successfully
                _logger.LogInformation("User {Email} verified email successfully.", user.Email);

                // Automatically sign in
                await _signInManager.SignInAsync(user, isPersistent: false);

                // Generate JWT token (reuse your existing helper)
                var loginRequest = new LoginRequestDto
                {
                    Email = user.Email!,
                    RememberMe = true
                };

                var tokenResponse = await GenerateJwtToken(loginRequest);

                // Get profile info
                var userProfile = await _accountRepository.GetUserProfileByApplicationUserId(user.Id);
                tokenResponse.FullName = $"{userProfile?.FirstName} {userProfile?.LastName}";
                tokenResponse.CreatedBy = userProfile?.CreatedBy;
                tokenResponse.IsAuthenticated = true;
                tokenResponse.Message = "Email verified and login successful.";
                /*// Insert Login History
                //var loginHistory = new LoginHistory
                //{
                //    UserName = user.Email,
                //    Latitude = null,
                //    Longitude = null,
                //    PublicIp = null,
                //    Browser = "AutoLogin",
                //    OperatingSystem = "System",
                //    Device = "AutoLogin",
                //    Action = "EmailVerificationLogin"
                //};
                //await InsertLoginHistory(true, true, loginHistory);*/

                return tokenResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while registering user.");
                return new LoginResponseDto
                {
                    IsAuthenticated = false,
                    Message = $"An error occurred: {ex.Message}"
                };
            }
        }

        public async Task<(bool, string)> SendEmailVarificationCodeAsync(string email)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                    return (false, "User not found");

                if(user.EmailConfirmed)
                    return (false, "Email already verified");

                var profile = await _accountRepository.GetUserProfileByApplicationUserId(user.Id);
                if (profile == null)
                    return (false, "User profile not found");

                var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                var result = await SendOtpMail(email, code, profile.FirstName + " " + profile.LastName);
                if(!result)
                    return (result, "Email sending failed");
                return (true, $"Email sent successfully. The varification code is: {code}");
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error occurred while registering user.");
                return (false, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<bool> SendOtpMail(string email, string otpText, string name)
        {
            var mailRequest = new MailRequest();
            mailRequest.Email = email;
            mailRequest.Subject = "Smart Asset Manager Email OTP Verification";
            mailRequest.Body = GenerateEmailBody(name, otpText);
            var result = await _emailService.SendEmail(mailRequest);
            return result;
        }

        private string GenerateEmailBody(string name, string otpText)
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
        .otp-section {{
            background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            border: 2px solid #e9d5ff;
        }}
        .otp-label {{
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 15px;
            font-weight: 500;
        }}
        .otp-code {{
            font-size: 36px;
            font-weight: bold;
            color: #8b5cf6;
            letter-spacing: 4px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
        }}
        .otp-validity {{
            font-size: 14px;
            color: #ef4444;
            margin-top: 15px;
            font-weight: 500;
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
            .otp-code {{
                font-size: 28px;
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
            <h2 class='welcome-text'>Welcome, {name}!</h2>
            <p class='subtitle'>Thank you for registering with SAMS. Please verify your email address to complete your registration and start managing your assets efficiently.</p>
            
            <div class='otp-section'>
                <p class='otp-label'>Your Verification Code:</p>
                <div class='otp-code'>{otpText}</div>
                <p class='otp-validity'>⏰ This code expires in 10 minutes</p>
            </div>
            
            <div class='instructions'>
                <h3>📋 How to complete verification:</h3>
                <ul>
                    <li>Copy the verification code above</li>
                    <li>Return to the SAMS registration page</li>
                    <li>Enter the code in the verification field</li>
                    <li>Click ""Verify"" to activate your account</li>
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
                Thank you for choosing Smart Asset Management System. If you didn't request this verification, please ignore this email.
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

        public async Task<bool> LogoutAsync(string userMail)
        {
            try
            {
                if (string.IsNullOrEmpty(userMail))
                    return false;

                var user = await _userManager.FindByEmailAsync(userMail);
                if (user == null)
                    return false;

                await _signInManager.SignOutAsync();

                var loginHistory = new LoginHistory
                {
                    UserName = user.Email ?? "Unknown",
                    LogoutTime = DateTime.UtcNow
                };

                await InsertLoginHistory(false, true, loginHistory);

                _logger.LogInformation("User {Email} logged out successfully.", user.Email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during logout.");
                return false;
            }
        }

        private async Task InsertLoginHistory(bool IsLoginAction, bool _IsSuccess, LoginHistory loginHistory)
        {
            if (IsLoginAction)
            {
                loginHistory.LoginTime = DateTime.Now;
                loginHistory.Duration = 0;
                loginHistory.ActionStatus = _IsSuccess == true ? "Success" : "Failed";
                loginHistory.CreatedBy = loginHistory.UserName!;
                loginHistory.ModifiedBy = loginHistory.UserName!;
            }
            else
            {
                var _LoginHistory = _accountRepository.GetLoginHistory(loginHistory.UserName!);

                if (_LoginHistory != null)
                {
                    loginHistory.UserName = _LoginHistory.UserName;
                    loginHistory.Latitude = _LoginHistory.Latitude;
                    loginHistory.Longitude = _LoginHistory.Longitude;
                    loginHistory.PublicIp = _LoginHistory.PublicIp;
                    loginHistory.Browser = _LoginHistory.Browser;
                    loginHistory.OperatingSystem = _LoginHistory.OperatingSystem;
                    loginHistory.Device = _LoginHistory.Device;
                    loginHistory.LoginTime = _LoginHistory.LoginTime;
                    loginHistory.LogoutTime = DateTime.Now;
                    loginHistory.Duration = (DateTime.Now - _LoginHistory.LoginTime).TotalMinutes;
                    loginHistory.Action = "Logout";
                    loginHistory.ActionStatus = _IsSuccess ? "Success" : "Failed";
                    loginHistory.CreatedBy = _LoginHistory.UserName!;
                    loginHistory.ModifiedBy = _LoginHistory.UserName!;
                }
                else
                {
                    _logger.LogWarning("No login history found for user {UserName}", loginHistory.UserName);
                    loginHistory.Action = "Logout";
                    loginHistory.ActionStatus = _IsSuccess ? "Success" : "Failed";
                    loginHistory.LogoutTime = DateTime.Now;
                    loginHistory.CreatedBy = loginHistory.UserName!;
                    loginHistory.ModifiedBy = loginHistory.UserName!;
                }

            }
            await _commonService.InsertToLoginHistory(loginHistory);
        }

        private async Task<LoginResponseDto> GenerateJwtToken(LoginRequestDto loginRequestDto)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(loginRequestDto.Email);
                var roles = await _userManager.GetRolesAsync(user!);

                var authClaims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, loginRequestDto.Email),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                };

                foreach (var userRole in roles)
                {
                    authClaims.Add(new Claim(ClaimTypes.Role, userRole));
                }

                var token = AddJWTOption.GetToken(authClaims, _configuration);
                return new LoginResponseDto
                {
                    Token = new JwtSecurityTokenHandler().WriteToken(token),
                    Email = loginRequestDto.Email,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating JWT token.");
                throw;
            }
        }
    }
}
