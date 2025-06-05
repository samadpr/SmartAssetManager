using System.ComponentModel.DataAnnotations;

namespace SAMS.API.UserProfileAPIs.RequestObject
{
    public class LoginAccessRequestObject
    {
        public long UserProfileId { get; set; } 

        public string? Email { get; set; } = null!;

        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; } = null!;

        [DataType(DataType.Password)]
        [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
        public string ConfirmPassword { get; set; } = null!;

        public long RoleId { get; set; } 
    }
}
