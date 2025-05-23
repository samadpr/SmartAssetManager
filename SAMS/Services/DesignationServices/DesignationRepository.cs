using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.DesignationServices.Interface;

namespace SAMS.Services.DesignationServices
{
    public class DesignationRepository : IDesignationRepository
    {
        private readonly ApplicationDbContext _context;

        public DesignationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Designation> AddAsync(Designation designation)
        {
            _context.Designation.Add(designation);
            await _context.SaveChangesAsync();
            return designation;
        }

        public async Task<Designation> UpdateAsync(Designation designation)
        {
            _context.Designation.Update(designation);
            await _context.SaveChangesAsync();
            return designation;
        }

        public async Task<Designation?> GetByIdAsync(long id) =>
        await _context.Designation.FindAsync(id);

        public async Task<IEnumerable<Designation>> GetAllAsync() =>
        await _context.Designation.ToListAsync();

        public async Task<IEnumerable<Designation>> GetDesignationsCreatedByAsync(string createdByEmail)
        {
            return await _context.Designation
                .Where(d => d.CreatedBy == createdByEmail && d.Cancelled == false)
                .ToListAsync();
        }
    }
}
