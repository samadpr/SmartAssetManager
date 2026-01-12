using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAMS.Migrations
{
    /// <inheritdoc />
    public partial class assetStatusUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EnumValue",
                table: "AssetStatuses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsSystem",
                table: "AssetStatuses",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EnumValue",
                table: "AssetStatuses");

            migrationBuilder.DropColumn(
                name: "IsSystem",
                table: "AssetStatuses");
        }
    }
}
