import { describe, expect, it } from "vitest"
import { createMockMappingRepository } from "@/test/helpers/mock-repositories"
import { UpdateMappingUsecase } from "./update-mapping.usecase"

describe("UpdateMappingUsecase", () => {
	it("リポジトリの replaceAll を呼び出す", async () => {
		const mockRepo = createMockMappingRepository()
		const usecase = new UpdateMappingUsecase(mockRepo)

		const categories = [
			{ majorCategory: "食費", minorCategory: "外食" },
			{ majorCategory: "食費", minorCategory: "食料品" },
		]
		await usecase.execute("budget-1", categories)

		expect(mockRepo.replaceAll).toHaveBeenCalledWith("budget-1", categories)
	})

	it("空のカテゴリ配列でも呼び出せる", async () => {
		const mockRepo = createMockMappingRepository()
		const usecase = new UpdateMappingUsecase(mockRepo)

		await usecase.execute("budget-1", [])

		expect(mockRepo.replaceAll).toHaveBeenCalledWith("budget-1", [])
	})
})
