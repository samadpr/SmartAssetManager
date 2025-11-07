using SAMS.Models;

namespace SAMS.Services.Industries.Interface
{
    public interface IIndustriesService
    {
        Task<(bool IsSuccess, string message, List<Models.Industries> Industries)> GetAllIndustries();
    }
}
