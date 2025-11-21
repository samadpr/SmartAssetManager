using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.AssetSitesOrBranches.DTOs;
using SAMS.Services.AssetSitesOrBranches.Interface;

namespace SAMS.Services.AssetSitesOrBranches
{
    public class AssetSitesOrBranchesRepository : IAssetSitesOrBranchesRepository
    {
        private readonly ApplicationDbContext _context;
        public AssetSitesOrBranchesRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> ExistsAsync(string name, Guid orgId)
        {
            return await _context.AssetSite
                .AnyAsync(x => x.Name == name && x.OrganizationId == orgId && !x.Cancelled);
        }

        public async Task<AssetSite> AddAsync(AssetSite entity)
        {
            await _context.AssetSite.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<AssetSite?> UpdateAsync(AssetSite entity)
        {
            _context.AssetSite.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<IEnumerable<AssetSite>> GetAllAsync()
        {
            return await _context.AssetSite
                .Where(x => !x.Cancelled)
                .ToListAsync();
        }

        public async Task<IEnumerable<AssetSiteDto>> GetByOrganizationAsync(Guid orgId)
        {
            var query =
                    from site in _context.AssetSite
                    join city in _context.AssetCities
                        on site.City equals city.Id into cityJoin
                    from cityData in cityJoin.DefaultIfEmpty()

                    where site.OrganizationId == orgId && !site.Cancelled

                    select new AssetSiteDto
                    {
                        Id = site.Id,
                        Name = site.Name,
                        Description = site.Description,
                        City = site.City,
                        CityDisplay = cityData != null ? cityData.Name : null,
                        Address = site.Address,
                        Type = site.Type,
                        OrganizationId = site.OrganizationId,

                        CreatedBy = site.CreatedBy,
                        ModifiedBy = site.ModifiedBy,
                        CreatedDate = site.CreatedDate,
                        ModifiedDate = site.ModifiedDate,
                        Cancelled = site.Cancelled
                    };

            return await query.ToListAsync();
        }

        public async Task<AssetSite?> GetByIdAsync(long id, Guid orgId)
        {
            return await _context.AssetSite
                .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId && !x.Cancelled);
        }

        public async Task<IEnumerable<AssetSite>> GetByCityIdAsync(long cityId, Guid orgId)
        {
            return await _context.AssetSite
                .Where(x => x.City == cityId && x.OrganizationId == orgId && !x.Cancelled)
                .ToListAsync();
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
