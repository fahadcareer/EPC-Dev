import {
    ManagementProcessNode,
    SupportProcessNode,
    CoreProcessNode,
    ChevronLeftNode,
    ChevronRightNode,
    LaneNode,
    SubLaneNode,
    ProcessGroupNode,
    ValueAddedChainNode
} from './Nodes';
import { vacdLayout, expandVACDEdges } from './layout';

export const vacdNodeTypes = {
    management_process: ManagementProcessNode,
    support_process: SupportProcessNode,
    vacd: CoreProcessNode, // Alias for core process
    chevron_left: ChevronLeftNode,
    chevron_right: ChevronRightNode,
    vacd_lane: LaneNode,
    vacd_sub_lane: SubLaneNode,
    processgroup: ProcessGroupNode,
    valueaddedchain: ValueAddedChainNode,
    process: ValueAddedChainNode,
    core_process: CoreProcessNode
};

export { vacdLayout, expandVACDEdges };
