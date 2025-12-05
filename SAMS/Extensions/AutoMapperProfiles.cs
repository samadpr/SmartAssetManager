using AutoMapper;
using SAMS.API.Account.RequestObject;
using SAMS.API.AssetAreaAPIs.RequestObject;
using SAMS.API.AssetCategoriesAPIs.RequestObject;
using SAMS.API.AssetCitiesAPIs.RequestObject;
using SAMS.API.AssetSitesOrBranchAPIs.RequestObject;
using SAMS.API.AssetSubCategoriesAPIs.RequestObject;
using SAMS.API.CompanyAPIs.RequestObject;
using SAMS.API.DepartmentAPIs.RequstObject;
using SAMS.API.DesignationAPIs.RequestObject;
using SAMS.API.ManageUserRolesAPIs.RequestObject;
using SAMS.API.SubDepartmentAPIs.RequestObject;
using SAMS.API.SupplierAPIs.RequestObject;
using SAMS.API.UserProfileAPIs.RequestObject;
using SAMS.Models;
using SAMS.Services.Account.DTOs;
using SAMS.Services.AssetAreas.DTOs;
using SAMS.Services.AssetCategory.DTOs;
using SAMS.Services.AssetSitesOrBranches.DTOs;
using SAMS.Services.AssetSubCategory.DTOs;
using SAMS.Services.Cities.DTOs;
using SAMS.Services.Departments.DTOs;
using SAMS.Services.DesignationServices.DTOs;
using SAMS.Services.ManageUserRoles.DTOs;
using SAMS.Services.SubDepartments.DTOs;
using SAMS.Services.Suppliers.DTOs;
using SAMS.Services.UserProfiles.DTOs;

namespace SAMS.Extensions
{
    public class AutoMapperProfiles : Profile
    {
        public AutoMapperProfiles()
        {
            CreateMap<RegisterRequestObject, RegisterRequestDto>().ReverseMap();

            CreateMap<LoginRequestObject, LoginRequestDto>().ReverseMap();

            CreateMap<DesignationRequest, DesignationDto>().ReverseMap();

            CreateMap<Designation, DesignationDto>().ReverseMap();

            CreateMap<ManageUserRoleRequest, ManageUserRolesDto>().ReverseMap();

            CreateMap<ManageRoleDetailsRequest, ManageUserRolesDetailsDto>().ReverseMap();

            CreateMap<ManageUserRolesDto, ManageUserRole>().ReverseMap();

            CreateMap<UserRoleRequest, ManageUserRolesDto>().ReverseMap();

            CreateMap<ManageUserRolesDetail, ManageUserRolesDetailsDto>().ReverseMap();

            CreateMap<UserProfileRequestObject, UserProfileDto>().ReverseMap();

            CreateMap<UserProfileDto, UserProfile>().ReverseMap();

            CreateMap<DepartmentRequest, DepartmentDto>().ReverseMap();

            CreateMap<DepartmentDto, Department>().ReverseMap();

            CreateMap<SubDepartment, SubDepartmentDto>().ReverseMap();
            
            CreateMap<SubDepartmentRequest, SubDepartmentDto>().ReverseMap();

            CreateMap<CompanyRequestObject, CompanyInfo>().ReverseMap();

            CreateMap<AssetCity, AssetCityDto>().ReverseMap();

            CreateMap<AssetCitiesRequestObject, AssetCityDto>().ReverseMap();

            CreateMap<AssetSOBRequestObject, AssetSiteDto>().ReverseMap();

            CreateMap<AssetSite, AssetSiteDto>().ReverseMap();

            CreateMap<AssetAreaRequestObject, AssetAreaDto>().ReverseMap();

            CreateMap<AssetArea, AssetAreaDto>().ReverseMap();

            CreateMap<AssetCategoriesRequestObject, AssetCategoryDto>().ReverseMap();

            CreateMap<AssetCategoryDto, AssetCategorie>().ReverseMap();

            CreateMap<AssetSubCategoriesRequestObject, AssetSubCategoryDto>().ReverseMap();

            CreateMap<AssetSubCategoryDto, AssetSubCategorie>().ReverseMap();

            CreateMap<SuppliersRequestObject, SupplierDto>().ReverseMap();

            CreateMap<SupplierDto, Supplier>().ReverseMap();
        }
    }
}
