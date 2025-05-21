using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace SAMS.Controllers
{
    [Route("sams/api/v1/")]
    [ApiController]
    public abstract class BaseApiController<T> : ControllerBase
    {
    }
}
