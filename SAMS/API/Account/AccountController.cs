using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SAMS.API.Account.RequestObject;
using SAMS.Controllers;
using SAMS.Services.Account.DTOs;
using SAMS.Services.Account.Interface;

namespace SAMS.API.Account
{
    [ApiController]
    public class AccountController : BaseApiController<AccountController>
    {

        private readonly IAccountService _accountService;
        private readonly IMapper _mapper;

        public AccountController(IAccountService accountService, IMapper mapper)
        {
            _accountService = accountService;
            _mapper = mapper;
        }

        [HttpPost("account/register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequestObject registerRequest)
        {
            var mappedRequest = _mapper.Map<RegisterRequestDto>(registerRequest);
            var (isSuccess, message) = await _accountService.RegisterAsync(mappedRequest);
            if (isSuccess)
            {
                return Ok(new { IsSuccess = true, Message = message });
            }
            return Ok(new { IsSuccess = false, Message = message });
        }

        [HttpPost("account/email-confirmation")]
        [AllowAnonymous]
        public async Task<IActionResult> EmailVarification([FromBody] EmailVerificationRequestObject emailVerificationRequest)
        {
            if(emailVerificationRequest == null)
                return BadRequest(error: "Invalid payload");

            var response = await _accountService.EmailVarificationAsync(emailVerificationRequest.Email, emailVerificationRequest.OtpText);
            if (response.IsAuthenticated)
            {
                return Ok(response);
            }
            return Ok(response);
        }

        [HttpPost("account/send-email-verification-code")]
        [AllowAnonymous]
        public async Task<IActionResult> SendEmailVarificationCode(string? email)
        {
            if (email == null)
                return BadRequest(error: "Invalid payload");

            var (isSuccess, message) = await _accountService.SendEmailVarificationCodeAsync(email);
            if (isSuccess)
            {
                return Ok(new { IsSuccess = true, Message = message });
            }
            return Ok(new { IsSuccess = false, Message = message });
        }

        [HttpPost("account/login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestObject loginRequest)
        {
            var mappedRequest = _mapper.Map<LoginRequestDto>(loginRequest);
            var loginResult = await _accountService.LoginAsync(mappedRequest);

            if (!loginResult.IsAuthenticated)
            {
                if(loginResult.Message == "User not found.")
                    return NotFound(loginResult);
                else
                    return Unauthorized(loginResult);
            }

            return Ok(loginResult);
        }

        [HttpPost("account/logout")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Logout()
        {
            var user = HttpContext.User.Identity?.Name ?? "System";
            var isSuccess = await _accountService.LogoutAsync(user);
            if (!isSuccess)
            {
                return BadRequest(new { IsSuccess = false, Message = "Logout failed." });
            }
            return Ok(new { IsSuccess = true, Message = "Logout successful." });
        }
    }
}
