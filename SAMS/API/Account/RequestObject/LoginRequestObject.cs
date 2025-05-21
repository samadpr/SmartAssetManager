using System.ComponentModel.DataAnnotations;

namespace SAMS.API.Account.RequestObject
{
    public class LoginRequestObject
    {
        //public string Id { get; set; }
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; }

        [Display(Name = "Remember me?")]
        public bool RememberMe { get; set; }
        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
        public string? PublicIp { get; set; }
        public string? Browser { get; set; }
        public string? OperatingSystem { get; set; }
        public string? Device { get; set; }
    }
}
