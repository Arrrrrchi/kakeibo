import type { IMappingRepository } from "@/server/repositories/interfaces/mapping-repository.interface"

export class UpdateMappingUsecase {
	constructor(private readonly mappingRepository: IMappingRepository) {}

	async execute(
		budgetItemId: string,
		categories: { majorCategory: string; minorCategory: string }[],
	): Promise<void> {
		return this.mappingRepository.replaceAll(budgetItemId, categories)
	}
}
