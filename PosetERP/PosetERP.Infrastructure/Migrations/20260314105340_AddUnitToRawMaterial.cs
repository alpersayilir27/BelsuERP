using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosetERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitToRawMaterial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "RawMaterials",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Unit",
                table: "RawMaterials");
        }
    }
}
