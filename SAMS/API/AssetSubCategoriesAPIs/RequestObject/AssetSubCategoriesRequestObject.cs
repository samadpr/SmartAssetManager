namespace SAMS.API.AssetSubCategoriesAPIs.RequestObject
{
    public class AssetSubCategoriesRequestObject
    {
        public long? Id { get; set; }

        public long AssetCategorieId { get; set; }

        public string? Name { get; set; }

        public string? Description { get; set; }
    }
}
