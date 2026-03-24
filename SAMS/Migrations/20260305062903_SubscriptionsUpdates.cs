using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAMS.Migrations
{
    /// <inheritdoc />
    public partial class SubscriptionsUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSubscriptionActive",
                table: "CompanyInfo",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionDate",
                table: "CompanyInfo",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionExpiryDate",
                table: "CompanyInfo",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "SubscriptionId",
                table: "CompanyInfo",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SubscriptionPlans",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PlanAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DurationDays = table.Column<int>(type: "int", nullable: false),
                    AssetLimit = table.Column<int>(type: "int", nullable: false),
                    SystemUserLimit = table.Column<int>(type: "int", nullable: false),
                    TotalUserLimit = table.Column<int>(type: "int", nullable: false),
                    IsCustom = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cancelled = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionPlans", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompanyInfo_SubscriptionId",
                table: "CompanyInfo",
                column: "SubscriptionId");

            migrationBuilder.AddForeignKey(
                name: "FK_CompanyInfo_SubscriptionPlans_SubscriptionId",
                table: "CompanyInfo",
                column: "SubscriptionId",
                principalTable: "SubscriptionPlans",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CompanyInfo_SubscriptionPlans_SubscriptionId",
                table: "CompanyInfo");

            migrationBuilder.DropTable(
                name: "SubscriptionPlans");

            migrationBuilder.DropIndex(
                name: "IX_CompanyInfo_SubscriptionId",
                table: "CompanyInfo");

            migrationBuilder.DropColumn(
                name: "IsSubscriptionActive",
                table: "CompanyInfo");

            migrationBuilder.DropColumn(
                name: "SubscriptionDate",
                table: "CompanyInfo");

            migrationBuilder.DropColumn(
                name: "SubscriptionExpiryDate",
                table: "CompanyInfo");

            migrationBuilder.DropColumn(
                name: "SubscriptionId",
                table: "CompanyInfo");
        }
    }
}
