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
    public DbSet<User> Users { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Role).IsRequired().HasMaxLength(20);

            entity.HasData(
                new User { Id = Guid.Parse("d5b0a3b2-6c39-4974-9844-3d0d62a22238"), Username = "admin", PasswordHash = "123456", Role = "Admin" },
                new User { Id = Guid.Parse("f1a4ceab-1a40-4f51-8d26-78832a8a8e3f"), Username = "usta", PasswordHash = "123456", Role = "Usta" }
            );
        });

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
