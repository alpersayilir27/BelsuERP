using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosetERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEstimatedCostAndProducedQuantity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ProducedQuantity",
                table: "ProductionStages",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "RawMaterialId",
                table: "ProductionStages",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveryDate",
                table: "Orders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedCost",
                table: "Orders",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductionStages_RawMaterialId",
                table: "ProductionStages",
                column: "RawMaterialId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductionStages_RawMaterials_RawMaterialId",
                table: "ProductionStages",
                column: "RawMaterialId",
                principalTable: "RawMaterials",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductionStages_RawMaterials_RawMaterialId",
                table: "ProductionStages");

            migrationBuilder.DropIndex(
                name: "IX_ProductionStages_RawMaterialId",
                table: "ProductionStages");

            migrationBuilder.DropColumn(
                name: "ProducedQuantity",
                table: "ProductionStages");

            migrationBuilder.DropColumn(
                name: "RawMaterialId",
                table: "ProductionStages");

            migrationBuilder.DropColumn(
                name: "DeliveryDate",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "EstimatedCost",
                table: "Orders");
        }
    }
}
