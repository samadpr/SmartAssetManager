namespace SAMS.Models.CommonModels
{
    public class JsonResultModel
    {
        public Int64 Id { get; set; }
        public string AlertMessage { get; set; }
        public string CurrentURL { get; set; }
        public bool IsSuccess { get; set; }
        public dynamic ModelObject { get; set; }
    }
}
