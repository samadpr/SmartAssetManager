using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Suppliers.Interface;

namespace SAMS.Services.Suppliers
{
    public class SuppliersRepository : ISuppliersRepository
    {
        private readonly ApplicationDbContext _context;

        public SuppliersRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> ExistsAsync(string name, Guid? orgId)
        {
            return await _context.Suppliers
                .AnyAsync(x => x.Name == name && x.OrganizationId == orgId && !x.Cancelled);
        }

        public async Task<Supplier?> GetByIdAsync(long id, Guid? orgId)
        {
            return await _context.Suppliers
                .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId && !x.Cancelled);
        }

        public async Task<Supplier> AddAsync(Supplier supplier)
        {
            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();
            return supplier;
        }

        public async Task UpdateAsync(Supplier supplier)
        {
            _context.Suppliers.Update(supplier);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<Supplier>> GetByOrganizationAsync(Guid? orgId)
        {
            return await _context.Suppliers
                .Where(x => x.OrganizationId == orgId && !x.Cancelled)
                .ToListAsync();
        }

        public async Task<bool> SoftDeleteAsync(long id, Guid? orgId, string deletedBy)
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
