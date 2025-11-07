namespace SAMS.Services.Industries.Interface
{
    public interface IIndustriesRepository
    {
        public Task<List<Models.Industries>> GetAllIndustries();
    }
}
