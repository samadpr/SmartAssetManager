using AutoMapper;
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
            return BadRequest(new { IsSuccess = false, Message = message });
        }

        [HttpPost("account/email-confirmation")]
        [AllowAnonymous]
        public async Task<IActionResult> EmailVarification(string? email, string? otpText)
        {
            if (email == null || otpText == null)
                return BadRequest(error: "Invalid payload");

            var (isSuccess, message) = await _accountService.EmailVarificationAsync(email, otpText);
            if (isSuccess)
            {
                return Ok(new { IsSuccess = true, Message = message });
            }
            return BadRequest(new { IsSuccess = false, Message = message });
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
            return BadRequest(new { IsSuccess = false, Message = message });
        }

        [HttpPost("account/login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestObject loginRequest)
        {
            var mappedRequest = _mapper.Map<LoginRequestDto>(loginRequest);
            var loginResult = await _accountService.LoginAsync(mappedRequest);

            if (loginResult == null)
            {
                return Unauthorized(new { Message = "Invalid login attempt." });
            }

            return Ok(loginResult);
        }

        [HttpPost("account/logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var isSuccess = await _accountService.LogoutAsync();
            if (!isSuccess)
            {
                return BadRequest(new { IsSuccess = false, Message = "Logout failed." });
            }
            return Ok(new { IsSuccess = true, Message = "Logout successful." });
        }
    }
}
