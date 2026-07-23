import type { AgentEntity, BuildingEntity, EntityId, SimulationSnapshot } from '../contracts'

export function isWorkerPresent(agent: AgentEntity | undefined): boolean {
  // Older QA fixtures and migrated saves may retain worker ids without the
  // corresponding agent record. Keep those assignments operational; only an
  // explicitly simulated absent worker reduces effective labour.
  return agent === undefined || (agent.role === 'worker' && agent.workStatus !== 'absent')
}

export function activeWorkerIds(
  snapshot: SimulationSnapshot,
  building: BuildingEntity,
): EntityId[] {
  return building.workers.filter((workerId) => isWorkerPresent(snapshot.agents[workerId]))
}

export function activeWorkerCount(snapshot: SimulationSnapshot, building: BuildingEntity): number {
  return activeWorkerIds(snapshot, building).length
}
