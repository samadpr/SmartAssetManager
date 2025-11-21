using Microsoft.EntityFrameworkCore;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Models.CommonModels;
using SAMS.Models.CommonModels.Interface;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Reflection;
using System.Reflection.Emit;

namespace SAMS.Data;

public partial class ApplicationDbContext : AuditableIdentityContext
{
    private readonly ICompanyContext _companyContext;

    public Guid CurrentOrganizationId => _companyContext?.OrganizationId ?? Guid.Empty;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ICompanyContext companyContext)
        : base(options)
    {
        _companyContext = companyContext;
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ItemDropdownListModel>().HasNoKey();

        builder.Entity<AssetRequest>()
            .HasOne(ar => ar.ApprovedByEmployee)
            .WithMany(up => up.AssetRequestApprovedByEmployees)
            .HasForeignKey(ar => ar.ApprovedByEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<AssetRequest>()
            .HasOne(ar => ar.RequestedEmployee)
            .WithMany(up => up.AssetRequestRequestedEmployees)
            .HasForeignKey(ar => ar.RequestedEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global tenant filter
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(IHasOrganization).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(ApplicationDbContext)
                    .GetMethod(nameof(GetOrganizationId), BindingFlags.Instance | BindingFlags.NonPublic);

                var param = Expression.Parameter(entityType.ClrType, "e");

                var orgProperty = Expression.Property(param, nameof(IHasOrganization.OrganizationId));

                var currentOrg = Expression.Call(Expression.Constant(this), method!);

                var body = Expression.Equal(orgProperty, currentOrg);

                var lambda = Expression.Lambda(body, param);

                builder.Entity(entityType.ClrType).HasQueryFilter(lambda);
            }
        }
    }

    private Guid GetOrganizationId()
    {
        return _companyContext.OrganizationId;
    }

    // ✅ FIX #1 – override NO-ARG version (base class version)
    public override async Task<int> SaveChangesAsync()
    {
        SetOrganizationForAddedEntities();
        return await base.SaveChangesAsync();
    }

    // ✅ FIX #2 – override CancellationToken version
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SetOrganizationForAddedEntities();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void SetOrganizationForAddedEntities()
    {
        var orgId = _companyContext?.OrganizationId ?? Guid.Empty;
        if (orgId == Guid.Empty) return;

        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added && e.Entity is IHasOrganization)
            .Select(e => e.Entity as IHasOrganization);

        foreach (var entity in entries)
        {
            if (entity.OrganizationId == Guid.Empty)
                entity.OrganizationId = orgId;
        }
    }

    public DbSet<ApplicationUser> ApplicationUsers { get; set; }

    public DbSet<UserProfile> UserProfiles { get; set; }

    public DbSet<SMTPEmailSetting> SMTPEmailSettings { get; set; }

    public DbSet<SendGridSetting> SendGridSettings { get; set; }

    public DbSet<DefaultIdentityOptions> DefaultIdentityOption { get; set; }

    public DbSet<LoginHistory> LoginHistory { get; set; }


    //SAMS
    public DbSet<Asset> Asset { get; set; }

    public DbSet<AssetAssigned> AssetAssigned { get; set; }

    public DbSet<AssetHistory> AssetHistory { get; set; }

    public DbSet<Comment> Comment { get; set; }

    public DbSet<Designation> Designation { get; set; }

    public DbSet<AssetCategorie> AssetCategorie { get; set; }

    public DbSet<AssetSubCategorie> AssetSubCategories { get; set; }

    public DbSet<AssetSite> AssetSite { get; set; }

    public DbSet<AssetArea> AssetArea { get; set; }

    public DbSet<AssetCity> AssetCities { get; set; }

    public DbSet<AssetStatus> AssetStatuses { get; set; }

    public DbSet<Supplier> Suppliers { get; set; }

    public DbSet<Department> Department { get; set; }

    public DbSet<SubDepartment> SubDepartment { get; set; }

    public DbSet<CompanyInfo> CompanyInfo { get; set; }

    public DbSet<Industries> Industries { get; set; }

    public DbSet<UserInfoFromBrowser> UserInfoFromBrowser { get; set; }

    public DbSet<AssetIssue> AssetIssue { get; set; }

    public DbSet<AssetRequest> AssetRequest { get; set; }

    public DbSet<SubscriptionRequest> SubscriptionRequest { get; set; }

    public DbSet<ManageUserRole> ManageUserRoles { get; set; }

    public DbSet<ManageUserRolesDetail> ManageUserRolesDetails { get; set; }

    public DbSet<ItemDropdownListModel> ItemDropdownListModel { get; set; }

}
