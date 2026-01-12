using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAMS.Migrations
{
    /// <inheritdoc />
    public partial class EmployeeChangeToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Asset_UserProfiles_AssignEmployeeId",
                table: "Asset");

            migrationBuilder.DropIndex(
                name: "IX_Asset_AssignEmployeeId",
                table: "Asset");

            migrationBuilder.RenameColumn(
                name: "AssignEmployeeId",
                table: "Asset",
                newName: "AssignUserId");

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Asset_UserProfiles_AssignEmployeeUserProfileId",
                table: "Asset");

            migrationBuilder.DropIndex(
                name: "IX_Asset_AssignEmployeeUserProfileId",
                table: "Asset");

            migrationBuilder.DropColumn(
                name: "AssignEmployeeUserProfileId",
                table: "Asset");

            migrationBuilder.RenameColumn(
                name: "AssignUserId",
                table: "Asset",
                newName: "AssignEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Asset_AssignEmployeeId",
                table: "Asset",
                column: "AssignEmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Asset_UserProfiles_AssignEmployeeId",
                table: "Asset",
                column: "AssignEmployeeId",
                principalTable: "UserProfiles",
                principalColumn: "UserProfileId");
        }
    }
}
