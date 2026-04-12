import type { ITransactionRepository } from "@/server/repositories/interfaces/transaction-repository.interface";
import type { Transaction, TransactionUpdateInput } from "@/types/transaction";

export class ManageTransactionUsecase {
	constructor(private readonly repo: ITransactionRepository) {}

	async updateTransaction(id: string, data: TransactionUpdateInput): Promise<Transaction> {
		if (!id) {
			throw new Error("取引IDが指定されていません");
		}
		if (!data.description || data.description.length > 200) {
			throw new Error("説明は1〜200文字で入力してください");
		}
		if (!Number.isInteger(data.amount) || data.amount < 0) {
			throw new Error("金額は0以上の整数で入力してください");
		}
		if (!data.majorCategory || data.majorCategory.length > 50) {
			throw new Error("大分類は1〜50文字で入力してください");
		}
		if (!data.minorCategory || data.minorCategory.length > 50) {
			throw new Error("小分類は1〜50文字で入力してください");
		}
		if (data.memo !== null && data.memo.length > 500) {
			throw new Error("メモは500文字以内で入力してください");
		}

		return this.repo.updateOne(id, data);
	}

	async deleteTransaction(id: string): Promise<void> {
		return this.repo.deleteOne(id);
	}
}
