import { CompactCard } from './CompactCard';
import type { ATSNode, EquipmentNode, SourceNode } from './types';

export function NodeCard({ node }: { node: SourceNode | EquipmentNode | ATSNode }) {
  return <CompactCard {...node} />;
}
