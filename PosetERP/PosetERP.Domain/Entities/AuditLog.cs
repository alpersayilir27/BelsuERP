using System;

namespace PosetERP.Domain.Entities
{
    public class AuditLog
    {
        public Guid Id { get; set; }
        public string? UserId { get; set; } // Hangi kullanıcı yaptı (eğer token'dan alınabiliyorsa)
        public string ActionType { get; set; } = string.Empty; // Create, Update, Delete
        public string EntityName { get; set; } = string.Empty; // Müşteri, Sipariş vb.
        public string EntityId { get; set; } = string.Empty; // İşlem yapılan kaydın ID'si
        public string? OldValues { get; set; } // JSON string
        public string? NewValues { get; set; } // JSON string
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
