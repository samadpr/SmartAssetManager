namespace SAMS.Services.Account.DTOs
{
    public class LoginResponseDto
    {
        public bool IsAuthenticated { get; set; }
        public string? Message { get; set; }
        public string? Token { get; set; }
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public string? CreatedBy { get; set; }
    }
}
