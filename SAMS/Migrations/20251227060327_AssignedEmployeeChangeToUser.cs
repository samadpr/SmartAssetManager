using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAMS.Migrations
{
    /// <inheritdoc />
    public partial class AssignedEmployeeChangeToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Asset_UserProfiles_AssignEmployeeUserProfileId",
                table: "Asset");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetAssigned_UserProfiles_EmployeeId",
                table: "AssetAssigned");

            migrationBuilder.DropIndex(
                name: "IX_Asset_AssignEmployeeUserProfileId",
                table: "Asset");

            migrationBuilder.DropColumn(
                name: "AssignEmployeeUserProfileId",
                table: "Asset");

            migrationBuilder.RenameColumn(
                name: "EmployeeId",
                table: "UserProfiles",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "EmployeeIdFrom",
                table: "AssetAssigned",
                newName: "UserIdFrom");

            migrationBuilder.RenameColumn(
                name: "EmployeeId",
                table: "AssetAssigned",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_AssetAssigned_EmployeeId",
                table: "AssetAssigned",
                newName: "IX_AssetAssigned_UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Asset_AssignUserId",
                table: "Asset",
                column: "AssignUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Asset_UserProfiles_AssignUserId",
                table: "Asset",
                column: "AssignUserId",
                principalTable: "UserProfiles",
                principalColumn: "UserProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetAssigned_UserProfiles_UserId",
                table: "AssetAssigned",
                column: "UserId",
                principalTable: "UserProfiles",
                principalColumn: "UserProfileId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Asset_UserProfiles_AssignUserId",
                table: "Asset");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetAssigned_UserProfiles_UserId",
                table: "AssetAssigned");

            migrationBuilder.DropIndex(
                name: "IX_Asset_AssignUserId",
                table: "Asset");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "UserProfiles",
                newName: "EmployeeId");

            migrationBuilder.RenameColumn(
                name: "UserIdFrom",
                table: "AssetAssigned",
                newName: "EmployeeIdFrom");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "AssetAssigned",
                newName: "EmployeeId");

            migrationBuilder.RenameIndex(
                name: "IX_AssetAssigned_UserId",
                table: "AssetAssigned",
                newName: "IX_AssetAssigned_EmployeeId");

            migrationBuilder.AddColumn<long>(
                name: "AssignEmployeeUserProfileId",
                table: "Asset",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Asset_AssignEmployeeUserProfileId",
                table: "Asset",
                column: "AssignEmployeeUserProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_Asset_UserProfiles_AssignEmployeeUserProfileId",
                table: "Asset",
                column: "AssignEmployeeUserProfileId",
                principalTable: "UserProfiles",
                principalColumn: "UserProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetAssigned_UserProfiles_EmployeeId",
                table: "AssetAssigned",
                column: "EmployeeId",
                principalTable: "UserProfiles",
                principalColumn: "UserProfileId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
