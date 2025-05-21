using AutoMapper;
using SAMS.API.Account.RequestObject;
using SAMS.Services.Account.DTOs;

namespace SAMS.Extensions
{
    public class AutoMapperProfiles : Profile
    {
        public AutoMapperProfiles()
        {
            CreateMap<RegisterRequestObject, RegisterRequestDto>().ReverseMap();

            CreateMap<LoginRequestObject, LoginRequestDto>().ReverseMap();
        }
    }
}
