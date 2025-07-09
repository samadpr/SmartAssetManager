using System.ComponentModel.DataAnnotations;

namespace SAMS.API.Account.RequestObject
{
    public class RegisterRequestObject
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

        public string Password { get; set; } = null!;

        public string ConfirmPassword { get; set; }

        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
    }
}
