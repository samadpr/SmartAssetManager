using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages.Manage;
using SAMS.Models;
using SAMS.Services.Common.Interface;
using SAMS.Services.DesignationServices.DTOs;
using SAMS.Services.DesignationServices.Interface;

namespace SAMS.Services.DesignationServices
{
    public class DesignationService : IDesignationService
    {
        private readonly IDesignationRepository _repository;
        private readonly IMapper _mapper;
        private readonly ILogger<DesignationService> _logger;
        private readonly ICommonService _commonService;

        public DesignationService(IDesignationRepository repository, IMapper mapper, ILogger<DesignationService> logger, ICommonService commonService)
        {
            _repository = repository;
            _mapper = mapper;
            _logger = logger;
            _commonService = commonService;
        }

        public async Task<DesignationDto> AddDesignationAsync(DesignationDto dto, string createdBy)
        {
            try
            {
                var entity = _mapper.Map<Designation>(dto);
                entity.CreatedDate = DateTime.UtcNow;
                entity.ModifiedDate = DateTime.UtcNow;
                entity.CreatedBy = createdBy;
                entity.ModifiedBy = createdBy;

                var result = await _repository.AddAsync(entity, createdBy);
                if (result == null) return null!;
                return _mapper.Map<DesignationDto>(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the designation.");
                throw new Exception("An error occurred while adding the designation.", ex);
            }

        }


        public async Task<IEnumerable<Designation>> GetUserDesignationsAsync(string email)
        {
            try
            {
                var designations = await _repository.GetDesignationsCreatedByAsync(email);
                return designations;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving the designation.");
                throw new Exception("An error occurred while retrieving the designation.", ex);
            }
        }

        public async Task<DesignationDto?> UpdateDesignationAsync(DesignationDto dto, string modifiedBy)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(dto.Id);
                if (entity == null) return null;

                entity.Name = dto.Name;
                entity.Description = dto.Description;
                entity.ModifiedDate = DateTime.UtcNow;
                entity.ModifiedBy = modifiedBy;

                var result = await _repository.UpdateAsync(entity);
                return _mapper.Map<DesignationDto>(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating the designation.");
                throw new Exception("An error occurred while updating the designation.", ex);
            }
        }


        public async Task<bool> DeleteDesignationAsync(int id, string modifiedBy)
        {
            try
            {
                var _Designation = await _repository.GetByIdAsync(id);
                if (_Designation == null) return false;
                _Designation.ModifiedDate = DateTime.Now;
                _Designation.ModifiedBy = modifiedBy;
                _Designation.Cancelled = true;

                await _repository.UpdateAsync(_Designation);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while deleting the designation.");
                throw new Exception("An error occurred while deleting the designation.", ex);
            }
        }

        public async Task<IEnumerable<Designation>> GetAllDesignationAsync()
        {
            try
            {
                var designation = await _repository.GetAllAsync();
                return designation;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving the designation.");
                throw new Exception("An error occurred while retrieving the designation.", ex);
            }
        }

        public async Task<Designation?> GetDesignationByIdAsync(int id, string email)
        {
            try
            {
                var emails = await _commonService.GetEmailsUnderAdminAsync(email);

                var designation = await _repository.GetByIdAsync(id);
                if (emails.Contains(designation.CreatedBy))
                {
                    return designation;
                }
                return null;
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving the designation by id.");
                throw new Exception("An error occurred while retrieving the designation by id.", ex);
            }
        }

        public async Task<List<Designation>> GetDesignationAsync(string targetUserEmail)
        {
            var emails = await _commonService.GetEmailsUnderAdminAsync(targetUserEmail);

            var designations = await _repository.GetDesignationsForUserAsync(emails.ToList());

            return designations;
        }
    }
}
