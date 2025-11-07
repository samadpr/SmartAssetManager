using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Company.Interface;

namespace SAMS.Services.Company
{
    public class CompanyRepository : ICompanyRepository
    {
        private readonly ApplicationDbContext _context;

        public CompanyRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<(bool, string)> AddCompanyAsync(CompanyInfo companyInfo)
        {
            try
            {

                // Only check for duplicates if Email is provided (non-null and not empty)
                if (!string.IsNullOrWhiteSpace(companyInfo.Email))
                {
                    bool emailExists = await _context.CompanyInfo.AnyAsync(c => c.Email != null && c.Email.ToLower() == companyInfo.Email.ToLower() && !c.Cancelled);

                    if (emailExists)
                    {
                        return (false, "Company with the same email already exists");
                    }
                }
                _context.CompanyInfo.Add(companyInfo);
                await _context.SaveChangesAsync();
                return (true, "Company added successfully");
            }
            catch(Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public async Task<(bool success, string message, CompanyInfo? company)> GetCompanyByIdAndOrganizationAsync(Guid? OrganizationId, long id)
        {
            try
            {
                var companyById = await _context.CompanyInfo.Where(c => c.OrganizationId == OrganizationId && c.Id == id && !c.Cancelled).FirstOrDefaultAsync();
                if (companyById == null)
                    return (false, "Company not found", null!);
                return (true, "Company found successfully", companyById);
            }
            catch(Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public async Task<(bool, string, CompanyInfo)> GetCompaniesAsync(Guid? OrganizationId)
        {
            try
            {
                var company = await _context.CompanyInfo.FirstOrDefaultAsync(c => c.OrganizationId == OrganizationId && !c.Cancelled);
                if (company == null)
                    return (false, "No companies found", null!);
                return (true, "Companies found successfully", company);
            }
            catch(Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public Task<(bool, string)> UpdateCompanyAsync(CompanyInfo companyInfo)
        {
            try
            {
                _context.CompanyInfo.Update(companyInfo);
                _context.SaveChanges();
                return Task.FromResult((true, "Company updated successfully"));
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public async Task<(bool success, string message, CompanyInfo? company)> GetCompaniesByIdAsync(long id)
        {
            try
            {
                var company = await _context.CompanyInfo.FirstOrDefaultAsync(c => c.Id == id && !c.Cancelled);
                if (company == null)
                    return (false, "No companies found", null!);
                return (true, "Companies found successfully", company);
            }
            catch(Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }
    }
}
