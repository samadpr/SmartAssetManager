using System.ComponentModel.DataAnnotations;

namespace SAMS.Services.Account.DTOs
{
    public class RegisterRequestDto
    {
        [Required]
        public string FirstName { get; set; } = null!;

        [Required]
        public string LastName { get; set; } = null!;

        [Required]
        public string PhoneNumber { get; set; } = null!;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;

        public string? Address { get; set; }
        public string? Country { get; set; }
        public string? Browser { get; set; }
        public string? OperatingSystem { get; set; }
        public string? Device { get; set; }
        public string? PublicIP { get; set; }
        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; } = null!;

        [DataType(DataType.Password)]
        public string ConfirmPassword { get; set; }

        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
    }
}
