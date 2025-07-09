using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Server.IISIntegration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SAMS.Data;
using SAMS.Extensions;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.Functional.DTOs;
using SAMS.Services.Functional.Interface;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplicationServices(builder.Configuration);

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "SAMS API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.ApiKey,
        Scheme = JwtBearerDefaults.AuthenticationScheme.ToLowerInvariant(),
        In = ParameterLocation.Header,
        Name = "Authorization",
        BearerFormat = "JWT",
        Description = "Enter 'Bearer' [space] and then your valid token",
    });

    //c.AddSecurityRequirement(new OpenApiSecurityRequirement{
    //    {
    //        new OpenApiSecurityScheme
    //        {
    //            Reference = new OpenApiReference {
    //                Type = ReferenceType.SecurityScheme,
    //                Id = "Bearer"
    //            }
    //        },
    //        Array.Empty<string>()
    //    }
    //});
}
);

builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(60);
});

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events = new CookieAuthenticationEvents
    {
        OnValidatePrincipal = SecurityStampValidator.ValidatePrincipalAsync
    };

    options.ExpireTimeSpan = TimeSpan.FromHours(1);
    options.SlidingExpiration = true;
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        options.SaveToken = true;
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });


//Set Identity Options
var _IServiceScopeFactory = builder.Services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();
var _CreateScope = _IServiceScopeFactory.CreateScope();
var _ServiceProvider = _CreateScope.ServiceProvider;
var _context = _ServiceProvider.GetRequiredService<ApplicationDbContext>();
bool IsDBCanConnect = _context.Database.CanConnect();
if (IsDBCanConnect && _context.DefaultIdentityOption.Count() > 0)
{
    var _DefaultIdentityOptions = _context.DefaultIdentityOption.Where(x => x.Id == 1).SingleOrDefault();
    AddIdentityOptions.SetOptions(builder.Services, _DefaultIdentityOptions);
}
else
{
    IConfigurationSection _IConfigurationSection = builder.Configuration.GetSection("IdentityDefaultOptions");
    builder.Services.Configure<DefaultIdentityOptions>(_IConfigurationSection);
    var _DefaultIdentityOptions = _IConfigurationSection.Get<DefaultIdentityOptions>();
    AddIdentityOptions.SetOptions(builder.Services, _DefaultIdentityOptions);
}
builder.Services.Configure<SuperAdminDefaultOptions>(builder.Configuration.GetSection("SuperAdminDefaultOptions"));
builder.Services.AddSingleton(resolver =>
    resolver.GetRequiredService<IOptions<SuperAdminDefaultOptions>>().Value);

var app = builder.Build();

/*//using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var functional = services.GetRequiredService<IFunctionalService>();

        // First apply migrations and seed default data
        await DbInitializer.Initialize(context, functional);

        // Now safe to fetch identity options
        DefaultIdentityOptions? _DefaultIdentityOptions = await functional.GetDefaultIdentitySettings();
        if (_DefaultIdentityOptions != null)
        {
            AddIdentityOptions.SetOptions(builder.Services, _DefaultIdentityOptions);
        }
        else
        {
            IConfigurationSection _IConfigurationSection = builder.Configuration.GetSection("IdentityDefaultOptions");
            builder.Services.Configure<DefaultIdentityOptions>(_IConfigurationSection);
            _DefaultIdentityOptions = _IConfigurationSection.Get<DefaultIdentityOptions>();
            AddIdentityOptions.SetOptions(builder.Services, _DefaultIdentityOptions);
        }

        builder.Services.Configure<SuperAdminDefaultOptions>(builder.Configuration.GetSection("SuperAdminDefaultOptions"));
        builder.Services.AddSingleton(resolver =>
            resolver.GetRequiredService<IOptions<SuperAdminDefaultOptions>>().Value);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}
// Configure the HTTP request pipeline.*/

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseSession();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var functional = services.GetRequiredService<IFunctionalService>();

        DbInitializer.Initialize(context, functional).Wait();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}


app.Run();
