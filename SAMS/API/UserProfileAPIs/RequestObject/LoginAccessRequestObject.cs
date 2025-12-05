using System.ComponentModel.DataAnnotations;

namespace SAMS.API.UserProfileAPIs.RequestObject
{
    public class LoginAccessRequestObject
    {
        public long UserProfileId { get; set; } 

        public string? Email { get; set; } = null!;

        public bool? IsAllowLoginAccess { get; set; }
        
        public bool IsPasswordCreated { get; set; }

        [DataType(DataType.Password)]
        public string? Password { get; set; }

        [DataType(DataType.Password)]
        [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
        public string? ConfirmPassword { get; set; }

        public long RoleId { get; set; } 

        public bool IsPasswordSendInMail { get; set; }

        public string? sendMessage { get; set; }


    }
}
