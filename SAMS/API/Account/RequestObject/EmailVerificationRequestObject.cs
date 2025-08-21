namespace SAMS.API.Account.RequestObject
{
    public class EmailVerificationRequestObject
    {
        public string Email { get; set; }
        public string OtpText { get; set; }
    }
}
