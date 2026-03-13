namespace PosetERP.Domain.Entities;

public class Customer : AuditableEntity
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? PhoneNumber { get; set; }
    public decimal Balance { get; set; }

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
