using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.AssetsIssue.DTOs;
using SAMS.Services.AssetsIssue.Interface;

namespace SAMS.Services.AssetsIssue
{
    public class AssetIssueRepository : IAssetIssueRepository
    {
        private readonly ApplicationDbContext _context;

        public AssetIssueRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<AssetIssue> AddAsync(AssetIssue entity)
        {
            try
            {
                await _context.AssetIssue.AddAsync(entity);
                await _context.SaveChangesAsync();
                return entity;
            }
            catch(Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public async Task<AssetIssue?> UpdateAsync(AssetIssue entity)
        {
            _context.AssetIssue.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<AssetIssue?> GetByIdAsync(long id, Guid orgId)
        {
            return await _context.AssetIssue
                .Include(x => x.Asset)
                .Include(x => x.RaisedByUser)
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.OrganizationId == orgId &&
                    !x.Cancelled);
        }

        public async Task<AssetIssueDetailsDto?> GetByIdWithDetailsAsync(long id, Guid orgId)
        {
            return await _context.AssetIssue
                .Where(x => x.Id == id && x.OrganizationId == orgId && !x.Cancelled)
                .Select(issue => new AssetIssueDetailsDto
                {
                    Id = issue.Id,
                    AssetId = issue.AssetId,
                    RaisedByUserId = issue.RaisedByUserId,
                    IssueTitle = issue.IssueTitle,
                    IssueDescription = issue.IssueDescription,
                    Status = issue.Status,
                    ExpectedFixDate = issue.ExpectedFixDate,
                    ResolvedDate = issue.ResolvedDate,
                    RepairCost = issue.RepairCost,
                    Invoice = issue.Invoice,
                    Comment = issue.Comment,

                    // 🔥 Joined fields
                    AssetName = issue.Asset.Name,
                    AssetImageUrl = issue.Asset.ImageUrl,

                    RaisedByUserName = issue.RaisedByUser.FirstName + " " + issue.RaisedByUser.LastName,
                    UserImageUrl = issue.RaisedByUser.ProfilePicture,
                    OrganizationId = issue.OrganizationId,
                    CreatedBy = issue.CreatedBy,
                    CreatedDate = issue.CreatedDate,
                    ModifiedBy = issue.ModifiedBy,
                    ModifiedDate = issue.ModifiedDate,

                })
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<AssetIssueDetailsDto>> GetByOrganizationAsync(Guid orgId)
        {
            return await _context.AssetIssue
                .Where(x => x.OrganizationId == orgId && !x.Cancelled)
                .OrderByDescending(x => x.CreatedDate) // optional (recommended)
                .Select(issue => new AssetIssueDetailsDto
                {
                    Id = issue.Id,
                    AssetId = issue.AssetId,
                    RaisedByUserId = issue.RaisedByUserId,
                    IssueTitle = issue.IssueTitle,
                    IssueDescription = issue.IssueDescription,
                    Status = issue.Status,
                    ExpectedFixDate = issue.ExpectedFixDate,
                    ResolvedDate = issue.ResolvedDate,
                    RepairCost = issue.RepairCost,
                    Invoice = issue.Invoice,
                    Comment = issue.Comment,

                    // 🔥 Joined fields
                    AssetName = issue.Asset.Name,
                    AssetImageUrl = issue.Asset.ImageUrl,

                    RaisedByUserName = issue.RaisedByUser.FirstName + " " + issue.RaisedByUser.LastName,
                    UserImageUrl = issue.RaisedByUser.ProfilePicture,
                    OrganizationId = issue.OrganizationId,
                    CreatedBy = issue.CreatedBy,
                    CreatedDate = issue.CreatedDate,
                    ModifiedBy = issue.ModifiedBy,
                    ModifiedDate = issue.ModifiedDate
                })
                .ToListAsync();
        }

        public async Task<bool> SoftDeleteAsync(long id, Guid orgId, string deletedBy)
        {
            var entity = await GetByIdAsync(id, orgId);
            if (entity == null) return false;

            entity.Cancelled = true;
            entity.ModifiedBy = deletedBy;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
