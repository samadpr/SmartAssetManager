namespace SAMS.Services.Account.DTOs
{
    public class LoginResponseDto
    {
        public string? Token { get; set; }
        public string? Email { get; set; }
        public DateTime? Expiration { get; set; }
    }
}
