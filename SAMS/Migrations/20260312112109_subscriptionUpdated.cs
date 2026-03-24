using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAMS.Migrations
{
    /// <inheritdoc />
    public partial class subscriptionUpdated : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BadgeIcon",
                table: "SubscriptionPlans");

            migrationBuilder.DropColumn(
                name: "BadgeLabel",
                table: "SubscriptionPlans");

            migrationBuilder.DropColumn(
                name: "CardColor",
                table: "SubscriptionPlans");

            migrationBuilder.DropColumn(
                name: "CardColorSecondary",
                table: "SubscriptionPlans");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "SubscriptionPlans");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "SubscriptionPlans");

            migrationBuilder.RenameColumn(
                name: "IsCustom",
                table: "SubscriptionPlans",
                newName: "IsPlanActive");

            migrationBuilder.RenameColumn(
                name: "IsSubscriptionActive",
                table: "CompanyInfo",
                newName: "IsActive");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsPlanActive",
                table: "SubscriptionPlans",
                newName: "IsCustom");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "CompanyInfo",
                newName: "IsSubscriptionActive");

            migrationBuilder.AddColumn<string>(
                name: "BadgeIcon",
                table: "SubscriptionPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BadgeLabel",
                table: "SubscriptionPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CardColor",
                table: "SubscriptionPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CardColorSecondary",
                table: "SubscriptionPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "SubscriptionPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "SubscriptionPlans",
                type: "int",
                nullable: true);
        }
    }
}
