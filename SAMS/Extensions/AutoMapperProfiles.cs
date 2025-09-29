using AutoMapper;
using SAMS.API.Account.RequestObject;
using SAMS.API.DepartmentAPIs.RequstObject;
using SAMS.API.DesignationAPIs.RequestObject;
using SAMS.API.ManageUserRolesAPIs.RequestObject;
using SAMS.API.SubDepartmentAPIs.RequestObject;
using SAMS.API.UserProfileAPIs.RequestObject;
using SAMS.Models;
using SAMS.Services.Account.DTOs;
using SAMS.Services.Departments.DTOs;
using SAMS.Services.DesignationServices.DTOs;
using SAMS.Services.ManageUserRoles.DTOs;
using SAMS.Services.SubDepartments.DTOs;
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

        }
    }
}
