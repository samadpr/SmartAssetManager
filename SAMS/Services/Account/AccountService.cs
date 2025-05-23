using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.Account.DTOs;
using SAMS.Services.Account.Interface;
using SAMS.Services.Common.Interface;
using SAMS.Services.Roles.Interface;
using SAMS.Services.Roles.PagesModel;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

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

        public AccountService(IAccountRepository accountRepository,
                                 UserManager<ApplicationUser> userManager,
                                 SignInManager<ApplicationUser> signInManager,
                                 RoleManager<IdentityRole> roleManager,
                                 ILogger<AccountService> logger,
                                 ICommonService commonService,
                                 IConfiguration configuration,
                                 IRolesService roleService)
        {
            _accountRepository = accountRepository;
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _logger = logger;
            _commonService = commonService;
            _configuration = configuration;
            _roleService = roleService;
        }

        public async Task<LoginResponseDto> LoginAsync(LoginRequestDto loginRequestDto)
        {
            try
            {
                var result = await _signInManager.PasswordSignInAsync(loginRequestDto.Email, loginRequestDto.Password, loginRequestDto.RememberMe, lockoutOnFailure: true);

                LoginHistory loginHistory = new LoginHistory
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
                if (!result.Succeeded)
                {
                    _logger.LogWarning("User {Email} failed to log in.", loginRequestDto.Email);
                    return null!;
                }
                
                var loginResponse = await GenerateJwtToken(loginRequestDto);
                if (string.IsNullOrEmpty(loginResponse.Token))
                {
                    _logger.LogWarning("Failed to generate token for user {Email}.", loginRequestDto.Email);
                    return null!;
                }
                _logger.LogInformation("User {Email} logged in successfully.", loginRequestDto.Email);
                return loginResponse;
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
                    PhoneNumber = requestDto.PhoneNumber,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user, requestDto.Password);
                if (!result.Succeeded)
                {
                    string error = string.Join(" ", result.Errors.Select(e => e.Description));
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
                    RoleId = 2,
                    CreatedDate = DateTime.Now,
                    ModifiedDate = DateTime.Now,
                    CreatedBy = "Admin",
                    ModifiedBy = requestDto.Email
                };

                await _accountRepository.AddUserProfile(profile);
                _logger.LogInformation("User created a new account with password.");

                // Assign default roles
                //await _userManager.AddToRoleAsync(user, RoleModels.Dashboard);
                //await _userManager.AddToRoleAsync(user, RoleModels.UserProfile);
                await _roleService.AddToRolesAsync(user);
                _logger.LogInformation("User assigned default roles.");

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
                return (true, "User registered successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while registering user.");
                return (false, $"An error occurred: {ex.Message}");
            }
        }

        public async Task<bool> LogoutAsync()
        {
            try
            {
                var user = await _userManager.GetUserAsync(_signInManager.Context.User!);
                await _signInManager.SignOutAsync();

                var loginHistory = new LoginHistory
                {
                    UserName = user.Email
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
                loginHistory.ActionStatus = _IsSuccess == true ? "Success" : "Failed";
                loginHistory.CreatedBy = _LoginHistory.UserName!;
                loginHistory.ModifiedBy = _LoginHistory.UserName!;

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
                    Expiration = token.ValidTo
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
