using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Admin.Subscriptions.Interface;

namespace SAMS.Services.Admin.Subscriptions
{
    public class SubscriptionsRepository : ISubscriptionsRepository
    {
        private readonly ApplicationDbContext _context;

        public SubscriptionsRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<SubscriptionPlan> AddAsync(SubscriptionPlan entity)
        {
            _context.SubscriptionPlans.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<List<SubscriptionPlan>> GetAllAsync()
        {
            return await _context.SubscriptionPlans
                .Where(x => !x.Cancelled)
                .ToListAsync();
        }

        public async Task<SubscriptionPlan?> GetByIdAsync(long id)
        {
            return await _context.SubscriptionPlans
                .FirstOrDefaultAsync(x => x.Id == id && !x.Cancelled);
        }

        public async Task<SubscriptionPlan> UpdateAsync(SubscriptionPlan entity)
        {
            _context.SubscriptionPlans.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<bool> DeleteAsync(long id, string user)
        {
            var plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(x => x.Id == id);

            if (plan == null)
                return false;

            plan.Cancelled = true;
            plan.ModifiedDate = DateTime.Now;
            plan.ModifiedBy = user;

            await _context.SaveChangesAsync();

            return true;
        }

        //public async Task<List<SubscriptionPlan>> GetByIsCustomAsync(bool isCustom)
        //{
        //    return await _context.SubscriptionPlans
        //        .Where(x => !x.Cancelled && x.IsCustom == isCustom)
        //        .ToListAsync();
        //}
    }
}
