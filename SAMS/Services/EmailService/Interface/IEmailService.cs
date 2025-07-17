using SAMS.Models.EmailServiceModels;

namespace SAMS.Services.EmailService.Interface
{
    public interface IEmailService
    {
        Task<bool> SendEmail(MailRequest mailRequest);
    }
}
