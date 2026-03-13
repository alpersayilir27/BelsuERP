namespace PosetERP.Domain.Entities;

/// <summary>
/// Kayıt oluşturan/güncelleyen kişi ve tarih bilgilerini tutan base sınıf.
/// </summary>
public abstract class AuditableEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "System";
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
