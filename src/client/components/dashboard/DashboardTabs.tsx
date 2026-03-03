"use client";

import { useState } from "react";
import type { DashboardData } from "@/types/dashboard";
import { MappingPanel } from "./MappingPanel";
import { ReportPanel } from "./ReportPanel";
import { SummaryPanel } from "./SummaryPanel";

type Tab = "summary" | "mapping" | "report";

type TabConfig = {
	key: Tab;
	label: string;
};

const tabs: TabConfig[] = [
	{ key: "summary", label: "サマリー" },
	{ key: "mapping", label: "予算マッピング" },
	{ key: "report", label: "予算対比レポート" },
];

type DashboardTabsProps = {
	dashboardData: DashboardData;
};

export function DashboardTabs({ dashboardData }: DashboardTabsProps) {
	const [activeTab, setActiveTab] = useState<Tab>("summary");

	return (
		<div>
			<div className="bg-white rounded-xl p-1 shadow-sm mb-6 flex overflow-x-auto" role="tablist">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						role="tab"
						aria-selected={activeTab === tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
							activeTab === tab.key
								? "bg-[#1a1a2e] text-white"
								: "text-gray-600 hover:text-gray-900"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			<div role="tabpanel">
				{activeTab === "summary" && <SummaryPanel data={dashboardData} />}
				{activeTab === "mapping" && (
					<MappingPanel
						budgetItems={dashboardData.budgetItems}
						allCategories={dashboardData.categoryBreakdown}
						unmappedCategories={dashboardData.unmappedCategories}
					/>
				)}
				{activeTab === "report" && (
					<ReportPanel
						budgetReport={dashboardData.budgetReport}
						months={dashboardData.monthlyTrend.map((m) => m.month)}
						investmentRow={dashboardData.investmentRow}
					/>
				)}
			</div>
		</div>
	);
}
