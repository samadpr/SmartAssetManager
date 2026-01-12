using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAMS.Migrations
{
    /// <inheritdoc />
    public partial class assetHistoryFeildUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssetHistory_UserProfiles_AssignEmployeeId",
                table: "AssetHistory");

            migrationBuilder.DropIndex(
                name: "IX_AssetHistory_AssignEmployeeId",
                table: "AssetHistory");

            migrationBuilder.DropColumn(
                name: "AssignEmployeeId",
                table: "AssetHistory");

            migrationBuilder.AddColumn<long>(
                name: "AssignUserId",
                table: "AssetHistory",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssetHistory_AssignUserId",
                table: "AssetHistory",
                column: "AssignUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetHistory_UserProfiles_AssignUserId",
                table: "AssetHistory",
                column: "AssignUserId",
                principalTable: "UserProfiles",
                principalColumn: "UserProfileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssetHistory_UserProfiles_AssignUserId",
                table: "AssetHistory");

            migrationBuilder.DropIndex(
                name: "IX_AssetHistory_AssignUserId",
                table: "AssetHistory");

            migrationBuilder.DropColumn(
                name: "AssignUserId",
                table: "AssetHistory");

            migrationBuilder.AddColumn<long>(
                name: "AssignEmployeeId",
                table: "AssetHistory",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateIndex(
                name: "IX_AssetHistory_AssignEmployeeId",
                table: "AssetHistory",
                column: "AssignEmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetHistory_UserProfiles_AssignEmployeeId",
                table: "AssetHistory",
                column: "AssignEmployeeId",
                principalTable: "UserProfiles",
                principalColumn: "UserProfileId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
