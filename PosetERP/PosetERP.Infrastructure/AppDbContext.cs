using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using PosetERP.Domain.Entities;
using System.Security.Claims;

namespace PosetERP.Infrastructure;

public class AppDbContext : DbContext
{
    private readonly IHttpContextAccessor? _httpContextAccessor;

    public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor? httpContextAccessor = null)
        : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public DbSet<Customer> Customers { get; set; } = null!;
    public DbSet<RawMaterial> RawMaterials { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<ProductionStage> ProductionStages { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Supplier> Suppliers { get; set; } = null!;
    public DbSet<RawMaterialPurchase> RawMaterialPurchases { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;

    private string GetCurrentUser()
    {
        var user = _httpContextAccessor?.HttpContext?.User;
        return user?.FindFirst(ClaimTypes.Name)?.Value
            ?? user?.FindFirst("name")?.Value
            ?? "System";
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var currentUser = GetCurrentUser();

        // Audit alanlarını otomatik doldur
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.CreatedBy = currentUser;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
                entry.Entity.UpdatedBy = currentUser;
                // CreatedAt/CreatedBy'ı değiştirme
                entry.Property(e => e.CreatedAt).IsModified = false;
                entry.Property(e => e.CreatedBy).IsModified = false;
            }
        }

        var auditEntries = new List<AuditLog>();
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                continue;

            var auditEntry = new AuditLog
            {
                Id = Guid.NewGuid(),
                EntityName = entry.Entity.GetType().Name,
                ActionType = entry.State.ToString(),
                Timestamp = now,
                UserId = currentUser
            };

            var key = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey());
            if (key != null)
                auditEntry.EntityId = key.CurrentValue?.ToString() ?? "";

            if (entry.State == EntityState.Modified)
            {
                var oldValues = new Dictionary<string, object?>();
                var newValues = new Dictionary<string, object?>();
                foreach (var property in entry.Properties)
                {
                    if (property.IsModified)
                    {
                        oldValues[property.Metadata.Name] = property.OriginalValue;
                        newValues[property.Metadata.Name] = property.CurrentValue;
                    }
                }
                auditEntry.OldValues = System.Text.Json.JsonSerializer.Serialize(oldValues);
                auditEntry.NewValues = System.Text.Json.JsonSerializer.Serialize(newValues);
            }
            else if (entry.State == EntityState.Added)
            {
                var newValues = new Dictionary<string, object?>();
                foreach (var property in entry.Properties)
                    newValues[property.Metadata.Name] = property.CurrentValue;
                auditEntry.NewValues = System.Text.Json.JsonSerializer.Serialize(newValues);
            }
            else if (entry.State == EntityState.Deleted)
            {
                var oldValues = new Dictionary<string, object?>();
                foreach (var property in entry.Properties)
                    oldValues[property.Metadata.Name] = property.OriginalValue;
                auditEntry.OldValues = System.Text.Json.JsonSerializer.Serialize(oldValues);
            }

            auditEntries.Add(auditEntry);
        }

        var result = await base.SaveChangesAsync(cancellationToken);

        if (auditEntries.Count > 0)
        {
            await AuditLogs.AddRangeAsync(auditEntries, cancellationToken);
            await base.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

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

        // RawMaterialPurchase
        modelBuilder.Entity<RawMaterialPurchase>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AmountKg).HasPrecision(18, 2);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.TotalPrice).HasPrecision(18, 2);

            entity.HasOne(e => e.Supplier)
                  .WithMany(s => s.Purchases)
                  .HasForeignKey(e => e.SupplierId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.RawMaterial)
                  .WithMany(r => r.Purchases)
                  .HasForeignKey(e => e.RawMaterialId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Supplier
        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CompanyName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ContactPerson).HasMaxLength(150);
            entity.Property(e => e.PhoneNumber).HasMaxLength(50);
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
            entity.Property(e => e.TotalPrice).HasPrecision(18, 2);
            entity.Property(e => e.TotalCost).HasPrecision(18, 2);
            entity.Property(e => e.EstimatedCost).HasPrecision(18, 2);
            entity.Property(e => e.NetProfit).HasPrecision(18, 2);
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
            entity.Property(e => e.ProducedQuantity).HasPrecision(18, 2);

            entity.HasOne(e => e.Order)
                  .WithMany(o => o.ProductionStages)
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.RawMaterial)
                  .WithMany()
                  .HasForeignKey(e => e.RawMaterialId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
