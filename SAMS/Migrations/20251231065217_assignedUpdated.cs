using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAMS.Migrations
{
    /// <inheritdoc />
    public partial class assignedUpdated : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssetAssigned_UserProfiles_UserId",
                table: "AssetAssigned");

            migrationBuilder.DropColumn(
                name: "LocationId",
                table: "AssetAssigned");

            migrationBuilder.RenameColumn(
                name: "LocationIdFrom",
                table: "AssetAssigned",
                newName: "AreaIdFrom");

            migrationBuilder.AlterColumn<long>(
                name: "UserId",
                table: "AssetAssigned",
                type: "bigint",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetAssigned_UserProfiles_UserId",
                table: "AssetAssigned",
                column: "UserId",
                principalTable: "UserProfiles",
                principalColumn: "UserProfileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssetAssigned_UserProfiles_UserId",
                table: "AssetAssigned");

            migrationBuilder.RenameColumn(
                name: "AreaIdFrom",
                table: "AssetAssigned",
                newName: "LocationIdFrom");

            migrationBuilder.AlterColumn<long>(
                name: "UserId",
                table: "AssetAssigned",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            migrationBuilder.AddColumn<long>(
                name: "LocationId",
                table: "AssetAssigned",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AssetAssigned_UserProfiles_UserId",
                table: "AssetAssigned",
                column: "UserId",
                principalTable: "UserProfiles",
                principalColumn: "UserProfileId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
