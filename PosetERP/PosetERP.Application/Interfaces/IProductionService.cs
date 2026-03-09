using System;
using System.Threading.Tasks;

namespace PosetERP.Application.Interfaces;

public interface IProductionService
{
    Task ConsumeMaterialAsync(Guid stageId, Guid? materialId, decimal consumedAmountKg, decimal wasteKg);
    Task UpdateStageStatusAsync(Guid stageId, PosetERP.Domain.Enums.ProductionStatus newStatus);
}
