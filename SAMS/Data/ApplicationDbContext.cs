using System;
using System.Collections.Generic;
using System.Reflection.Emit;
using Microsoft.EntityFrameworkCore;
using SAMS.Models;
using SAMS.Models.CommonModels;

namespace SAMS.Data;

public partial class ApplicationDbContext : AuditableIdentityContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }
    //protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    //{
    //    optionsBuilder.UseSqlServer("Data Source=DESKTOP-9CU5AV4\\SQLEXPRESS;Initial Catalog=SAMS_DB;Integrated Security=True;Trust Server Certificate=True");
    //}

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<ItemDropdownListModel>().HasNoKey();

        builder.Entity<AssetRequest>()
        .HasOne(ar => ar.ApprovedByEmployee)
        .WithMany(up => up.AssetRequestApprovedByEmployees)
        .HasForeignKey(ar => ar.ApprovedByEmployeeId)
        .OnDelete(DeleteBehavior.Restrict); // Avoid cascade issues

        builder.Entity<AssetRequest>()
            .HasOne(ar => ar.RequestedEmployee)
            .WithMany(up => up.AssetRequestRequestedEmployees)
            .HasForeignKey(ar => ar.RequestedEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public DbSet<ApplicationUser> ApplicationUsers { get; set; }

    public DbSet<UserProfile> UserProfiles { get; set; }

    public DbSet<SMTPEmailSetting> SMTPEmailSettings { get; set; }

    public DbSet<SendGridSetting> SendGridSettings { get; set; }

    public DbSet<DefaultIdentityOptions> DefaultIdentityOption { get; set; }

    public DbSet<LoginHistory> LoginHistory { get; set; }


    //AMS
    public DbSet<Asset> Asset { get; set; }

    public DbSet<AssetAssigned> AssetAssigned { get; set; }

    public DbSet<AssetHistory> AssetHistory { get; set; }

    public DbSet<Comment> Comment { get; set; }

    public DbSet<Designation> Designation { get; set; }

    public DbSet<AssetCategorie> AssetCategorie { get; set; }

    public DbSet<AssetSubCategorie> AssetSubCategories { get; set; }

    public DbSet<AssetSite> AssetSite { get; set; }

    public DbSet<AssetLocation> AssetLocation { get; set; }

    public DbSet<AssetCity> AssetCities { get; set; }

    public DbSet<AssetStatus> AssetStatuses { get; set; }

    public DbSet<Supplier> Suppliers { get; set; }

    public DbSet<Department> Department { get; set; }

    public DbSet<SubDepartment> SubDepartment { get; set; }

    public DbSet<CompanyInfo> CompanyInfo { get; set; }

    public DbSet<UserInfoFromBrowser> UserInfoFromBrowser { get; set; }

    public DbSet<AssetIssue> AssetIssue { get; set; }

    public DbSet<AssetRequest> AssetRequest { get; set; }

    public DbSet<SubscriptionRequest> SubscriptionRequest { get; set; }

    public DbSet<ManageUserRole> ManageUserRoles { get; set; }

    public DbSet<ManageUserRolesDetail> ManageUserRolesDetails { get; set; }

    public DbSet<ItemDropdownListModel> ItemDropdownListModel { get; set; }

}
