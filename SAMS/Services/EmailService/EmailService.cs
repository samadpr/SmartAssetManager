using AutoMapper.Internal;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MimeKit;
using SAMS.Data;
using SAMS.Models;
using SAMS.Models.EmailServiceModels;
using SAMS.Services.EmailService.Interface;
using SendGrid;
using SendGrid.Helpers.Mail;


namespace SAMS.Services.EmailService
{
    public class EmailService : IEmailService
    {
        //private readonly EmailSettings _emailSettings;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EmailService> _logger;
        public EmailService(ApplicationDbContext context, ILogger<EmailService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> SendEmail(MailRequest mailRequest)
        {
            try
            {
                var smtpSetting = await _context.SMTPEmailSettings.FirstOrDefaultAsync(x => x.IsDefault);
                var sendGridSetting = await _context.SendGridSettings.FirstOrDefaultAsync(x => x.IsDefault);

                if (smtpSetting != null)
                {
                    var result = await SendUsingSmtp(smtpSetting, mailRequest);
                    return result;
                }
                else if (sendGridSetting != null)
                {
                    var result = await SendUsingSendGrid(sendGridSetting, mailRequest);
                    return result;

                }
                else
                {
                    throw new Exception("No email provider configured as default.");
                }
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Email sending failed to {Email}", mailRequest.Email);
                return false;
            }
        }

        private async Task<bool> SendUsingSmtp(SMTPEmailSetting setting, MailRequest request)
        {
            try
            {
                var email = new MimeMessage();
                email.Sender = MailboxAddress.Parse(setting.FromEmail);
                email.To.Add(MailboxAddress.Parse(request.Email));
                email.Subject = request.Subject;

                var builder = new BodyBuilder
                {
                    HtmlBody = request.Body
                };

                email.Body = builder.ToMessageBody();

                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(setting.Host, setting.Port, setting.IsSSl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto);
                await smtp.AuthenticateAsync(setting.UserName, setting.Password);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);

                return true;
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Email sending failed to {Email}", request.Email);
                return false;
            }
            
        }

        private async Task<bool> SendUsingSendGrid(SendGridSetting setting, MailRequest request)
        {
            try
            {
                var client = new SendGridClient(setting.SendGridKey);

                var from = new EmailAddress(setting.FromEmail, setting.FromFullName);
                var to = new EmailAddress(request.Email);
                var msg = MailHelper.CreateSingleEmail(from, to, request.Subject, null, request.Body);

                var response = await client.SendEmailAsync(msg);
                if (!response.IsSuccessStatusCode)
                {
                    throw new Exception($"SendGrid failed with status code: {response.StatusCode}");
                }

                return true;
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Email sending failed to {Email}", request.Email);
                return false;
            }
            
        }
    }
}
