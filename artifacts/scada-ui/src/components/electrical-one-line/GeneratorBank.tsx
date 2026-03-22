import { Zap } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { VerticalDivider } from './VerticalDivider';
import type { GeneratorUnit } from './types';

export function GeneratorBank({
  generatorUnits,
  dividerLabel,
  dividerHeight,
  branchWireWidth,
  genBreakerNode,
}: {
  generatorUnits: GeneratorUnit[];
  dividerLabel: string;
  dividerHeight: number;
  branchWireWidth: number;
  genBreakerNode: Parameters<typeof NodeCard>[0]['node'];
}) {
  return (
    <div className="flex items-start gap-0">
      <div className="w-[486px] shrink-0" />
      <VerticalDivider height={dividerHeight} label={dividerLabel} />
      <div className="flex w-[142px] shrink-0 flex-col items-start gap-3">
        {generatorUnits.map((generator) => (
          <NodeCard
            key={generator.tag}
            node={{
              kind: 'source',
              tag: generator.tag,
              title: generator.title,
              status: generator.status,
              active: generator.active,
              accent: 'amber',
              width: generator.width,
              details: generator.details,
              icon: <Zap className="h-4 w-4 text-[#475569]" />,
            }}
          />
        ))}
      </div>
      <div className="flex shrink-0 items-center" style={{ width: branchWireWidth, minHeight: generatorUnits.length * 74 - 12 }}>
        <div className="flex flex-1 flex-col justify-center gap-[58px]" />
      </div>
      <div className="flex shrink-0 items-center">
        <NodeCard node={genBreakerNode} />
      </div>
    </div>
  );
}
