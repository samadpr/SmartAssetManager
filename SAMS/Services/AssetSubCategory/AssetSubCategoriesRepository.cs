using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.AssetSubCategory.Interface;

namespace SAMS.Services.AssetSubCategory
{
    public class AssetSubCategoriesRepository : IAssetSubCategoriesRepository
    {
        private readonly ApplicationDbContext _context;
        public AssetSubCategoriesRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> ExistsAsync(string name, long categoryId, Guid orgId)
        {
            return await _context.AssetSubCategories
                .AnyAsync(x => x.Name == name
                            && x.AssetCategorieId == categoryId
                            && x.OrganizationId == orgId
                            && !x.Cancelled);
        }

        public async Task<AssetSubCategorie> AddAsync(AssetSubCategorie entity)
        {
            await _context.AssetSubCategories.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<AssetSubCategorie?> UpdateAsync(AssetSubCategorie entity)
        {
            _context.AssetSubCategories.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<IEnumerable<AssetSubCategorie>> GetAllAsync()
        {
            return await _context.AssetSubCategories
                .Include(x => x.AssetCategorie)
                .Where(x => !x.Cancelled)
                .ToListAsync();
        }

        public async Task<IEnumerable<AssetSubCategorie>> GetByOrganizationAsync(Guid orgId)
        {
            return await _context.AssetSubCategories
                .Include(x => x.AssetCategorie)
                .Where(x => x.OrganizationId == orgId && !x.Cancelled)
                .ToListAsync();
        }

        public async Task<AssetSubCategorie?> GetByIdAsync(long id, Guid orgId)
        {
            return await _context.AssetSubCategories
                .Include(x => x.AssetCategorie)
                .FirstOrDefaultAsync(x => x.Id == id
                                       && x.OrganizationId == orgId
                                       && !x.Cancelled);
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

        public async Task<IEnumerable<AssetSubCategorie>> GetByCategoryIdAsync(long categoryId, Guid orgId)
        {
            return await _context.AssetSubCategories
                .Include(x => x.AssetCategorie) // include to read category name
                .Where(x => x.AssetCategorieId == categoryId
                         && x.OrganizationId == orgId
                         && !x.Cancelled)
                .ToListAsync();
        }
    }
}
