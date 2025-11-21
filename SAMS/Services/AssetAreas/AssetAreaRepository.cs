using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.AssetAreas.DTOs;
using SAMS.Services.AssetAreas.Interface;

namespace SAMS.Services.AssetAreas
{
    public class AssetAreaRepository : IAssetAreaRepository
    {
        private readonly ApplicationDbContext _context;

        public AssetAreaRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> ExistsAsync(string name, long siteId, Guid orgId)
        {
            return await _context.AssetArea
                .AnyAsync(x => x.Name == name && x.SiteId == siteId
                            && x.OrganizationId == orgId && !x.Cancelled);
        }

        public async Task<AssetArea> AddAsync(AssetArea entity)
        {
            await _context.AssetArea.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<AssetArea?> UpdateAsync(AssetArea entity)
        {
            _context.AssetArea.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<IEnumerable<AssetArea>> GetAllAsync()
        {
            return await _context.AssetArea
                .Where(x => !x.Cancelled)
                .ToListAsync();
        }

        public async Task<IEnumerable<AssetAreaDto>> GetByOrganizationAsync(Guid orgId)
        {
            var query =
                    from area in _context.AssetArea
                    join site in _context.AssetSite
                        on area.SiteId equals site.Id into siteJoin
                    from siteData in siteJoin.DefaultIfEmpty()

                    where area.OrganizationId == orgId && !area.Cancelled

                    select new AssetAreaDto
                    {
                        Id = area.Id,
                        SiteId = area.SiteId,
                        SiteDisplay = siteData != null ? siteData.Name : null,

                        Name = area.Name,
                        Description = area.Description,

                        OrganizationId = area.OrganizationId,
                        CreatedBy = area.CreatedBy,
                        ModifiedBy = area.ModifiedBy,
                        CreatedDate = area.CreatedDate,
                        ModifiedDate = area.ModifiedDate,
                        Cancelled = area.Cancelled
                    };

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<AssetArea>> GetBySiteIdAsync(long siteId, Guid orgId)
        {
            return await _context.AssetArea
                .Where(x => x.SiteId == siteId && x.OrganizationId == orgId && !x.Cancelled)
                .ToListAsync();
        }


        public async Task<AssetArea?> GetByIdAsync(long id, Guid orgId)
        {
            return await _context.AssetArea
                .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId && !x.Cancelled);
        }

        public async Task<bool> SoftDeleteAsync(long id, Guid orgId, string deletedBy)
        {
            var entity = await GetByIdAsync(id, orgId);
            if (entity == null) return false;

            entity.Cancelled = true;
            entity.ModifiedDate = DateTime.Now;
            entity.ModifiedBy = deletedBy;

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
