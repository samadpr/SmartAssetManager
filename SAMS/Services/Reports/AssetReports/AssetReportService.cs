using SAMS.Helpers;
using SAMS.Services.Reports.AssetReports.DTOs;
using SAMS.Services.Reports.AssetReports.Interface;
using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Services.Reports.AssetReports
{
    public class AssetReportService : IAssetReportService
    {
        private readonly IAssetReportRepository _repo;
        private readonly ILogger<AssetReportService> _logger;
        private readonly ICompanyContext _companyContext;
        public AssetReportService(IAssetReportRepository repo, ILogger<AssetReportService> logger, ICompanyContext companyContext)
        {
            _repo = repo;
            _logger = logger;
            _companyContext = companyContext;
        }

        public async Task<(bool success, string message, IEnumerable<AssetReportDto> data)> GetAssetFullInfoReportByOrg()
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var assets = await _repo.GetAssetFullInfoReportByOrg(orgId);
                if (assets == null)
                {
                    return (false, "Assets not found", null);
                }
                return (true, "Success", assets);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex.Message);
                return (false, ex.Message, null);
            }
        }


        public async Task<(bool success, string message, IEnumerable<AssetReportDepreciationDto> data)> GetAssetDepreciationReportByOrg()
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var assets = await _repo.GetAssetDepreciationReportByOrg(orgId);

                foreach (var asset in assets)
                {
                    if (asset.IsDepreciable &&
                        asset.DateOfPurchase.HasValue &&
                        asset.DepreciationMethod.HasValue &&
                        asset.DepreciationInMonth.HasValue &&
                        asset.DepreciationInMonth.Value > 0 &&
                        asset.DepreciableCost.HasValue)
                    {
                        asset.DepreciationSchedule = await CalculateDepreciationScheduleAsync(asset);
                    }
                    else
                    {
                        asset.DepreciationSchedule = new List<AssetDepreciationDto>();
                    }
                }
                return (true, "Success", assets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return (false, ex.Message, null);
            }
        }

        public async Task<(bool success, string message, IEnumerable<AssetDisposalReportDto> data)> GetAssetDisposalReportByOrg()
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var assets = await _repo.GetAssetDisposalReportByOrg(orgId);
                
                return (true, "Success", assets);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message, "GetAssetDisposalReportByOrg");
                return (false, ex.Message, null);
            }
        }

        public async Task<List<AssetDepreciationDto>> CalculateDepreciationScheduleAsync(AssetReportDto asset)
        {
            var schedule = new List<AssetDepreciationDto>();

            if (!asset.IsDepreciable || !asset.DateOfPurchase.HasValue || !asset.DepreciationMethod.HasValue)
                return schedule;

            try
            {
                switch (asset.DepreciationMethod.Value)
                {
                    case DepreciationMethod.StraightLine:
                        schedule = CalculateStraightLine(asset);
                        break;

                    case DepreciationMethod.DecliningBalance:
                        schedule = CalculateDecliningBalance(asset, 1.0m);
                        break;

                    case DepreciationMethod.DoubleDecliningBalance:
                        schedule = CalculateDecliningBalance(asset, 2.0m);
                        break;

                    case DepreciationMethod.OneFiftyDecliningBalance:
                        schedule = CalculateDecliningBalance(asset, 1.5m);
                        break;

                    case DepreciationMethod.SumOfYearsDigits:
                        schedule = CalculateSumOfYearsDigits(asset);
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating depreciation schedule");
            }

            return schedule;
        }

        private List<AssetDepreciationDto> CalculateStraightLine(AssetReportDto asset)
        {
            var schedule = new List<AssetDepreciationDto>();

            decimal assetCost = (asset.DepreciableCost ?? 0) - (asset.SalvageValue ?? 0);
            int depreciationMonths = asset.DepreciationInMonth ?? 0;

            if (assetCost <= 0 || depreciationMonths <= 0)
                return schedule;

            decimal currentYearMonths = 12 - asset.DateOfPurchase.Value.Month + 1;
            decimal noOfYears = depreciationMonths / 12m;
            decimal depreciationPerMonth = assetCost / depreciationMonths;
            decimal depreciationPerYear = depreciationPerMonth * 12;
            decimal bookValueYearEnd = 0;

            for (int i = 0; i < noOfYears; i++)
            {
                var yearSchedule = new AssetDepreciationDto
                {
                    Year = asset.DateOfPurchase.Value.Year + i
                };

                if (i == 0)
                {
                    yearSchedule.BookValueYearBegining = Math.Round(assetCost, 2);
                    yearSchedule.Depreciation = Math.Round(depreciationPerMonth * currentYearMonths, 2);
                    yearSchedule.BookValueYearEnd = Math.Round(assetCost - yearSchedule.Depreciation, 2);
                }
                else
                {
                    yearSchedule.BookValueYearBegining = Math.Round(bookValueYearEnd, 2);
                    yearSchedule.Depreciation = Math.Round(depreciationPerYear, 2);
                    yearSchedule.BookValueYearEnd = Math.Round(yearSchedule.BookValueYearBegining - depreciationPerYear, 2);
                }

                bookValueYearEnd = yearSchedule.BookValueYearEnd;
                schedule.Add(yearSchedule);
            }

            return schedule;
        }

        private List<AssetDepreciationDto> CalculateDecliningBalance(AssetReportDto asset, decimal multiplier)
        {
            var schedule = new List<AssetDepreciationDto>();

            decimal assetCost = asset.DepreciableCost ?? 0;
            int depreciationMonths = asset.DepreciationInMonth ?? 0;

            if (assetCost <= 0 || depreciationMonths <= 0)
                return schedule;

            decimal currentYearMonths = 12 - asset.DateOfPurchase.Value.Month + 1;
            decimal noOfYears = depreciationMonths / 12m;
            decimal depreciationRatePerYear = (100m / noOfYears) * multiplier;
            decimal depreciationRatePerMonth = depreciationRatePerYear / 12m;
            decimal bookValueYearEnd = 0;

            for (int i = 0; i < noOfYears; i++)
            {
                var yearSchedule = new AssetDepreciationDto
                {
                    Year = asset.DateOfPurchase.Value.Year + i
                };

                if (i == 0)
                {
                    yearSchedule.BookValueYearBegining = Math.Round(assetCost, 2);
                    yearSchedule.Depreciation = Math.Round(
                        assetCost * (depreciationRatePerMonth * currentYearMonths) / 100m, 2);
                    yearSchedule.BookValueYearEnd = Math.Round(
                        assetCost - yearSchedule.Depreciation, 2);
                }
                else
                {
                    yearSchedule.BookValueYearBegining = Math.Round(bookValueYearEnd, 2);
                    yearSchedule.Depreciation = Math.Round(
                        bookValueYearEnd * depreciationRatePerYear / 100m, 2);
                    yearSchedule.BookValueYearEnd = Math.Round(
                        yearSchedule.BookValueYearBegining - yearSchedule.Depreciation, 2);
                }

                bookValueYearEnd = yearSchedule.BookValueYearEnd;
                schedule.Add(yearSchedule);
            }

            return schedule;
        }

        private List<AssetDepreciationDto> CalculateSumOfYearsDigits(AssetReportDto asset)
        {
            var schedule = new List<AssetDepreciationDto>();

            decimal assetCost = (asset.DepreciableCost ?? 0) - (asset.SalvageValue ?? 0);
            int depreciationMonths = asset.DepreciationInMonth ?? 0;

            if (assetCost <= 0 || depreciationMonths <= 0)
                return schedule;

            decimal currentYearMonths = 12 - asset.DateOfPurchase.Value.Month + 1;
            int noOfYears = depreciationMonths / 12;
            decimal bookValueYearEnd = 0;

            // Calculate sum of years
            int sumOfYears = 0;
            for (int i = 1; i <= noOfYears; i++)
            {
                sumOfYears += i;
            }

            for (int i = 0; i < noOfYears; i++)
            {
                var yearSchedule = new AssetDepreciationDto
                {
                    Year = asset.DateOfPurchase.Value.Year + i
                };

                if (i == 0)
                {
                    decimal depreciationRatePerMonth = (noOfYears / (decimal)sumOfYears) / 12m;
                    yearSchedule.BookValueYearBegining = Math.Round(assetCost, 2);
                    yearSchedule.Depreciation = Math.Round(
                        assetCost * depreciationRatePerMonth * currentYearMonths, 2);
                    yearSchedule.BookValueYearEnd = Math.Round(
                        assetCost - yearSchedule.Depreciation, 2);
                }
                else
                {
                    decimal depreciationRatePerYear = (noOfYears - i) / (decimal)sumOfYears;
                    yearSchedule.BookValueYearBegining = Math.Round(bookValueYearEnd, 2);
                    yearSchedule.Depreciation = Math.Round(
                        assetCost * depreciationRatePerYear, 2);
                    yearSchedule.BookValueYearEnd = Math.Round(
                        yearSchedule.BookValueYearBegining - yearSchedule.Depreciation, 2);
                }

                bookValueYearEnd = yearSchedule.BookValueYearEnd;
                schedule.Add(yearSchedule);
            }

            return schedule;
        }


    }
}
