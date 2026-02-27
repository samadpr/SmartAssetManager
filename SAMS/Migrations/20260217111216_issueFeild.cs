using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAMS.Migrations
{
    /// <inheritdoc />
    public partial class issueFeild : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssetIssue_UserProfiles_RaisedByEmployeeId",
                table: "AssetIssue");

            migrationBuilder.RenameColumn(
                name: "RaisedByEmployeeId",
                table: "AssetIssue",
                newName: "RaisedByUserId");

            migrationBuilder.RenameIndex(
                name: "IX_AssetIssue_RaisedByEmployeeId",
                table: "AssetIssue",
                newName: "IX_AssetIssue_RaisedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetIssue_UserProfiles_RaisedByUserId",
                table: "AssetIssue",
                column: "RaisedByUserId",
                principalTable: "UserProfiles",
                principalColumn: "UserProfileId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssetIssue_UserProfiles_RaisedByUserId",
                table: "AssetIssue");

            migrationBuilder.RenameColumn(
                name: "RaisedByUserId",
                table: "AssetIssue",
                newName: "RaisedByEmployeeId");

            migrationBuilder.RenameIndex(
                name: "IX_AssetIssue_RaisedByUserId",
                table: "AssetIssue",
                newName: "IX_AssetIssue_RaisedByEmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetIssue_UserProfiles_RaisedByEmployeeId",
                table: "AssetIssue",
                column: "RaisedByEmployeeId",
                principalTable: "UserProfiles",
                principalColumn: "UserProfileId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
