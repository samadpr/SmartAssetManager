using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAMS.Migrations
{
    /// <inheritdoc />
    public partial class capUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_assetQrBarcodePools",
                table: "assetQrBarcodePools");

            migrationBuilder.DropPrimaryKey(
                name: "PK_assetQrBarcodeBatches",
                table: "assetQrBarcodeBatches");

            migrationBuilder.RenameTable(
                name: "assetQrBarcodePools",
                newName: "AssetQrBarcodePools");

            migrationBuilder.RenameTable(
                name: "assetQrBarcodeBatches",
                newName: "AssetQrBarcodeBatches");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AssetQrBarcodePools",
                table: "AssetQrBarcodePools",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AssetQrBarcodeBatches",
                table: "AssetQrBarcodeBatches",
                column: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_AssetQrBarcodePools",
                table: "AssetQrBarcodePools");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AssetQrBarcodeBatches",
                table: "AssetQrBarcodeBatches");

            migrationBuilder.RenameTable(
                name: "AssetQrBarcodePools",
                newName: "assetQrBarcodePools");

            migrationBuilder.RenameTable(
                name: "AssetQrBarcodeBatches",
                newName: "assetQrBarcodeBatches");

            migrationBuilder.AddPrimaryKey(
                name: "PK_assetQrBarcodePools",
                table: "assetQrBarcodePools",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_assetQrBarcodeBatches",
                table: "assetQrBarcodeBatches",
                column: "Id");
        }
    }
}
