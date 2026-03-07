using Microsoft.EntityFrameworkCore;
using PosetERP.Domain.Entities;

namespace PosetERP.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Customer> Customers { get; set; } = null!;
    public DbSet<RawMaterial> RawMaterials { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<ProductionStage> ProductionStages { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Customer
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CompanyName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ContactPerson).HasMaxLength(150);
            entity.Property(e => e.PhoneNumber).HasMaxLength(50);
            entity.Property(e => e.Balance).HasPrecision(18, 2);
        });

        // RawMaterial
        modelBuilder.Entity<RawMaterial>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.StockKg).HasPrecision(18, 2);
            entity.Property(e => e.MinimumStockAlert).HasPrecision(18, 2);
        });

        // Order
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.BagType).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.Dimensions).HasMaxLength(100);
            entity.Property(e => e.RequestedAmountKg).HasPrecision(18, 2);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(50);

            entity.HasOne(e => e.Customer)
                  .WithMany(c => c.Orders)
                  .HasForeignKey(e => e.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ProductionStage
        modelBuilder.Entity<ProductionStage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StageType).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.ConsumedMaterialKg).HasPrecision(18, 2);
            entity.Property(e => e.WasteKg).HasPrecision(18, 2);

            entity.HasOne(e => e.Order)
                  .WithMany(o => o.ProductionStages)
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
