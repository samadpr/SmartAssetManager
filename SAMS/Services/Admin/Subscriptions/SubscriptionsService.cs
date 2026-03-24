using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SAMS.API.Admin.SubscriptionAPIs.RequestObject;
using SAMS.Data;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.Admin.Subscriptions.DTOs;
using SAMS.Services.Admin.Subscriptions.Interface;
using SAMS.Services.Assets;

namespace SAMS.Services.Admin.Subscriptions
{
    public class SubscriptionsService : ISubscriptionsService
    {
        private readonly ISubscriptionsRepository _repo;
        private readonly ILogger<SubscriptionsService> _logger;
        private readonly IMapper _mapper;
        private readonly ApplicationDbContext _context;

        public SubscriptionsService(ISubscriptionsRepository repo, ILogger<SubscriptionsService> logger, IMapper mapper, ApplicationDbContext context)
        {
            _repo = repo;
            _logger = logger;
            _mapper = mapper;
            _context = context;
        }

        public async Task<(bool success, string message, SubscriptionDto data)> CreateAsync(SubscriptionRequestObject request, string user, int companyId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {

                var entity = new SubscriptionPlan
                {
                    Name = request.Name,
                    PlanAmount = request.PlanAmount,
                    DurationDays = request.DurationDays,
                    AssetLimit = request.AssetLimit,
                    SystemUserLimit = request.SystemUserLimit,
                    TotalUserLimit = request.TotalUserLimit,

                    CreatedBy = user,
                    ModifiedBy = user,
                    CreatedDate = DateTime.Now,
                    ModifiedDate = DateTime.Now
                };

                var result = await _repo.AddAsync(entity);

                var company = await _context.CompanyInfo.FirstOrDefaultAsync(x => x.Id == companyId && !x.Cancelled);

                if (company == null)
                {
                    await transaction.RollbackAsync();
                    return (false, "Company not found", null!);
                }

                company.SubscriptionId = entity.Id;
                company.SubscriptionDate = request.SubscriptionDate;
                company.SubscriptionExpiryDate = request.SubscriptionExpiryDate;
                company.ModifiedBy = user;
                company.ModifiedDate = DateTime.Now;

                _context.CompanyInfo.Update(company);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var dto = _mapper.Map<SubscriptionDto>(result);

                return (true, "Subscription created successfully", dto);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating subscription");
                return (false, "Error creating subscription", null!);
            }
        }

        public async Task<(bool success, string message, SubscriptionDto data)> UpdateAsync(SubscriptionRequestObject request, string user, int companyId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var entity = await _repo.GetByIdAsync(request.Id!.Value);

                if (entity == null)
                    return (false, "Subscription not found", null!);

                entity.Name = request.Name;
                entity.PlanAmount = request.PlanAmount;
                entity.DurationDays = request.DurationDays;
                entity.AssetLimit = request.AssetLimit;
                entity.SystemUserLimit = request.SystemUserLimit;
                entity.TotalUserLimit = request.TotalUserLimit;

                entity.ModifiedBy = user;
                entity.ModifiedDate = DateTime.Now;

                await _repo.UpdateAsync(entity);

                var company = await _context.CompanyInfo.FirstOrDefaultAsync(x => x.Id == companyId && !x.Cancelled);

                if (company == null)
                {
                    await transaction.RollbackAsync();
                    return (false, "Company not found", null!);
                }

                company.SubscriptionDate = request.SubscriptionDate;
                company.SubscriptionExpiryDate = request.SubscriptionExpiryDate;
                company.ModifiedBy = user;
                company.ModifiedDate = DateTime.Now;

                _context.CompanyInfo.Update(company);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, "Subscription updated successfully", _mapper.Map<SubscriptionDto>(entity));

            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error updating subscription");
                return (false, "Error updating subscription", null!);
            }
        }

        public async Task<(bool success, string message, SubscriptionDto data)> GetByIdAsync(long id)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);

                if (entity == null)
                    return (false, "Subscription not found", null!);

                var dto = _mapper.Map<SubscriptionDto>(entity);

                return (true, "Subscription retrieved", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving subscription");
                return (false, "Error retrieving subscription", null!);
            }
        }

        public async Task<(bool success, string message, IEnumerable<SubscriptionDto> data)> GetAllAsync()
        {
            try
            {
                var list = await _repo.GetAllAsync();

                var dto = _mapper.Map<IEnumerable<SubscriptionDto>>(list);

                return (true, "Subscriptions retrieved", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving subscriptions");
                return (false, "Error retrieving subscriptions", null!);
            }
        }

        public async Task<(bool success, string message)> DeleteAsync(long id, string user)
        {
            try
            {
                var result = await _repo.DeleteAsync(id, user);

                if (!result)
                    return (false, "Subscription not found");

                return (true, "Subscription deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting subscription");
                return (false, "Error deleting subscription");
            }
        }

        //public async Task<(bool success, string message, IEnumerable<SubscriptionDto> data)> GetByIsCustomAsync(bool isCustom)
        //{
        //    try
        //    {
        //        var list = await _repo.GetByIsCustomAsync(isCustom);

        //        var dto = _mapper.Map<IEnumerable<SubscriptionDto>>(list);

        //        return (true, "Subscriptions retrieved", dto);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error retrieving subscriptions by custom type");
        //        return (false, "Error retrieving subscriptions", null!);
        //    }
        //}
    }
}
