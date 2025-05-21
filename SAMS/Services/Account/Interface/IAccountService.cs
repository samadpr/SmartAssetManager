using Microsoft.AspNetCore.Mvc;
using SAMS.API.Account.RequestObject;
using SAMS.Services.Account.DTOs;

namespace SAMS.Services.Account.Interface
{
    public interface IAccountService
    {
        Task<(bool isSuccess, string message)> RegisterAsync(RegisterRequestDto registerRequestDto);

        Task<LoginResponseDto> LoginAsync(LoginRequestDto loginRequestDto);

        Task<bool> LogoutAsync();
    }
}
