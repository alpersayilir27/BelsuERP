using System;
using System.Threading.Tasks;

namespace PosetERP.Application.Interfaces;

public interface IOrderService
{
    Task StartProductionAsync(Guid orderId);
}
