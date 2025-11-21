using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.AssetCategory.Interface;

namespace SAMS.Services.AssetCategory
{
    public class AssetCategoriesRepository : IAssetCategoriesRepository
    {
        private readonly ApplicationDbContext _context;
        public AssetCategoriesRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> ExistsAsync(string name, Guid orgId)
        {
            return await _context.AssetCategorie
                .AnyAsync(x => x.Name == name && x.OrganizationId == orgId && !x.Cancelled);
        }

        public async Task<AssetCategorie> AddAsync(AssetCategorie entity)
        {
            await _context.AssetCategorie.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<AssetCategorie?> UpdateAsync(AssetCategorie entity)
        {
            _context.AssetCategorie.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<IEnumerable<AssetCategorie>> GetAllAsync()
        {
            return await _context.AssetCategorie
                .Where(x => !x.Cancelled)
                .ToListAsync();
        }

        public async Task<IEnumerable<AssetCategorie>> GetByOrganizationAsync(Guid orgId)
        {
            return await _context.AssetCategorie
                .Where(x => x.OrganizationId == orgId && !x.Cancelled)
                .ToListAsync();
        }

        public async Task<AssetCategorie?> GetByIdAsync(long id, Guid orgId)
        {
            return await _context.AssetCategorie
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
