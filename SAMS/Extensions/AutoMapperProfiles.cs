using AutoMapper;
using SAMS.API.Account.RequestObject;
using SAMS.API.DesignationAPIs.RequestObject;
using SAMS.Models;
using SAMS.Services.Account.DTOs;
using SAMS.Services.DesignationServices.DTOs;

namespace SAMS.Extensions
{
    public class AutoMapperProfiles : Profile
    {
        public AutoMapperProfiles()
        {
            CreateMap<RegisterRequestObject, RegisterRequestDto>().ReverseMap();

            CreateMap<LoginRequestObject, LoginRequestDto>().ReverseMap();

            CreateMap<DesignationRequestObject, DesignationDto>().ReverseMap();

            CreateMap<Designation, DesignationDto>().ReverseMap();
        }
    }
}
