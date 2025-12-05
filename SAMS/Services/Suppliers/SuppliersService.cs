using AutoMapper;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.AssetSubCategory;
using SAMS.Services.Suppliers.DTOs;
using SAMS.Services.Suppliers.Interface;

namespace SAMS.Services.Suppliers
{
    public class SuppliersService : ISuppliersService
    {
        private readonly ILogger<SuppliersService> _logger;
        private readonly IMapper _mapper;
        private readonly ICompanyContext _companyContext;
        private readonly ISuppliersRepository _repo;

        public SuppliersService(ILogger<SuppliersService> logger, IMapper mapper, ICompanyContext companyContext, ISuppliersRepository suppliersRepository)
        {
            _logger = logger;
            _mapper = mapper;
            _companyContext = companyContext;
            _repo = suppliersRepository;
        }

        public async Task<(bool success, string message, SupplierDto? data)> CreateAsync(SupplierDto dto, string createdBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                if (await _repo.ExistsAsync(dto.Name!, orgId))
                    return (false, $"Supplier '{dto.Name}' already exists.", null);

                var entity = _mapper.Map<Supplier>(dto);
                entity.OrganizationId = orgId;
                entity.CreatedBy = createdBy;
                entity.ModifiedBy = createdBy;
                entity.CreatedDate = DateTime.Now;
                entity.ModifiedDate = DateTime.Now;

                var result = await _repo.AddAsync(entity);
                return (true, "Created Successfully", _mapper.Map<SupplierDto>(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating supplier");
                return (false, "Error creating supplier", null);
            }
        }

        public async Task<(bool success, string message, SupplierDto? data)> UpdateAsync(SupplierDto dto, string modifiedBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                var entity = await _repo.GetByIdAsync(dto.Id!.Value, orgId);

                if (entity == null)
                    return (false, "Not found in your organization", null);

                entity.Name = dto.Name;
                entity.Email = dto.Email;
                entity.Phone = dto.Phone;
                entity.ContactPerson = dto.ContactPerson;
                entity.TradeLicense = dto.TradeLicense;
                entity.Address = dto.Address;
                entity.ModifiedBy = modifiedBy;
                entity.ModifiedDate = DateTime.Now;

                await _repo.UpdateAsync(entity);

                return (true, "Updated Successfully", _mapper.Map<SupplierDto>(entity));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating supplier");
                return (false, "Error updating supplier", null);
            }
        }

        public async Task<(bool success, string message, IEnumerable<Supplier>? data)> GetByOrganizationAsync()
        {
            var orgId = _companyContext.OrganizationId;
            var list = await _repo.GetByOrganizationAsync(orgId);

            return (true, "Fetched Successfully", list);
        }

        public async Task<(bool success, string message)> DeleteAsync(long id, string deletedBy)
        {
            var orgId = _companyContext.OrganizationId;
            var result = await _repo.SoftDeleteAsync(id, orgId, deletedBy);

            return result
                ? (true, "Deleted Successfully")
                : (false, "Not Found");
        }

        public async Task<SupplierDto> GetByIdAsync(long? id, Guid organizationId)
        {
            try
            {
                if (id != null)
                {
                    var entity = await _repo.GetByIdAsync(id.Value, organizationId);
                    return _mapper.Map<SupplierDto>(entity);
                }
                return null!;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching supplier by ID");
                return null!;
            }
        }
    }
}
