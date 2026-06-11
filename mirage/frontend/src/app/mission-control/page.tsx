'use client'

import CommandBridge from '@/components/mission/CommandBridge'
import AdvisorConsole from '@/components/mission/AdvisorConsole'
import SystemsGraph from '@/components/mission/SystemsGraph'
import ScenarioSimulator from '@/components/mission/ScenarioSimulator'
import StrategyBoard from '@/components/mission/StrategyBoard'
import CompetitorMatrix from '@/components/mission/CompetitorMatrix'
import RiskOpportunityGrid from '@/components/mission/RiskOpportunityGrid'
import GrowthEngine from '@/components/mission/GrowthEngine'
import RoadmapTechTree from '@/components/mission/RoadmapTechTree'

export default function MissionControlPage() {
  return (
    <div className="h-full overflow-auto px-4 py-4">
      <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-3 auto-rows-min">
        {/* Bridge + JANUS */}
        <div className="col-span-12 lg:col-span-7 min-h-[300px]">
          <CommandBridge />
        </div>
        <div id="janus" className="col-span-12 lg:col-span-5 min-h-[300px] h-[300px] lg:h-auto">
          <AdvisorConsole />
        </div>

        {/* Roadmap full width */}
        <div className="col-span-12 h-[300px]">
          <RoadmapTechTree />
        </div>

        {/* Systems graph + strategy */}
        <div className="col-span-12 lg:col-span-7 h-[400px]">
          <SystemsGraph />
        </div>
        <div className="col-span-12 lg:col-span-5 h-[400px]">
          <StrategyBoard />
        </div>

        {/* Scenario + competitor + risk */}
        <div className="col-span-12 lg:col-span-4 h-[360px]">
          <ScenarioSimulator />
        </div>
        <div className="col-span-12 lg:col-span-4 h-[360px]">
          <CompetitorMatrix />
        </div>
        <div className="col-span-12 lg:col-span-4 h-[360px]">
          <RiskOpportunityGrid />
        </div>

        {/* Growth engine */}
        <div className="col-span-12 h-[300px]">
          <GrowthEngine />
        </div>
      </div>
    </div>
  )
}
