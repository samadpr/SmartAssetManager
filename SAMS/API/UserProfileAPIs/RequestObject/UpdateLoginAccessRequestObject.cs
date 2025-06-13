using System.ComponentModel.DataAnnotations;

namespace SAMS.API.UserProfileAPIs.RequestObject
{
    public class UpdateLoginAccessRequestObject
    {
        public long UserProfileId { get; set; }

        [Required]
        public string? Email { get; set; } = null!;

        public string? OldPassword { get; set; }

        [DataType(DataType.Password)]
        public string? Password { get; set; }

        [DataType(DataType.Password)]
        [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
        public string? ConfirmPassword { get; set; }

        public long RoleId { get; set; }
    }
}
