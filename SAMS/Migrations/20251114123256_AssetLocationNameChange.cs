using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAMS.Migrations
{
    /// <inheritdoc />
    public partial class AssetLocationNameChange : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Asset_AssetLocation_AreaNavigationId",
                table: "Asset");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetAssigned_AssetLocation_AreaId",
                table: "AssetAssigned");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetLocation_AssetSite_SiteId",
                table: "AssetLocation");

            migrationBuilder.DropForeignKey(
                name: "FK_UserProfiles_AssetLocation_AreaNavigationId",
                table: "UserProfiles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AssetLocation",
                table: "AssetLocation");

            migrationBuilder.RenameTable(
                name: "AssetLocation",
                newName: "AssetArea");

            migrationBuilder.RenameIndex(
                name: "IX_AssetLocation_SiteId",
                table: "AssetArea",
                newName: "IX_AssetArea_SiteId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AssetArea",
                table: "AssetArea",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Asset_AssetArea_AreaNavigationId",
                table: "Asset",
                column: "AreaNavigationId",
                principalTable: "AssetArea",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetArea_AssetSite_SiteId",
                table: "AssetArea",
                column: "SiteId",
                principalTable: "AssetSite",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetAssigned_AssetArea_AreaId",
                table: "AssetAssigned",
                column: "AreaId",
                principalTable: "AssetArea",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserProfiles_AssetArea_AreaNavigationId",
                table: "UserProfiles",
                column: "AreaNavigationId",
                principalTable: "AssetArea",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Asset_AssetArea_AreaNavigationId",
                table: "Asset");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetArea_AssetSite_SiteId",
                table: "AssetArea");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetAssigned_AssetArea_AreaId",
                table: "AssetAssigned");

            migrationBuilder.DropForeignKey(
                name: "FK_UserProfiles_AssetArea_AreaNavigationId",
                table: "UserProfiles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AssetArea",
                table: "AssetArea");

            migrationBuilder.RenameTable(
                name: "AssetArea",
                newName: "AssetLocation");

            migrationBuilder.RenameIndex(
                name: "IX_AssetArea_SiteId",
                table: "AssetLocation",
                newName: "IX_AssetLocation_SiteId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AssetLocation",
                table: "AssetLocation",
                column: "Id");

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
                name: "FK_AssetLocation_AssetSite_SiteId",
                table: "AssetLocation",
                column: "SiteId",
                principalTable: "AssetSite",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserProfiles_AssetLocation_AreaNavigationId",
                table: "UserProfiles",
                column: "AreaNavigationId",
                principalTable: "AssetLocation",
                principalColumn: "Id");
        }
    }
}
