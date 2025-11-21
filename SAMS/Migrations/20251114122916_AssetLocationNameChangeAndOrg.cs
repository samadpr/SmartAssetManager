using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAMS.Migrations
{
    /// <inheritdoc />
    public partial class AssetLocationNameChangeAndOrg : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Asset_AssetLocation_LocationNavigationId",
                table: "Asset");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetAssigned_AssetLocation_LocationId",
                table: "AssetAssigned");

            migrationBuilder.DropForeignKey(
                name: "FK_UserProfiles_AssetLocation_LocationNavigationId",
                table: "UserProfiles");

            migrationBuilder.DropIndex(
                name: "IX_AssetAssigned_LocationId",
                table: "AssetAssigned");

            migrationBuilder.RenameColumn(
                name: "LocationNavigationId",
                table: "UserProfiles",
                newName: "AreaNavigationId");

            migrationBuilder.RenameIndex(
                name: "IX_UserProfiles_LocationNavigationId",
                table: "UserProfiles",
                newName: "IX_UserProfiles_AreaNavigationId");

            migrationBuilder.RenameColumn(
                name: "Location",
                table: "AssetSite",
                newName: "Area");

            migrationBuilder.RenameColumn(
                name: "LocationNavigationId",
                table: "Asset",
                newName: "AreaNavigationId");

            migrationBuilder.RenameIndex(
                name: "IX_Asset_LocationNavigationId",
                table: "Asset",
                newName: "IX_Asset_AreaNavigationId");

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId",
                table: "AssetSite",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<long>(
                name: "AreaId",
                table: "AssetAssigned",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssetAssigned_AreaId",
                table: "AssetAssigned",
                column: "AreaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Asset_AssetLocation_AreaNavigationId",
                table: "Asset",
                column: "AreaNavigationId",
                principalTable: "AssetLocation",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetAssigned_AssetLocation_AreaId",
                table: "AssetAssigned",
                column: "AreaId",
                principalTable: "AssetLocation",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserProfiles_AssetLocation_AreaNavigationId",
                table: "UserProfiles",
                column: "AreaNavigationId",
                principalTable: "AssetLocation",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Asset_AssetLocation_AreaNavigationId",
                table: "Asset");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetAssigned_AssetLocation_AreaId",
                table: "AssetAssigned");

            migrationBuilder.DropForeignKey(
                name: "FK_UserProfiles_AssetLocation_AreaNavigationId",
                table: "UserProfiles");

            migrationBuilder.DropIndex(
                name: "IX_AssetAssigned_AreaId",
                table: "AssetAssigned");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "AssetSite");

            migrationBuilder.DropColumn(
                name: "AreaId",
                table: "AssetAssigned");

            migrationBuilder.RenameColumn(
                name: "AreaNavigationId",
                table: "UserProfiles",
                newName: "LocationNavigationId");

            migrationBuilder.RenameIndex(
                name: "IX_UserProfiles_AreaNavigationId",
                table: "UserProfiles",
                newName: "IX_UserProfiles_LocationNavigationId");

            migrationBuilder.RenameColumn(
                name: "Area",
                table: "AssetSite",
                newName: "Location");

            migrationBuilder.RenameColumn(
                name: "AreaNavigationId",
                table: "Asset",
                newName: "LocationNavigationId");

            migrationBuilder.RenameIndex(
                name: "IX_Asset_AreaNavigationId",
                table: "Asset",
                newName: "IX_Asset_LocationNavigationId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetAssigned_LocationId",
                table: "AssetAssigned",
                column: "LocationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Asset_AssetLocation_LocationNavigationId",
                table: "Asset",
                column: "LocationNavigationId",
                principalTable: "AssetLocation",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetAssigned_AssetLocation_LocationId",
                table: "AssetAssigned",
                column: "LocationId",
                principalTable: "AssetLocation",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserProfiles_AssetLocation_LocationNavigationId",
                table: "UserProfiles",
                column: "LocationNavigationId",
                principalTable: "AssetLocation",
                principalColumn: "Id");
        }
    }
}
