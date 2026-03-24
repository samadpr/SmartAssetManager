using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NuGet.ContentModel;
using SAMS.API.AssetIssueAPIs.RequestObject;
using SAMS.Data;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Models.EmailServiceModels;
using SAMS.Services.Assets;
using SAMS.Services.AssetsIssue.DTOs;
using SAMS.Services.AssetsIssue.Interface;
using SAMS.Services.Common.Interface;
using SAMS.Services.EmailService.Interface;
using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Services.AssetsIssue
{
    public class AssetIssueService : IAssetIssueService
    {
        private readonly IAssetIssueRepository _repo;
        private readonly ILogger<AssetsService> _logger;
        private readonly ICompanyContext _companyContext;
        private readonly IMapper _mapper;
        private readonly ApplicationDbContext _context;
        private readonly FileUploadHelper _fileUploadHelper;
        private readonly ICommonService _commonService;
        private readonly IEmailService _emailService;

        public AssetIssueService(IAssetIssueRepository repo, ILogger<AssetsService> logger, ICompanyContext companyContext, IMapper mapper, ApplicationDbContext context, FileUploadHelper fileUploadHelper, ICommonService commonService, IEmailService emailService)
        {
            _repo = repo;
            _logger = logger;
            _companyContext = companyContext;
            _mapper = mapper;
            _context = context;
            _fileUploadHelper = fileUploadHelper;
            _commonService = commonService;
            _emailService = emailService;
        }

        public async Task<(bool success, string message, AssetIssueDto? data)> CreateAsync(AssetIssueRequestObject request, string createdBy)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var orgId = _companyContext.OrganizationId;

                string? invoicePath = null;

                // 🔹 Handle Invoice Upload
                if (request.InvoiceFile != null)
                {
                    var (success, path, message) =
                        await _fileUploadHelper.UploadFileAsync(
                            request.InvoiceFile,
                            "Assets/AssetIssue",
                            FileUploadHelper.GetAllowedExtensions("all"));

                    if (!success)
                        return (false, message, null);

                    invoicePath = path;
                }

                var raisedByUser = await _commonService.GetUserProfileAsync(createdBy, orgId);

                var entity = new AssetIssue
                {
                    AssetId = request.AssetId,
                    RaisedByUserId = raisedByUser.UserProfile.UserProfileId,
                    IssueTitle = request.IssueTitle,
                    IssueDescription = request.IssueDescription,
                    Status = request.Status,
                    ExpectedFixDate = request.ExpectedFixDate,
                    RepairCost = request.RepairCost,
                    Invoice = invoicePath,
                    Comment = request.Comment,

                    OrganizationId = orgId,
                    CreatedDate = DateTime.Now,
                    ModifiedDate = DateTime.Now,
                    CreatedBy = createdBy,
                    ModifiedBy = createdBy
                };

                var result = await _repo.AddAsync(entity);

                var assetAssignedUser = await _context.Asset
                    .Where(a => a.Id == request.AssetId && a.AssignTo == (int)AssignToType.User)
                    .Select(a => new
                    {
                        a.AssignUserId,
                        User = a.AssignUser
                    })
                    .FirstOrDefaultAsync();

                if(assetAssignedUser != null && assetAssignedUser.User != null && assetAssignedUser.AssignUserId != null)
                {
                    var mailSend = await SendAssignUserMail(assetAssignedUser.User.Email!, entity, createdBy, assetAssignedUser.User);

                    if (!mailSend)
                        _logger.LogError("Failed to send asset issue email to {Email}", assetAssignedUser.User.Email);

                }

                await transaction.CommitAsync();

                return (true, "Issue created successfully",
                    _mapper.Map<AssetIssueDto>(result));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating asset issue");
                return (false, "Error creating issue", null);
            }
        }

        private async Task<bool> SendAssignUserMail(string email, AssetIssue entity, string createdBy, UserProfile? assetAssignedUser)
        {
            try
            {
                var mailRequest = new MailRequest
                {
                    Email = email,
                    Subject = "SAMS - Asset Issue Reported for Your Assigned Asset",
                    Body = GenerateAssetIssueEmailBody(entity, createdBy, assetAssignedUser)
                };

                return await _emailService.SendEmail(mailRequest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send asset issue email to {Email}", email);
                return false;
            }
        }

        private string GenerateAssetIssueEmailBody(AssetIssue entity, string createdBy, UserProfile? assignedUser)
        {
            string fullName = assignedUser != null
                ? $"{assignedUser.FirstName} {assignedUser.LastName}".Trim()
                : "User";

            string statusLabel = entity.Status switch
            {
                AssetIssueStatus.New => "🆕 New",
                AssetIssueStatus.InProgress => "🔵 In Progress",
                AssetIssueStatus.Resolved => "🟢 Resolved",
                AssetIssueStatus.Blocker => "🔴 Blocker",
                AssetIssueStatus.Pending => "🟡 Pending",
                AssetIssueStatus.Hold => "⏸️ On Hold",
                AssetIssueStatus.Rejected => "❌ Rejected",
                AssetIssueStatus.Accepted => "✅ Accepted",
                AssetIssueStatus.Closed => "⚫ Closed",
                _ => "⚪ Unknown"
            };

            string statusCssClass = entity.Status switch
            {
                AssetIssueStatus.New => "status-new",
                AssetIssueStatus.InProgress => "status-inprogress",
                AssetIssueStatus.Resolved => "status-resolved",
                AssetIssueStatus.Blocker => "status-blocker",
                AssetIssueStatus.Pending => "status-pending",
                AssetIssueStatus.Hold => "status-hold",
                AssetIssueStatus.Rejected => "status-rejected",
                AssetIssueStatus.Accepted => "status-accepted",
                AssetIssueStatus.Closed => "status-closed",
                _ => "status-unknown"
            };

            string expectedFixDate = entity.ExpectedFixDate.HasValue
                ? entity.ExpectedFixDate.Value.ToString("MMMM dd, yyyy")
                : "Not specified";

            string repairCost = entity.RepairCost.HasValue
                ? $"${entity.RepairCost.Value:F2}"
                : "Not estimated";

            string comment = !string.IsNullOrWhiteSpace(entity.Comment)
                ? entity.Comment
                : "No additional comments provided.";

            string issueDescription = !string.IsNullOrWhiteSpace(entity.IssueDescription)
                ? entity.IssueDescription
                : "No description provided.";

            string invoiceBlock = !string.IsNullOrWhiteSpace(entity.Invoice)
                ? $@"<div class='detail-item'>
                <span class='detail-label'>📎 Invoice</span>
                <span class='detail-value'>Attached</span>
             </div>"
                : "";

            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>SAMS - Asset Issue Notification</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
            min-height: 100vh;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.2);
            margin-top: 20px;
            margin-bottom: 20px;
        }}

        /* ── Header ── */
        .header {{
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }}
        .company-name {{
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            letter-spacing: 1px;
        }}
        .tagline {{
            font-size: 14px;
            margin: 8px 0 0 0;
            opacity: 0.9;
            letter-spacing: 0.5px;
        }}
        .alert-badge {{
            display: inline-block;
            background-color: rgba(255, 255, 255, 0.25);
            color: #fff;
            font-size: 13px;
            font-weight: 600;
            padding: 6px 18px;
            border-radius: 20px;
            margin-top: 14px;
            letter-spacing: 0.5px;
        }}

        /* ── Content ── */
        .content {{
            padding: 40px 30px;
            text-align: center;
        }}
        .welcome-text {{
            font-size: 24px;
            color: #374151;
            margin-bottom: 10px;
            font-weight: 600;
        }}
        .subtitle {{
            font-size: 15px;
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.6;
        }}

        /* ── Orange Alert Box ── */
        .alert-box {{
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            border-left: 4px solid #f97316;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }}
        .alert-box-text {{
            color: #9a3412;
            font-size: 15px;
            margin: 0;
            line-height: 1.6;
        }}

        /* ── Issue Details Card ── */
        .issue-card {{
            background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
            border: 2px solid #c4b5fd;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            text-align: left;
        }}
        .issue-card-title {{
            color: #5b21b6;
            font-size: 17px;
            font-weight: 700;
            margin: 0 0 18px 0;
            padding-bottom: 12px;
            border-bottom: 2px solid #c4b5fd;
        }}
        .detail-item {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 11px 0;
            border-bottom: 1px solid #ddd6fe;
        }}
        .detail-item:last-child {{
            border-bottom: none;
            padding-bottom: 0;
        }}
        .detail-label {{
            color: #6b7280;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            min-width: 150px;
        }}
        .detail-value {{
            color: #1f2937;
            font-size: 14px;
            font-weight: 500;
            text-align: right;
            flex: 1;
            word-break: break-word;
        }}

        /* ── Status Badge Colors ── */
        .status-badge      {{ display: inline-block; font-size: 13px; font-weight: 600; padding: 4px 14px; border-radius: 20px; color: #fff; }}
        .status-new        {{ background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); }}
        .status-inprogress {{ background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }}
        .status-resolved   {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); }}
        .status-blocker    {{ background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }}
        .status-pending    {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }}
        .status-hold       {{ background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); }}
        .status-rejected   {{ background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); }}
        .status-accepted   {{ background: linear-gradient(135deg, #10b981 0%, #047857 100%); }}
        .status-closed     {{ background: linear-gradient(135deg, #1f2937 0%, #111827 100%); }}
        .status-unknown    {{ background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%); }}

        /* ── Description Block ── */
        .description-block {{
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }}
        .description-block h4 {{
            color: #374151;
            font-size: 15px;
            font-weight: 600;
            margin: 0 0 10px 0;
        }}
        .description-block p {{
            color: #4b5563;
            font-size: 14px;
            margin: 0;
            line-height: 1.7;
        }}

        /* ── Comment Block ── */
        .comment-block {{
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }}
        .comment-block h4 {{
            color: #92400e;
            font-size: 15px;
            font-weight: 600;
            margin: 0 0 8px 0;
        }}
        .comment-block p {{
            color: #78350f;
            font-size: 14px;
            margin: 0;
            line-height: 1.7;
        }}

        /* ── Info Box (Blue) ── */
        .info-box {{
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }}
        .info-box-text {{
            color: #1e40af;
            font-size: 14px;
            margin: 0;
            line-height: 1.8;
        }}

        /* ── Footer ── */
        .footer {{
            background-color: #f8fafc;
            padding: 25px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }}
        .footer-text {{
            color: #6b7280;
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
        }}
        .contact-info {{
            margin-top: 15px;
            font-size: 13px;
            color: #9ca3af;
        }}
        .social-links {{
            margin-top: 15px;
        }}
        .social-links a {{
            color: #8b5cf6;
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
        }}

        /* ── Mobile ── */
        @media (max-width: 600px) {{
            .email-container {{
                margin: 10px;
                border-radius: 12px;
            }}
            .content {{
                padding: 30px 20px;
            }}
            .detail-item {{
                flex-direction: column;
                gap: 4px;
            }}
            .detail-value {{
                text-align: left;
            }}
        }}
    </style>
</head>
<body>
    <div class='email-container'>

        <!-- ── Header ── -->
        <div class='header'>
            <h1 class='company-name'>Smart Asset Management System</h1>
            <p class='tagline'>Intelligent Asset Tracking &amp; Management</p>
            <span class='alert-badge'>⚠️ Asset Issue Notification</span>
        </div>

        <!-- ── Body ── -->
        <div class='content'>
            <h2 class='welcome-text'>Hello, {fullName}!</h2>
            <p class='subtitle'>
                An issue has been raised for an asset that is currently assigned to you.
                Please review the details below and take the necessary action promptly.
            </p>

            <!-- Orange Alert Banner -->
            <div class='alert-box'>
                <p class='alert-box-text'>
                    <strong>🔔 New Issue Reported on Your Asset</strong><br><br>
                    A new issue has been logged in SAMS for your assigned asset.
                    Please review the information carefully and coordinate with your team
                    to resolve it as soon as possible.
                </p>
            </div>

            <!-- Issue Details Card -->
            <div class='issue-card'>
                <p class='issue-card-title'>📋 Issue Details</p>

                <div class='detail-item'>
                    <span class='detail-label'>🏷️ Issue Title</span>
                    <span class='detail-value'>{entity.IssueTitle ?? "N/A"}</span>
                </div>

                <div class='detail-item'>
                    <span class='detail-label'>📌 Status</span>
                    <span class='detail-value'>
                        <span class='status-badge {statusCssClass}'>{statusLabel}</span>
                    </span>
                </div>

                <div class='detail-item'>
                    <span class='detail-label'>📅 Reported On</span>
                    <span class='detail-value'>{entity.CreatedDate:MMMM dd, yyyy hh:mm tt}</span>
                </div>

                <div class='detail-item'>
                    <span class='detail-label'>👤 Reported By</span>
                    <span class='detail-value'>{createdBy}</span>
                </div>

                <div class='detail-item'>
                    <span class='detail-label'>🗓️ Expected Fix Date</span>
                    <span class='detail-value'>{expectedFixDate}</span>
                </div>

                <div class='detail-item'>
                    <span class='detail-label'>💰 Repair Cost Est.</span>
                    <span class='detail-value'>{repairCost}</span>
                </div>

                {invoiceBlock}

            </div>

            <!-- Issue Description -->
            <div class='description-block'>
                <h4>📝 Issue Description</h4>
                <p>{issueDescription}</p>
            </div>

            <!-- Comment -->
            <div class='comment-block'>
                <h4>💬 Additional Comments</h4>
                <p>{comment}</p>
            </div>

            <!-- Next Steps Info Box -->
            <div class='info-box'>
                <p class='info-box-text'>
                    <strong>ℹ️ What to do next?</strong><br><br>
                    • Log in to SAMS and navigate to <strong>Asset Issues</strong> to view full details.<br>
                    • Coordinate with your maintenance team to schedule a repair.<br>
                    • Keep the issue updated with progress notes regularly.<br>
                    • Mark the issue as <strong>Resolved</strong> once the repair is completed.<br>
                    • Contact your administrator if you need further assistance.
                </p>
            </div>

        </div>

        <!-- ── Footer ── -->
        <div class='footer'>
            <p class='footer-text'>
                <strong>SAMS Team</strong><br>
                This is an automated notification from the Smart Asset Management System.
                Please do not reply directly to this email.
            </p>
            <div class='contact-info'>
                📧 support@sams.com | 📞 +1 (555) 123-4567<br>
                🌐 www.sams.com | 📍 123 Business Ave, Tech City, TC 12345
            </div>
            <div class='social-links'>
                <a href='#'>LinkedIn</a> |
                <a href='#'>Twitter</a> |
                <a href='#'>Support</a>
            </div>
        </div>

    </div>
</body>
</html>";
        }

        public async Task<(bool success, string message, AssetIssueDto? data)> UpdateAsync(AssetIssueRequestObject request, string modifiedBy)
        {

            try
            {
                var orgId = _companyContext.OrganizationId;

                var entity = await _repo.GetByIdAsync(request.Id!.Value, orgId);
                if (entity == null)
                    return (false, "Issue not found in your organization", null);
                if (entity.Status == AssetIssueStatus.Resolved)
                    return (false, "Issue already resolved", null);

                string? invoicePath = entity.Invoice;

                if (request.InvoiceFile != null)
                {
                    // Delete old file
                    if (!string.IsNullOrEmpty(entity.Invoice))
                        _fileUploadHelper.DeleteFile(entity.Invoice);

                    var (success, path, message) =
                        await _fileUploadHelper.UploadFileAsync(
                            request.InvoiceFile,
                            "Assets/AssetIssue",
                            FileUploadHelper.GetAllowedExtensions("all"));

                    if (!success)
                        return (false, message, null);

                    invoicePath = path;
                }


                entity.Status = AssetIssueStatus.Resolved;
                entity.ResolvedDate = DateTime.Now;

                entity.IssueTitle = request.IssueTitle;
                entity.IssueDescription = request.IssueDescription;
                entity.Status = request.Status;
                entity.ExpectedFixDate = request.ExpectedFixDate;
                entity.ResolvedDate = request.ResolvedDate;
                entity.RepairCost = request.RepairCost;
                entity.Invoice = invoicePath;
                entity.Comment = request.Comment;

                entity.ModifiedBy = modifiedBy;
                entity.ModifiedDate = DateTime.Now;

                await _repo.UpdateAsync(entity);

                return (true, "Issue updated successfully",
                    _mapper.Map<AssetIssueDto>(entity));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating issue");
                return (false, "Error updating issue", null);
            }
        }

        public async Task<(bool success, string message, IEnumerable<AssetIssueDetailsDto>? data)> GetByOrganizationAsync()
        {
            var orgId = _companyContext.OrganizationId;

            var list = await _repo.GetByOrganizationAsync(orgId);

            return (true, "Fetched successfully", list);
        }

        public async Task<(bool success, string message, AssetIssueDetailsDto? data)> GetByIdAsync(long id)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                var entity = await _repo.GetByIdWithDetailsAsync(id, orgId);
                if (entity == null)
                    return (false, "Issue not found in your organization", null);

                return (true, "Fetched successfully", entity);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error fetching issue");
                return (false, "Error fetching issue", null);
            }
        }

        public async Task<(bool success, string message)> DeleteAsync(long id, string deletedBy)
        {
            var orgId = _companyContext.OrganizationId;

            bool result = await _repo.SoftDeleteAsync(id, orgId, deletedBy);

            return result
                ? (true, "Deleted successfully")
                : (false, "Issue not found");
        }

    }
}
