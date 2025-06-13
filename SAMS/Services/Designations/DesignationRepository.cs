using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.DesignationServices.DTOs;
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

        public async Task<Designation> AddAsync(Designation designation, string createdByEmail)
        {
            var existingDesignation = await _context.Designation.FirstOrDefaultAsync(d => d.Name == designation.Name && d.CreatedBy == createdByEmail && !d.Cancelled);
            if (existingDesignation != null)
                return null!;
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
        await _context.Designation.Where(d => d.Id == id && !d.Cancelled).FirstOrDefaultAsync();

        public async Task<IEnumerable<Designation>> GetAllAsync() =>
        await _context.Designation.Where(d => !d.Cancelled).ToListAsync();

        public async Task<IEnumerable<Designation>> GetDesignationsCreatedByAsync(string createdByEmail)
        {
            return await _context.Designation
                .Where(d => d.CreatedBy == createdByEmail && !d.Cancelled)
                .ToListAsync();
        }

        public async Task<List<Designation>> GetDesignationsForUserAsync(List<string> emails)
        {
            var designations = await _context.Designation
                .Where(d => emails.Contains(d.CreatedBy) && !d.Cancelled)
                .OrderByDescending(d => d.CreatedDate)
                .ToListAsync();
            if (designations == null || !designations.Any())
            {
                return new List<Designation>();
            }
            return designations;

        }
    }
}
