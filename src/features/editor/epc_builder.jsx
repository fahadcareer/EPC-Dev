import React, { useCallback, useState, useRef, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  useEdgesState,
  useNodesState,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
  Panel,
  updateEdge,
} from "reactflow";
import "reactflow/dist/style.css";
import { AnimatePresence, motion } from "framer-motion";
import dagre from "dagre";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import Sidebar from "../../components/shared/slide_bar";
import ChatSidebar from "../../components/shared/chat_sidebar";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Play, Square, User, Users, Settings, FileText, CheckCircle, AlertTriangle,
  Database, Mail, CreditCard, Truck, Package, Search, Lock, Calendar, Clock,
  Info, HelpCircle, Trash2, Server, Globe, Home, DollarSign, Briefcase, ClipboardList, Shield, Target, Zap,
  Minimize2, Maximize2, MessageSquare, X, UserRound, CircleUser, Building2, Upload, Paperclip, Plus,
  FileCode, FileSpreadsheet, Share2, History, Eye, RotateCcw, Sparkles, Check
} from "lucide-react";
import { useTranslation } from "react-i18next";
import NETWORK_URLS from "../../config/network_string";
import Toast from "../../components/ui/Toast";
import { useTheme } from "../../contexts/ThemeContext";
import { fadLayout, expandGroupEdges } from "./fadLayout";
import { OrganizationalElementNode } from "./OrgNodes";
import { EventNode, FunctionNode, RuleNode, RoleNode, InfoNode, VACDNode } from "./ProcessNodes";
import { FADProcessNode } from "./FADNodes";
import { BPMNEventNode, BPMNTaskNode, BPMNGatewayNode, BPMNDataNode, BPMNPoolNode, BPMNLaneNode, BPMNEmptyLaneNode, SWIMLANE_INNER_OFFSET_X } from "./BPMNNodes";
import { vacdNodeTypes, vacdLayout, expandVACDEdges } from "./vacd";
import DiagramTemplateSwitcher from "./DiagramTemplateSwitcher";
import XmlDropdown from "./XmlDropdown";
import PdfDropdown from "./PdfDropdown";
import ProcessLinkModal from "./ProcessLinkModal";
import { ExternalLink as LinkIcon, ExternalLink, Unlink, Palette } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import ZoomControls from "./ZoomControls";
import LegendDropdown from "./LegendDropdown";
import VersionHistorySidebar from "./VersionHistorySidebar";
import VersionHistoryDropdown from "./VersionHistoryDropdown";

import { useGifRecorder } from "../../features/process_explorer/animation/useGifRecorder";
import { useHtmlDownloader } from "../../features/process_explorer/animation/useHtmlDownloader";
import "../../features/process_explorer/animation/ProcessAnimations.css";
import socketService from "../../services/socketService";
import ActiveUsers from "./components/ActiveUsers";
import CursorLayer from "./components/CursorLayer";
import PropertiesPanel from "./components/PropertiesPanel";
import useAuthStore from "../../store/logic/user";
import MovableEdge from "./components/MovableEdge";
import HelperLines from "./components/HelperLines";
import { getHelperLines } from "./utils/alignmentUtils";

// Simple throttle function
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}



const IconMap = {
  'play': Play, 'stop': Square, 'user': User, 'users': Users, 'settings': Settings,
  'file-text': FileText, 'check-circle': CheckCircle, 'alert-triangle': AlertTriangle,
  'database': Database, 'mail': Mail, 'credit-card': CreditCard, 'truck': Truck,
  'package': Package, 'search': Search, 'lock': Lock, 'calendar': Calendar,
  'clock': Clock, 'server': Server, 'globe': Globe, 'home': Home,
  'dollar-sign': DollarSign, 'briefcase': Briefcase, 'clipboard-list': ClipboardList,
  'shield': Shield, 'target': Target, 'zap': Zap, 'info': Info, 'help-circle': HelpCircle,
  'user-round': UserRound, 'circle-user': CircleUser, 'building': Building2
};

const getIconForLabel = (label, defaultIcon) => {
  if (!label) return defaultIcon;
  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes('mail') || lowerLabel.includes('email') || lowerLabel.includes('send')) return IconMap['mail'];
  if (lowerLabel.includes('database') || lowerLabel.includes('db') || lowerLabel.includes('store')) return IconMap['database'];
  if (lowerLabel.includes('file') || lowerLabel.includes('document') || lowerLabel.includes('report')) return IconMap['file-text'];
  if (lowerLabel.includes('settings') || lowerLabel.includes('config')) return IconMap['settings'];
  if (lowerLabel.includes('user') || lowerLabel.includes('person') || lowerLabel.includes('role')) return IconMap['user'];
  if (lowerLabel.includes('group') || lowerLabel.includes('team')) return IconMap['users'];
  if (lowerLabel.includes('check') || lowerLabel.includes('approve') || lowerLabel.includes('verify')) return IconMap['check-circle'];
  if (lowerLabel.includes('alert') || lowerLabel.includes('warning') || lowerLabel.includes('error')) return IconMap['alert-triangle'];
  if (lowerLabel.includes('pay') || lowerLabel.includes('money') || lowerLabel.includes('cost')) return IconMap['dollar-sign'];
  if (lowerLabel.includes('time') || lowerLabel.includes('schedule') || lowerLabel.includes('date')) return IconMap['calendar'];
  if (lowerLabel.includes('lock') || lowerLabel.includes('secure') || lowerLabel.includes('auth')) return IconMap['lock'];
  if (lowerLabel.includes('search') || lowerLabel.includes('find')) return IconMap['search'];
  if (lowerLabel.includes('server') || lowerLabel.includes('host')) return IconMap['server'];
  if (lowerLabel.includes('web') || lowerLabel.includes('internet') || lowerLabel.includes('online')) return IconMap['globe'];
  if (lowerLabel.includes('meerana') || lowerLabel.includes('company')) return IconMap['building'];
  if (lowerLabel.includes('women') || lowerLabel.includes('woman') || lowerLabel.includes('female') || lowerLabel.includes('mrs.')) return IconMap['user-round'];
  if (lowerLabel.includes('group') || lowerLabel.includes('team') || lowerLabel.includes('staff') || lowerLabel.includes('committee') || lowerLabel.includes('technologies') || lowerLabel.includes('division')) return IconMap['users'];
  if (lowerLabel.includes('user') || lowerLabel.includes('person') || lowerLabel.includes('role') || lowerLabel.includes('men') || lowerLabel.includes('man') || lowerLabel.includes('male') || lowerLabel.includes('mr.')) return IconMap['user'];

  return defaultIcon;
};

const normalizeString = (s) => (s || "").toLowerCase().replace(/\s+/g, "");

const BPMN_SEMANTIC_KEYS = [
  'eventType',
  'triggerType',
  'isInterrupting',
  'isThrowing',
  'activityType',
  'taskType',
  'loopType',
  'isAdHoc',
  'isCompensation',
  'gatewayType',
  'dataType',
];

const getGeneratedValue = (node, key, existingData = {}) => {
  if (node?.[key] !== undefined) return node[key];
  if (node?.data?.[key] !== undefined) return node.data[key];
  return existingData[key];
};

const getBpmnSemanticData = (node, existingData = {}) => (
  BPMN_SEMANTIC_KEYS.reduce((acc, key) => {
    const value = getGeneratedValue(node, key, existingData);
    if (value !== undefined) acc[key] = value;
    return acc;
  }, {})
);

const getGeneratedNodeLabel = (node) => node?.label ?? node?.data?.label ?? node?.type;

const getGeneratedEdgeData = (edge, existingEdge = {}, defaultBpmnConnectorType) => {
  const bpmnConnectorType =
    edge?.bpmnConnectorType ||
    edge?.connectorType ||
    edge?.data?.bpmnConnectorType ||
    existingEdge?.data?.bpmnConnectorType ||
    defaultBpmnConnectorType;

  const label = edge?.label ?? edge?.data?.label ?? existingEdge?.data?.label;
  const data = { ...(existingEdge?.data || {}), ...(edge?.data || {}) };

  if (bpmnConnectorType) data.bpmnConnectorType = bpmnConnectorType;
  if (label !== undefined) data.label = label;

  return Object.keys(data).length > 0 ? data : undefined;
};

const getBpmnEdgeStyle = (connectorType) => {
  if (connectorType === 'message' || connectorType === 'association') {
    return { stroke: "#64748b", strokeWidth: 2, strokeDasharray: '5,5' };
  }
  return { stroke: "#64748b", strokeWidth: 2, strokeDasharray: '0' };
};

const getBpmnEdgeMarkerEnd = (connectorType) => {
  if (connectorType === 'message' || connectorType === 'association') return undefined;
  return { type: MarkerType.ArrowClosed, color: "#64748b", width: 30, height: 30 };
};



/* ---------- DAGRE LAYOUT (Left-Right) ---------- */
const NODE_W = 200;
const NODE_H = 90;

const NODE_COLORS = [
  { name: 'Default', value: null },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Slate', value: '#64748b' },
];

function layoutGraph(nodes, edges, direction = 'TB') {
  const isMetaNode = (n) => n.data?.isMeta || n.id.includes('-meta-');
  const standardNodes = nodes.filter(n => !isMetaNode(n));
  const metaNodes = nodes.filter(n => isMetaNode(n));
  const metaNodeIds = new Set(metaNodes.map(m => m.id));
  const standardEdges = edges.filter(e => !metaNodeIds.has(e.source) && !metaNodeIds.has(e.target));

  const g = new dagre.graphlib.Graph();
  // Uncongested Layout: Increased spacing for "free" look
  g.setGraph({ rankdir: direction, align: 'UL', ranker: 'tight-tree', nodesep: 200, ranksep: 200 });
  g.setDefaultEdgeLabel(() => ({}));

  standardNodes.forEach((n) => {
    let w = n.width || n.style?.width || 200;
    let h = n.height || n.style?.height || 90;
    if (n.type === 'rule' || n.type === 'xor' || n.type === 'or' || n.type === 'and') { w = 40; h = 40; }
    g.setNode(n.id, { width: w, height: h });
  });

  standardEdges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const laidOutStandard = standardNodes.map((n) => {
    const p = g.node(n.id);
    const nodeW = n.width || n.style?.width || 200;
    const nodeH = n.height || n.style?.height || 90;
    return { ...n, position: { x: p.x - nodeW / 2, y: p.y - nodeH / 2 } };
  });

  const nodeMap = {};
  laidOutStandard.forEach(n => nodeMap[n.id] = n);

  const finalNodes = [...laidOutStandard];

  metaNodes.forEach((m) => {
    const parentEdge = edges.find(e => e.target === m.id || e.source === m.id);
    const parentId = parentEdge ? (parentEdge.source === m.id ? parentEdge.target : parentEdge.source) : null;
    const parent = parentId ? nodeMap[parentId] : null;

    if (parent) {
      const siblings = metaNodes.filter(sib => edges.some(e => (e.target === sib.id || e.source === sib.id) && (e.source === parent.id || e.target === parent.id)));
      siblings.sort((a, b) => a.id.localeCompare(b.id));
      const idx = siblings.findIndex(s => s.id === m.id);

      const pW = parent.width || parent.style?.width || 200;
      const pH = parent.height || parent.style?.height || 90;
      const mW = m.width || m.style?.width || 120;

      finalNodes.push({
        ...m,
        position: {
          x: parent.position.x + pW / 2 - mW / 2,
          y: parent.position.y + pH + 40 + (idx * 90)
        }
      });
    } else {
      finalNodes.push(m);
    }
  });

  return finalNodes;
}

function organizationalLayout(nodes, edges, direction = 'TB') {
  const isMetaNode = (n) => n.data?.isMeta || n.id.includes('-meta-');
  const standardNodes = nodes.filter(n => !isMetaNode(n));
  const metaNodes = nodes.filter(n => isMetaNode(n));
  const metaNodeIds = new Set(metaNodes.map(m => m.id));
  const standardEdges = edges.filter(e => !metaNodeIds.has(e.source) && !metaNodeIds.has(e.target));

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // TB = Top to Bottom layout, ideal for Org Charts
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 100,
    nodesep: 80,
    marginx: 50,
    marginy: 50
  });

  standardNodes.forEach((node) => {
    const w = node.width || node.style?.width || 300;
    const h = node.height || node.style?.height || 120;
    dagreGraph.setNode(node.id, { width: w, height: h });
  });

  standardEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const laidOutStandard = standardNodes.map((node) => {
    const nodeWithPos = dagreGraph.node(node.id);
    const nodeW = node.width || node.style?.width || 300;
    const nodeH = node.height || node.style?.height || 120;
    return {
      ...node,
      position: {
        x: nodeWithPos.x - nodeW / 2, // Center horizontally
        y: nodeWithPos.y - nodeH / 2   // Center vertically
      },
    };
  });

  const nodeMap = {};
  laidOutStandard.forEach(n => nodeMap[n.id] = n);

  const finalNodes = [...laidOutStandard];

  metaNodes.forEach((m) => {
    const parentEdge = edges.find(e => e.target === m.id || e.source === m.id);
    const parentId = parentEdge ? (parentEdge.source === m.id ? parentEdge.target : parentEdge.source) : null;
    const parent = parentId ? nodeMap[parentId] : null;

    if (parent) {
      const siblings = metaNodes.filter(sib => edges.some(e => (e.target === sib.id || e.source === sib.id) && (e.source === parent.id || e.target === parent.id)));
      siblings.sort((a, b) => a.id.localeCompare(b.id));
      const idx = siblings.findIndex(s => s.id === m.id);

      const pW = parent.width || parent.style?.width || 300;
      const pH = parent.height || parent.style?.height || 120;
      const mW = m.width || m.style?.width || 120;

      finalNodes.push({
        ...m,
        position: {
          x: parent.position.x + pW / 2 - mW / 2,
          y: parent.position.y + pH + 40 + (idx * 90)
        }
      });
    } else {
      finalNodes.push(m);
    }
  });

  return finalNodes;
}

function bpmnLayout(nodes, edges, direction = 'LR') {
  const isMetaNode = (n) => n.data?.isMeta || n.id.includes('-meta-');
  const metaNodes = nodes.filter(n => isMetaNode(n));
  const standardNodes = nodes.filter(n => !isMetaNode(n));
  const metaNodeIds = new Set(metaNodes.map(m => m.id));
  const standardEdges = edges.filter(e => !metaNodeIds.has(e.source) && !metaNodeIds.has(e.target));

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, align: 'UL', ranker: 'network-simplex', nodesep: 80, ranksep: 100 });
  g.setDefaultEdgeLabel(() => ({}));

  const flowNodes = standardNodes.filter(n => !['bpmn_pool', 'bpmn_lane', 'bpmn_empty_lane'].includes(n.type));
  const pools = standardNodes.filter(n => n.type === 'bpmn_pool');
  const lanes = standardNodes.filter(n => n.type === 'bpmn_lane' || n.type === 'bpmn_empty_lane');

  flowNodes.forEach((n) => {
    let w = n.width || n.style?.width || 160;
    let h = n.height || n.style?.height || 70;
    if (['bpmn_event', 'bpmn_gateway', 'bpmn_data'].includes(n.type)) { w = 60; h = 60; }
    g.setNode(n.id, { width: w, height: h });
  });

  standardEdges.forEach((e) => {
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  const finalNodes = [];
  const processedFlowNodes = [];
  let currentPoolY = 0;

  pools.forEach((pool) => {
    const poolLanes = lanes.filter(l => l.parentNode === pool.id)
      .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));
    const poolFlowNodes = flowNodes.filter(n => n.parentNode === pool.id || poolLanes.some(l => l.id === n.parentNode));

    const OFFSET = SWIMLANE_INNER_OFFSET_X;

    if (poolFlowNodes.length === 0) {
      // Preserve the pool's existing height and distribute it equally among lanes
      const existingPoolW = Number(pool.width || pool.style?.width || 800);
      const existingPoolH = Number(pool.height || pool.style?.height || 300);
      const poolW = Math.max(800, existingPoolW);
      const laneCount = poolLanes.length || 1;
      // Give each lane an equal share of the pool height
      const laneH = Math.max(160, Math.floor(existingPoolH / laneCount));
      const totalH = laneH * laneCount;

      finalNodes.push({
        ...pool, position: { x: 0, y: currentPoolY },
        style: { ...pool.style, width: poolW, height: totalH },
        width: poolW, height: totalH, zIndex: -2
      });
      poolLanes.forEach((lane, idx) => finalNodes.push({
        ...lane,
        position: { x: OFFSET, y: idx * laneH },
        style: { ...lane.style, width: poolW - OFFSET, height: laneH },
        width: poolW - OFFSET, height: laneH, zIndex: -1
      }));
      currentPoolY += totalH + 50;
      return;
    }

    // Determine global bounds of all mathematical flow nodes inside this entire pool
    const minX = Math.min(...poolFlowNodes.map(n => g.node(n.id).x - (n.width || 160) / 2));
    const maxX = Math.max(...poolFlowNodes.map(n => g.node(n.id).x + (n.width || 160) / 2));
    const minY = Math.min(...poolFlowNodes.map(n => g.node(n.id).y - (n.height || 70) / 2));
    const maxY = Math.max(...poolFlowNodes.map(n => g.node(n.id).y + (n.height || 70) / 2));

    const poolWidth = Math.max(800, (maxX - minX) + 100);
    const totalContentHeight = Math.max(300, (maxY - minY) + 100);

    const processedLanes = [];
    let currentLaneOffset = 0;

    if (poolLanes.length > 0) {
      // Compute a minimum lane height: use the existing height from the node or 160px fallback
      poolLanes.forEach((lane) => {
        const children = flowNodes.filter(n => n.parentNode === lane.id);
        const existingH = Number(lane.height || lane.style?.height || 160);

        if (children.length === 0) {
          // Preserve existing height — don't reassign 200
          const laneH = Math.max(160, existingH);
          processedLanes.push({
            ...lane,
            position: { x: OFFSET, y: currentLaneOffset },
            style: { ...lane.style, width: poolWidth - OFFSET, height: laneH },
            width: poolWidth - OFFSET,
            height: laneH,
            zIndex: -1
          });
          currentLaneOffset += laneH;
          return;
        }

        // Get per-lane Y bounds from dagre (not global pool bounds)
        const cMinY = Math.min(...children.map(c => g.node(c.id).y - (c.height || 70) / 2));
        const cMaxY = Math.max(...children.map(c => g.node(c.id).y + (c.height || 70) / 2));
        const cMinX = Math.min(...children.map(c => g.node(c.id).x - (c.width || 160) / 2));
        const cMaxX = Math.max(...children.map(c => g.node(c.id).x + (c.width || 160) / 2));
        const contentWidth = cMaxX - cMinX;
        const contentHeight = cMaxY - cMinY;

        // Use existing lane height if it fits; otherwise grow to fit content + padding
        const laneHeight = Math.max(existingH, contentHeight + 100);

        const offsetX = Math.max(50, ((poolWidth - OFFSET) - contentWidth) / 2);
        const offsetY = Math.max(50, (laneHeight - contentHeight) / 2);

        children.forEach((c) => {
          const p = g.node(c.id);
          const nodeW = c.width || c.style?.width || 160;
          const nodeH = c.height || c.style?.height || 70;
          processedFlowNodes.push({
            ...c,
            position: {
              x: p.x - nodeW / 2 - cMinX + offsetX,
              y: p.y - nodeH / 2 - cMinY + offsetY
            },
            zIndex: 1
          });
        });

        processedLanes.push({
          ...lane,
          position: { x: OFFSET, y: currentLaneOffset },
          style: { ...lane.style, width: poolWidth - OFFSET, height: laneHeight },
          width: poolWidth - OFFSET,
          height: laneHeight,
          zIndex: -1
        });

        currentLaneOffset += laneHeight;
      });

      finalNodes.push({
        ...pool,
        position: { x: 0, y: currentPoolY },
        style: { ...pool.style, width: poolWidth, height: currentLaneOffset },
        width: poolWidth,
        height: currentLaneOffset,
        zIndex: -2
      });

      finalNodes.push(...processedLanes);
      currentPoolY += currentLaneOffset + 50;
    } else {
      // Handling pools without structural lanes (direct node children)
      const directChildren = flowNodes.filter(n => n.parentNode === pool.id);

      const offsetX = Math.max(OFFSET + 20, (poolWidth - (maxX - minX)) / 2);
      const offsetY = Math.max(50, (totalContentHeight - (maxY - minY)) / 2);

      directChildren.forEach((c) => {
        const p = g.node(c.id);
        const nodeW = c.width || c.style?.width || 160;
        const nodeH = c.height || c.style?.height || 70;
        processedFlowNodes.push({
          ...c,
          position: {
            x: p.x - nodeW / 2 - minX + offsetX,
            y: p.y - nodeH / 2 - minY + offsetY
          },
          zIndex: 1
        });
      });

      finalNodes.push({
        ...pool,
        position: { x: 0, y: currentPoolY },
        style: { ...pool.style, width: poolWidth, height: totalContentHeight },
        width: poolWidth,
        height: totalContentHeight,
        zIndex: -2
      });

      currentPoolY += totalContentHeight + 50;
    }
  });

  // Handle flow nodes that don't belong to any pool/lane
  const outerFlowNodes = flowNodes.filter(n => !n.parentNode);
  let outerMinY = 0;
  if (outerFlowNodes.length > 0) {
    outerMinY = Math.min(...outerFlowNodes.map(n => g.node(n.id).y - (n.height || 70) / 2));
  }

  outerFlowNodes.forEach((n) => {
    const p = g.node(n.id);
    const nodeW = n.width || n.style?.width || 160;
    const nodeH = n.height || n.style?.height || 70;
    processedFlowNodes.push({
      ...n,
      position: { x: p.x - nodeW / 2, y: p.y - nodeH / 2 - outerMinY + currentPoolY },
      zIndex: 1
    });
  });


  // Add flow nodes LAST to ensure they are layered on top
  finalNodes.push(...processedFlowNodes);

  // Position meta nodes exactly beneath parents securely inside/outside pools!
  const nodeMap = {};
  finalNodes.forEach(n => nodeMap[n.id] = n);

  metaNodes.forEach(m => {
    const parentEdge = edges.find(e => e.target === m.id || e.source === m.id);
    const parentId = parentEdge ? (parentEdge.source === m.id ? parentEdge.target : parentEdge.source) : null;
    const parent = parentId ? nodeMap[parentId] : null;

    if (parent) {
      const siblings = metaNodes.filter(sib => edges.some(e => (e.target === sib.id || e.source === sib.id) && (e.source === parent.id || e.target === parent.id)));
      siblings.sort((a, b) => a.id.localeCompare(b.id));
      const idx = siblings.findIndex(s => s.id === m.id);

      const pW = parent.width || parent.style?.width || 160;
      const pH = parent.height || parent.style?.height || 70;
      const mW = m.width || m.style?.width || 120;

      finalNodes.push({
        ...m,
        position: {
          x: parent.position.x + pW / 2 - mW / 2,
          y: parent.position.y + pH + 40 + (idx * 90)
        },
        parentNode: parent.parentNode || undefined,
        zIndex: 5
      });
    } else {
      finalNodes.push(m);
    }
  });

  return finalNodes;
}


/* ---------- SMART MODELING RULES ---------- */
const PRESET_COLORS = [
  { name: 'Default', value: undefined },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Purple', value: '#a855f7' },
];

const getContextPadItems = (sourceNode) => {
  const isBPMN = sourceNode.type && sourceNode.type.startsWith('bpmn_');

  return [
    { type: isBPMN ? 'bpmn_event' : 'event', icon: Play, label: 'Event', color: 'text-green-500' },
    { type: isBPMN ? 'bpmn_gateway' : 'rule', icon: Zap, label: 'Gateway', color: 'text-orange-500' },
    { type: isBPMN ? 'bpmn_task' : 'function', icon: Square, label: 'Task', color: 'text-blue-500' },
    { type: 'bpmn_data', icon: FileText, label: 'Data', color: 'text-slate-500' },
    { type: 'settings', icon: Settings, label: 'Config', color: 'text-slate-600' },
    { type: 'color', icon: Palette, label: 'Color', color: 'text-pink-500' },
    { type: 'expand_meta', icon: ClipboardList, label: 'Meta', color: 'text-indigo-500' },
    { type: 'trash', icon: Trash2, label: 'Delete', color: 'text-red-500' },
  ];
};


/* ---------- Editable Label ---------- */
function Editable({ value, onChange, style, readOnly }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  const commit = () => {
    setEditing(false);
    if (val.trim() !== "" && val !== value) onChange(val);
  };
  return editing ? (
    <input
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      className="w-[90%] text-xs text-center bg-transparent outline-none border-b border-theme-accent nodrag text-black"
      style={style}
      onClick={(e) => e.stopPropagation()}
    />
  ) : (
    <div
      onDoubleClick={() => !readOnly && setEditing(true)}
      onClick={(e) => e.stopPropagation()} // Prevent node click (collapse) when clicking text
      className="cursor-text leading-tight w-full text-center hover:bg-theme-primary/10 rounded px-1 transition-colors nodrag"
      style={style}
      title={t('doubleClickToEdit')}
    >
      {value || t('unnamed')}
    </div>
  );
}


// Node logic moved to ProcessNodes.jsx, FADNodes.jsx, and OrgNodes.jsx

import ShapeNode from "./ShapeNode";

// Organizational Type relocated to OrgNodes.jsx
export const nodeTypes = {
  event: EventNode,
  function: FunctionNode,
  // VACD 
  ...vacdNodeTypes,
  rule: RuleNode,
  role: RoleNode,
  info: InfoNode,
  decision: RuleNode,
  xor: RuleNode,
  or: RuleNode,
  and: RuleNode,
  // FAD Types
  system: InfoNode,
  document: InfoNode,
  risk: EventNode,
  control: FunctionNode,
  // Organizational Type
  org_element: OrganizationalElementNode,
  // FAD Central Node
  fad_process: FADProcessNode,
  // Generic Resizable Shape
  shape: ShapeNode,
  // New Sidebar Mappings
  connector: ShapeNode,
  group: ShapeNode,
  pool: ShapeNode,
  lane: ShapeNode,
  database: InfoNode,
  person: OrganizationalElementNode,
  department: OrganizationalElementNode,
  external: OrganizationalElementNode,
  processgroup: vacdNodeTypes.processgroup,
  valueaddedchain: vacdNodeTypes.valueaddedchain,
  process: vacdNodeTypes.core_process,
  action: FunctionNode,
  emotion: EventNode,
  // BPMN Types
  bpmn_event: BPMNEventNode,
  bpmn_task: BPMNTaskNode,
  bpmn_gateway: BPMNGatewayNode,
  bpmn_data: BPMNDataNode,
  bpmn_pool: BPMNPoolNode,
  bpmn_lane: BPMNLaneNode,
  bpmn_empty_lane: BPMNEmptyLaneNode,
};



/* ---------- MAIN APP ---------- */
export default function EPCBuilder() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const aiAssistantEnabled = useAuthStore((state) => state.isFeatureEnabled('ai_assistant'));

  useEffect(() => {
    const parent = searchParams.get('parent');
    if (parent) setProcessParent(parent);
  }, [searchParams]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // --- AI Companion & Progressive Generation States ---
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState(0); 
  // Phases: 0=Understanding, 1=Analyzing, 2=Generating, 3=Finalizing
  const [previewMode, setPreviewMode] = useState(false);
  
  const backupNodesRef = useRef(null);
  const backupEdgesRef = useRef(null);
  
  const abortControllerRef = useRef(null);
  const generationQueueRef = useRef({ nodes: [], edges: [] });
  const generationTimerRef = useRef(null);

  // Listen for AI generation events if any, or simulate them
  useEffect(() => {
    const handleAIGenerationStart = () => {
        setIsAIGenerating(true);
        setGenerationPhase(0);
        // Simulate initial phases for UI
        setTimeout(() => setGenerationPhase(1), 1500); // Analyzing
        setTimeout(() => setGenerationPhase(2), 3000); // Generating
    };
    const handleAIGenerationEnd = () => setIsAIGenerating(false);
    
    window.addEventListener('ai-generation-start', handleAIGenerationStart);
    window.addEventListener('ai-generation-end', handleAIGenerationEnd);
    return () => {
      window.removeEventListener('ai-generation-start', handleAIGenerationStart);
      window.removeEventListener('ai-generation-end', handleAIGenerationEnd);
    };
  }, []);

  // Throttled emitter for position changes to ensure smooth UI movement
  const throttledPositionEmit = useMemo(
    () => throttle((processId, changes) => {
      socketService.emitNodeChange(processId, changes);
    }, 100),
    []
  );


  const onEdgesChangeSocket = useCallback((changes) => {
    onEdgesChange(changes);
    if (id && id !== 'new') {
      socketService.emitEdgeChange(id, changes);
    }
  }, [id, onEdgesChange]);

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    if (generationTimerRef.current) {
        clearInterval(generationTimerRef.current);
    }
    // Revert canvas to backup if we started drawing
    if (backupNodesRef.current !== null) {
        setNodes(backupNodesRef.current);
        setEdges(backupEdgesRef.current);
        backupNodesRef.current = null;
        backupEdgesRef.current = null;
    }
    setIsAIGenerating(false);
    setPreviewMode(false);
  }, [setNodes, setEdges]);

  const onNodesChangeSocket = useCallback((changes) => {
    // Intercept 'remove' changes to clean up associated metadata/children
    const removals = changes.filter(c => c.type === 'remove');
    let extraNodeChanges = [];
    let extraEdgeChanges = [];

    if (removals.length > 0) {
      removals.forEach(rm => {
        const node = nodes.find(n => n.id === rm.id);
        if (!node) return;

        // 0. Reallocate swimlane space if a lane is deleted
        if (node.type === 'bpmn_lane' || node.type === 'bpmn_empty_lane') {
          const poolId = node.parentNode;
          if (poolId) {
            const allLanes = nodes.filter(n => n.parentNode === poolId && (n.type === 'bpmn_lane' || n.type === 'bpmn_empty_lane'));
            allLanes.sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));
            const laneIndex = allLanes.findIndex(n => n.id === node.id);
            
            const nodeHeight = Number(node.height || node.style?.height || 0);

            if (allLanes.length > 1 && laneIndex !== -1) {
              const isFirstLane = laneIndex === 0;
              const targetLane = isFirstLane ? allLanes[1] : allLanes[laneIndex - 1];
              
              if (targetLane) {
                const targetCurrentH = Number(targetLane.height || targetLane.style?.height || 0);
                const newTargetH = targetCurrentH + nodeHeight;
                
                setTimeout(() => {
                  setNodes(nds => nds.map(n => {
                    if (n.id === targetLane.id) {
                      return {
                        ...n,
                        height: newTargetH,
                        style: { ...(n.style || {}), height: newTargetH },
                        position: isFirstLane ? { ...n.position, y: n.position.y - nodeHeight } : n.position
                      };
                    }
                    return n;
                  }));
                }, 10);
              }
            }
          }
        }

        // 1. Identify metadata children (using the same heuristic as Expand/Collapse)
        const prefix = `${node.id}-meta-`;
        const connectedNeighborIds = edges
          .filter(e => e.source === node.id || e.target === node.id)
          .map(e => e.source === node.id ? e.target : e.source);

        const getAllDescendantIds = (parentId, allNodes) => {
          let descendants = [];
          const children = allNodes.filter(n => n.parentNode === parentId);
          children.forEach(child => {
            descendants.push(child.id);
            descendants = descendants.concat(getAllDescendantIds(child.id, allNodes));
          });
          return descendants;
        };
        const descendantIds = getAllDescendantIds(node.id, nodes);

        const isChild = (n) => {
          if (n.id === rm.id) return false; // Skip the node already being removed
          if (descendantIds.includes(n.id)) return true; // Auto-delete all container children (e.g. lanes in pool)
          if (n.id.startsWith(prefix)) return true;
          if (n.data?.parentId === node.id) return true;
          // Only auto-delete 'meta-type' nodes that are explicitly connected
          const isMetaType = ['info', 'role', 'system', 'document', 'risk', 'control'].includes(n.type);
          if (connectedNeighborIds.includes(n.id) && (isMetaType || n.data?.isMeta)) return true;
          return false;
        };

        const metaChildren = nodes.filter(isChild);

        metaChildren.forEach(child => {
          if (!changes.some(c => c.id === child.id) && !extraNodeChanges.some(c => c.id === child.id)) {
            extraNodeChanges.push({ id: child.id, type: 'remove' });

            // Schedule connected edges for removal
            edges.forEach(e => {
              if (e.source === child.id || e.target === child.id) {
                if (!extraEdgeChanges.some(ec => ec.id === e.id)) {
                  extraEdgeChanges.push({ id: e.id, type: 'remove' });
                }
              }
            });
          }
        });

        // 2. Cleanup left-collapsed hidden nodes
        if (node.data?.leftCollapsedNodeIds?.length > 0) {
          node.data.leftCollapsedNodeIds.forEach(childId => {
            if (!changes.some(c => c.id === childId) && !extraNodeChanges.some(c => c.id === childId)) {
              extraNodeChanges.push({ id: childId, type: 'remove' });

              edges.forEach(e => {
                if (e.source === childId || e.target === childId) {
                  if (!extraEdgeChanges.some(ec => ec.id === e.id)) {
                    extraEdgeChanges.push({ id: e.id, type: 'remove' });
                  }
                }
              });
            }
          });
        }
      });
    }

    const allNodeChanges = [...changes, ...extraNodeChanges];

    // All swim-lane resize reconciliation is handled in the component onResize callbacks
    // (BPMNPoolNode.handlePoolResize, BPMNLaneNode.handleTopResize/handleBottomResize).
    // Here we just apply all changes natively via ReactFlow.
    onNodesChange(allNodeChanges);

    // Broadcast node deletions and position changes
    if (id && id !== 'new') {
      const positionChanges = allNodeChanges.filter(c => c.type === 'position');
      const otherChanges = allNodeChanges.filter(c => c.type !== 'position');

      // Immediate broadcast for deletions/selections/etc.
      if (otherChanges.length > 0) {
        socketService.emitNodeChange(id, otherChanges);
      }

      // Throttled broadcast for positions to prevent lag
      if (positionChanges.length > 0) {
        throttledPositionEmit(id, positionChanges);
      }
    }

    // Process secondary edge deletions slightly delayed to avoid ReactFlow sync conflicts
    if (extraEdgeChanges.length > 0) {
      setTimeout(() => {
        onEdgesChangeSocket(extraEdgeChanges);
      }, 0);
    }
  }, [id, onNodesChange, onEdgesChangeSocket, nodes, edges]);

  /* ---------- Connect Interaction ---------- */
  const onConnect = useCallback(
    (conn) => setEdges((eds) => addEdge(conn, eds)),
    [setEdges]
  );

  const onConnectSocket = useCallback((params) => {
    if (isPreviewMode) return;
    // Create the enhanced connection object here so it can be sent to socket AND applied locally
    const enhancedConnection = {
      ...params,
      type: 'smoothstep',
      animated: false,
      isManualEdge: true, // Mark as manually created to preserve handles
      markerStart: undefined, // Ensure no arrow at source
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#64748b",
      },
      style: {
        stroke: "#64748b",
        strokeWidth: 2,
      },
    };

    onConnect(enhancedConnection);

    if (id && id !== 'new') {
      socketService.emitNewConnection(id, enhancedConnection);
    }
  }, [id, onConnect]);


  const handleEdgeLabelUpdate = useCallback((edgeId, newLabel) => {
    if (isPreviewMode) return;
    setEdges((eds) => eds.map(e => {
      if (e.id === edgeId) {
        const updatedEdge = { ...e, data: { ...e.data, label: newLabel, isEditing: false } };
        // Emit to socket for real-time edge label update
        if (id && id !== 'new') {
          socketService.emitEdgeDataUpdate(id, edgeId, { label: newLabel, isEditing: false });
        }
        return updatedEdge;
      }
      return e;
    }));
  }, [id, setEdges]);



  // Make sure new edges get the label change handler
  useEffect(() => {
    setEdges((eds) => eds.map(e => {
      if (!e.data || !e.data.onLabelChange) {
        return {
          ...e,
          data: {
            ...e.data,
            onLabelChange: handleEdgeLabelUpdate
          }
        };
      }
      return e;
    }));
  }, [handleEdgeLabelUpdate, edges.length]);

  const nodeTypesMemo = useMemo(() => nodeTypes, []); // Fix for ReactFlow warning
  const edgeTypesMemo = useMemo(() => ({ smoothstep: MovableEdge }), []);
  const [loading, setLoading] = useState(false);
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // Version History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [historySnapshots, setHistorySnapshots] = useState([]);
  const [originalModelData, setOriginalModelData] = useState(null);
  const [isRightOpen, setIsRightOpen] = useState(false);
  const [processStatus, setProcessStatus] = useState(null);
  const [currentPreviewSnapshot, setCurrentPreviewSnapshot] = useState(null);

  const [showGrid, setShowGrid] = useState(true);
  const [layoutDirection, setLayoutDirection] = useState('LR');
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [isHandMode, setIsHandMode] = useState(false);
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [processParent, setProcessParent] = useState(null);
  const [expansionRules, setExpansionRules] = useState({});
  const [fadNodes, setFadNodes] = useState([]);
  const [fadEdges, setFadEdges] = useState([]);
  const [diagramType, setDiagramType] = useState('process'); // 'process' or 'organization'
  // VACD Inline Expansion State: Map<vacdNodeId, { nodes: [], edges: [] }>
  const [expandedVACDs, setExpandedVACDs] = useState({});
  const [activeUsers, setActiveUsers] = useState([]);
  const { user } = useAuthStore(); // Get user from store
  const [currentUser, setCurrentUser] = useState(null);
  const parentId = searchParams.get("parent");
  const isViewMode = searchParams.get("mode") === "view";
  const [remoteUsers, setRemoteUsers] = useState({}); // { userId: { ...user, cursor: {x,y}, selectedNodes: [] } }
  const [selectedShapeSet, setSelectedShapeSet] = useState('common');
  const [selectedNodeForPanel, setSelectedNodeForPanel] = useState(null);
  const [orgAttributes, setOrgAttributes] = useState([]);

  // Copy & Paste state
  const copiedElementsRef = useRef({ nodes: [], edges: [] });
  const pasteOffsetRef = useRef({ x: 50, y: 50 });

  const reactFlowWrapper = useRef(null);
  const clickTimerRef = useRef(null); // Ref for handling double-click prevention logic
  // ReactFlow instance state
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const { getNodes, setNodes: setRfNodes, setEdges: setRfEdges, screenToFlowPosition } = useReactFlow();
  const [helperLines, setHelperLines] = useState({ horizontal: null, vertical: null });

  // Quick Context Pad state
  const [contextPad, setContextPad] = useState({ show: false, node: null, x: 0, y: 0, showColors: false });

  // Socket Connection & Events
  useEffect(() => {
    if (!id || id === 'new' || !user) return;

    const userInfo = {
      name: user.name || 'Anonymous',
      // Generate a consistent color based on user ID or name
      color: '#' + Math.floor(Math.abs(Math.sin((user.id || user._id || user.name || 'user').split('').reduce((a, b) => a + b.charCodeAt(0), 0)) * 16777215)).toString(16).padStart(6, '0'),
      avatar: user.avatar,
      id: user.id || user._id
    };

    socketService.connect();
    socketService.joinProcess(id, userInfo);

    socketService.onPresenceUpdate((users) => {
      setActiveUsers(users);
      // Clean up remoteUsers if someone left
      setRemoteUsers(prev => {
        const currentIds = users.map(u => u.id);
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (!currentIds.includes(key)) delete next[key];
        });
        return next;
      });
    });

    socketService.onCursorNodeUpdate((data) => {
      const mySid = socketService.socket?.id;
      if (data.userId === mySid) return;

      const myId = user.id || user._id;
      if (data.userId === myId) return; // Ignore self

      setRemoteUsers(prev => {
        const existing = prev[data.userId] ? { ...prev[data.userId] } : { ...data.userInfo };

        if (data.type === 'cursor') {
          existing.cursor = data.position;
        } else if (data.type === 'selection') {
          existing.selectedNodes = data.selectedNodes;
        } else if (data.type === 'cursor_leave') {
          delete existing.cursor;
        }

        return { ...prev, [data.userId]: existing };
      });
    });

    socketService.onNodeUpdate(({ userId, changes }) => {
      const mySid = socketService.socket?.id;
      if (userId === mySid) return;

      setNodes((nds) => {
        // Handle custom 'data' changes manually since applyNodeChanges doesn't support them
        const dataChanges = changes.filter(c => c.type === 'data');
        const standardChanges = changes.filter(c => c.type !== 'data');

        let updatedNodes = nds;

        // Apply standard React Flow changes (position, flow, selection, etc.)
        if (standardChanges.length > 0) {
          updatedNodes = applyNodeChanges(standardChanges, updatedNodes);
        }

        // Apply custom data changes (color, label, etc.)
        if (dataChanges.length > 0) {
          updatedNodes = updatedNodes.map(node => {
            const change = dataChanges.find(c => c.id === node.id);
            if (change) {
              return {
                ...node,
                data: { ...node.data, ...change.data }
              };
            }
            return node;
          });
        }

        return updatedNodes;
      });
    });

    socketService.onNodeDataUpdate(({ userId, nodeId, data }) => {
      const mySid = socketService.socket?.id;
      if (userId === mySid) return;

      console.log('[DEBUG] Received node data update:', nodeId, data);
      setNodes((nds) => nds.map((n) => {
        if (n.id === nodeId) {
          // If the selected node is updated, we might need to update the panel too
          // But selectedNodeForPanel is state, so we should sync it if it matches
          if (selectedNodeForPanel && selectedNodeForPanel.id === nodeId) {
            setSelectedNodeForPanel({ ...n, data: { ...n.data, ...data } });
          }
          return { ...n, data: { ...n.data, ...data } };
        }
        return n;
      }));
    });

    socketService.onEdgeUpdate(({ userId, changes }) => {
      const mySid = socketService.socket?.id;
      if (userId === mySid) return;

      setEdges((eds) => applyEdgeChanges(changes, eds));
    });

    socketService.onEdgeDataUpdate(({ userId, edgeId, data }) => {
      const mySid = socketService.socket?.id;
      if (userId === mySid) return;

      setEdges((eds) => eds.map((e) => {
        if (e.id === edgeId) {
          return { ...e, data: { ...e.data, ...data } };
        }
        return e;
      }));
    });

    socketService.onConnectionUpdate(({ userId, connection }) => {
      const mySid = socketService.socket?.id;
      if (userId === mySid) return;

      setEdges((eds) => addEdge(connection, eds));
    });

    socketService.onNodeAdded(({ userId, node }) => {
      const mySid = socketService.socket?.id;
      if (userId === mySid) return;

      setNodes((nds) => nds.concat(node));
    });



    return () => {
      socketService.leaveProcess(id);
      socketService.offPresenceUpdate();
      socketService.offCursorNodeUpdate();
      socketService.offDiagramUpdates();
    };
  }, [id, user]);


  const handleMouseLeave = useCallback(() => {
    if (!id || id === 'new') return;
    socketService.emitCursorLeave(id);
  }, [id]);

  const handleMouseMove = useCallback(
    throttle((event) => {
      if (!reactFlowInstance || !id || id === 'new') return;

      // We use the wrapper's client coordinates and convert to flow position
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      socketService.emitCursorMove(id, position);
    }, 50),
    [reactFlowInstance, id]
  );

  const handleNodeDrag = useCallback(
    throttle((event, node) => {
      // Hide Context Pad only if it's currently showing to prevent redundant renders
      setContextPad(prev => {
        if (prev.show) return { show: false, node: null, x: 0, y: 0, showColors: false };
        return prev;
      });
      if (!id || id === 'new' || !event) return;

      if (reactFlowInstance) {
        // Calculate helper lines
        const currentNodes = reactFlowInstance.getNodes();
        const helper = getHelperLines(node, currentNodes);

        setHelperLines(prev => {
          if (prev.horizontal !== helper.horizontal || prev.vertical !== helper.vertical) {
            return {
              horizontal: helper.horizontal,
              vertical: helper.vertical,
              snapPosition: helper.snapPosition,
              isSnapped: helper.isSnapped
            };
          }
          return prev;
        });

        // Calculate cursor position from the event
        if (event.clientX && event.clientY) {
          const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          socketService.emitCursorMove(id, position);
        }
      }
    }, 50),
    [reactFlowInstance, id]
  );

  const handleNodeDragStop = useCallback((event, node) => {
    if (helperLines.isSnapped && helperLines.snapPosition && node) {
      // Apply ONLY the snapped axes, allowing free movement on the unsnapped axis
      const finalPosition = {
        x: helperLines.snapPosition.x !== undefined ? helperLines.snapPosition.x : node.position.x,
        y: helperLines.snapPosition.y !== undefined ? helperLines.snapPosition.y : node.position.y
      };

      // Apply snapped position
      setNodes((nds) => nds.map((n) => {
        if (n.id === node.id) {
          return { ...n, position: finalPosition };
        }
        return n;
      }));

      // Broadcast position to other users
      if (id && id !== 'new') {
        socketService.emitNodeChange(id, [{
          id: node.id,
          type: 'position',
          position: finalPosition
        }]);
      }
    }

    // Clear helper lines
    setHelperLines({ horizontal: null, vertical: null, snapPosition: null, isSnapped: false });
  }, [helperLines, id, setNodes]);

  // Handle manual data updates (label, description, dictionary)
  const handleNodeDataUpdate = useCallback((nodeId, newData) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === nodeId) {
        const updatedNode = { ...n, data: { ...n.data, ...newData } };
        // Also update panel state if it's the selected one
        if (selectedNodeForPanel && selectedNodeForPanel.id === nodeId) {
          setSelectedNodeForPanel(updatedNode);
        }
        return updatedNode;
      }
      return n;
    }));

    if (id && id !== 'new') {
      socketService.emitNodeDataUpdate(id, nodeId, newData);
    }
  }, [id, selectedNodeForPanel, setNodes]);

  const handleSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    if (!id || id === 'new') return;
    socketService.emitSelectionChange(id, selectedNodes.map(n => n.id));

    // Disable auto-opening panel on selection
    // if (selectedNodes.length === 1) {
    //   setSelectedNodeForPanel(selectedNodes[0]);
    // } else {
    //   setSelectedNodeForPanel(null);
    // }
  }, [id]);

  const handleVacdDoubleClick = async (event, node) => {
    // 0. Cancel Single Click if pending
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    // 1. Check if it's a VACD-related node
    if (!['vacd', 'valueaddedchain', 'processgroup'].includes(node.type)) {
      if (node.data && node.data.linkedProcessId) {
        window.open(`/workspace?id=${node.data.linkedProcessId}`, '_blank');
      }
      return;
    }

    event.preventDefault(); // Stop default (edit mode)

    // 2. Check if already expanded -> Collapse
    if (expandedVACDs[node.id]) {
      const expansionData = expandedVACDs[node.id];

      // Remove expanded nodes
      setNodes((nds) => nds.filter(n => !expansionData.nodes.includes(n.id)));
      setEdges((eds) => eds.filter(e => !expansionData.edges.includes(e.id)));

      setExpandedVACDs(prev => {
        const next = { ...prev };
        delete next[node.id];
        return next;
      });
      return;
    }

    // 3. Expand Logic
    if (!node.data.linkedProcessId) {
      setToast({ show: true, message: "No linked process to expand. Right click to link.", type: 'warning' });
      return;
    }

    try {
      const api = (await import("../../services/api_service")).default;
      const res = await api.get(`${NETWORK_URLS.GetProcesses}${node.data.linkedProcessId}`);

      if (!res.data) {
        throw new Error("No data found");
      }

      const subNodes = res.data.as_is_nodes || res.data.nodes || [];
      const subEdges = res.data.as_is_edges || res.data.edges || [];

      if (subNodes.length === 0) {
        setToast({ show: true, message: "Linked process is empty.", type: 'warning' });
        return;
      }

      // 4. Transform & Remap IDs
      const prefix = `${node.id}_`;

      // Geometry Calculations
      // We want the sub-process to start to the RIGHT of the VACD node
      const GAP_X = 150;
      const nodeWidth = node.width || node.style?.width || 220;
      const targetStartX = node.position.x + nodeWidth + GAP_X;

      // Calculate bounding box of the sub-process
      const contentMinX = Math.min(...subNodes.map(n => n.position.x));
      const contentMinY = Math.min(...subNodes.map(n => n.position.y));
      const contentMaxY = Math.max(...subNodes.map(n => n.position.y + (n.height || (n.style?.height || 60))));
      const contentHeight = contentMaxY - contentMinY;
      const contentCenterY = contentMinY + contentHeight / 2;

      const nodeHeight = node.height || node.style?.height || 60;
      const nodeCenterY = node.position.y + nodeHeight / 2;

      // Vertical Shift: Move sub-process so its center aligns with VACD center
      const shiftY = nodeCenterY - contentCenterY;

      const newNodes = subNodes.map(n => ({
        ...n,
        id: prefix + n.id,
        position: {
          x: n.position.x - contentMinX + targetStartX,
          y: n.position.y + shiftY
        },
        selected: false,
        draggable: true,
        data: {
          ...n.data,
          label: n.data.label || n.label,
          isExpandedNode: true,
          parentId: node.id
        }
      }));

      const newEdges = subEdges.map(e => ({
        ...e,
        id: prefix + e.source + '-' + e.target,
        source: prefix + e.source,
        target: prefix + e.target,
        selected: false,
        isExpansionEdge: true
      }));

      // 5. Create Connection Edge
      const sortedByX = [...newNodes].sort((a, b) => a.position.x - b.position.x);
      const startNode = sortedByX[0];

      // Use handles based on node type
      const sourceHandle = (node.type === 'processgroup') ? Position.Bottom : 'r';

      const connectionEdge = {
        id: `${node.id}-connector`,
        source: node.id,
        target: startNode.id,
        sourceHandle: sourceHandle,
        targetHandle: 'l',
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#64748b', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#64748b",
        },
        isExpansionEdge: true
      };

      // 6. Update State
      setNodes(prev => [...prev, ...newNodes]);
      setEdges(prev => [...prev, ...newEdges, connectionEdge]);

      const addedNodeIds = newNodes.map(n => n.id);
      const addedEdgeIds = [...newEdges.map(e => e.id), connectionEdge.id];

      setExpandedVACDs(prev => ({
        ...prev,
        [node.id]: { nodes: addedNodeIds, edges: addedEdgeIds }
      }));

    } catch (err) {
      console.error("Expansion failed", err);
      setToast({ show: true, message: "Failed to load linked process", type: 'error' });
    }
  };

  // VACD "Collapse Left" Logic
  const handleCollapseLeft = useCallback((node) => {
    // Determine state from the *latest* nodes state (passed via contextMenu logic finding) or fallback to param
    const latestNode = nodes.find(n => n.id === node.id) || node;
    const isCollapsed = latestNode.data?.isLeftCollapsed;

    if (isCollapsed) {
      // --- EXPAND LEFT ---
      const nodesToRestore = latestNode.data?.leftCollapsedNodeIds || [];

      if (nodesToRestore.length === 0) {
        // Just reset flag if empty
        setNodes((nds) => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, isLeftCollapsed: false } } : n));
        setContextMenu(prev => ({ ...prev, show: false }));
        return;
      }

      setNodes((nds) => nds.map((n) => {
        if (nodesToRestore.includes(n.id)) {
          return { ...n, hidden: false };
        }
        if (n.id === node.id) {
          return {
            ...n,
            data: {
              ...n.data,
              isLeftCollapsed: false,
              leftCollapsedNodeIds: []
            }
          };
        }
        return n;
      }));

      setEdges((eds) => eds.map((e) => {
        if (nodesToRestore.includes(e.source) || nodesToRestore.includes(e.target)) {
          return { ...e, hidden: false };
        }
        return e;
      }));

    } else {
      // --- COLLAPSE LEFT ---
      // Requirement: Collapse "chain" connected to the LEFT ('l') handle.
      // Arrow direction doesn't matter (undirected traversal).

      const startNodeId = node.id;
      const visited = new Set([startNodeId]); // Don't traverse back through start node
      const nodesToHide = new Set();
      const leftNeighbors = [];

      // 1. Identify neighbors connected strictly to the Left Handle
      edges.forEach((e) => {
        if (e.target === startNodeId && e.targetHandle === 'l') {
          leftNeighbors.push(e.source);
        } else if (e.source === startNodeId && e.sourceHandle === 'l') {
          leftNeighbors.push(e.target);
        }
      });

      if (leftNeighbors.length === 0) {
        setToast({ show: true, message: "No nodes connected to the left side.", type: 'error' });
        setContextMenu(prev => ({ ...prev, show: false }));
        return;
      }

      // 2. BFS Traversal (Undirected)
      const queue = [...leftNeighbors];

      // Mark initial neighbors
      leftNeighbors.forEach(nid => {
        visited.add(nid);
        nodesToHide.add(nid);
      });

      while (queue.length > 0) {
        const currentId = queue.shift();

        // Find all undirected connections for current node
        edges.forEach((e) => {
          let neighbor = null;
          if (e.source === currentId) neighbor = e.target;
          else if (e.target === currentId) neighbor = e.source;

          // If neighbor found and not yet visited (and not the start node)
          if (neighbor && !visited.has(neighbor)) {
            visited.add(neighbor);
            nodesToHide.add(neighbor);
            queue.push(neighbor);
          }
        });
      }

      const toHideList = Array.from(nodesToHide);

      if (toHideList.length === 0) {
        // Should be covered by leftNeighbors check, but safe guard
        setContextMenu(prev => ({ ...prev, show: false }));
        return;
      }

      // 3. Apply changes
      setNodes((nds) => nds.map((n) => {
        if (toHideList.includes(n.id)) {
          return { ...n, hidden: true };
        }
        if (n.id === node.id) {
          return {
            ...n,
            data: {
              ...n.data,
              isLeftCollapsed: true,
              leftCollapsedNodeIds: toHideList
            }
          };
        }
        return n;
      }));

      setEdges((eds) => eds.map((e) => {
        // Hide edges connected to hidden nodes
        if (toHideList.includes(e.source) || toHideList.includes(e.target)) {
          return { ...e, hidden: true };
        }
        return e;
      }));
    }

    setContextMenu(prev => ({ ...prev, show: false }));
  }, [nodes, edges, setNodes, setEdges]);



  const [messages, setMessages] = useState(() => {
    if (id && id !== "new") {
      try {
        const saved = localStorage.getItem(`epc_chat_${id}`);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Failed to load chat from localStorage", e);
        return [];
      }
    }
    return [];
  });

  // Sync messages when ID changes (navigation)
  useEffect(() => {
    // Ensure sidebar starts closed on navigation/load
    setIsRightOpen(false);

    if (id && id !== "new") {
      try {
        const saved = localStorage.getItem(`epc_chat_${id}`);
        setMessages(saved ? JSON.parse(saved) : []);
      } catch (e) {
        console.error("Failed to load chat from localStorage", e);
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [id]);

  // Save messages on change
  useEffect(() => {
    if (id && id !== "new") {
      localStorage.setItem(`epc_chat_${id}`, JSON.stringify(messages));
    }
  }, [messages, id]);
  // Diagram Version Management (As-Is / To-Be)
  const [diagramVersion, setDiagramVersion] = useState('as-is'); // 'as-is' or 'to-be'
  const [asIsNodes, setAsIsNodes] = useState([]);
  const [asIsEdges, setAsIsEdges] = useState([]);
  /* ---------- STATE MANAGEMENT ---------- */
  const [toBeNodes, setToBeNodes] = useState([]);
  const [toBeEdges, setToBeEdges] = useState([]);
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, node: null, edge: null, show: false });
  const [orgTemplates, setOrgTemplates] = useState([]);
  /* ---------- STATE MANAGEMENT ---------- */
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingNodeId, setLinkingNodeId] = useState(null);
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [recentColors, setRecentColors] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('epc_recent_colors') || '[]');
    } catch {
      return [];
    }
  });

  const handleLinkProcess = useCallback((nodeId) => {
    setLinkingNodeId(nodeId);
    setShowLinkModal(true);
    setContextMenu({ ...contextMenu, show: false });
  }, [contextMenu]);

  const confirmLinkProcess = useCallback((process) => {
    if (!linkingNodeId) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === linkingNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              linkedProcessId: process._id,
              linkedProcessName: process.name,
              linkedProcessDepartment: process.department_name
            }
          };
        }
        return node;
      })
    );

    setShowLinkModal(false);
    setLinkingNodeId(null);
    setToast({ show: true, message: `Linked to process: ${process.name}`, type: 'success' });
  }, [linkingNodeId, setNodes, setToast]);

  const handleUnlinkProcess = useCallback((nodeId) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const newData = { ...node.data };
          delete newData.linkedProcessId;
          delete newData.linkedProcessName;
          return { ...node, data: newData };
        }
        return node;
      })
    );
    setContextMenu({ ...contextMenu, show: false });
    setToast({ show: true, message: "Process unlinked", type: 'success' });
  }, [contextMenu, setNodes, setToast]);

  const handleColorChange = useCallback((nodeId, color) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              customColor: color,
            },
          };
        }
        return node;
      })
    );

    // Broadcast change to other users
    if (id && id !== 'new') {
      socketService.emitNodeChange(id, [{
        id: nodeId,
        type: 'data',
        data: { customColor: color }
      }]);
    }

    // Add to recent colors
    if (color && color.startsWith('#')) {
      setRecentColors(prev => {
        const filtered = prev.filter(c => c !== color);
        const newRecents = [color, ...filtered].slice(0, 8);
        localStorage.setItem('epc_recent_colors', JSON.stringify(newRecents));
        return newRecents;
      });
    }
    // If the context menu is open for this node, keep it up to date
    if (contextMenu.node?.id === nodeId) {
      setContextMenu(prev => ({
        ...prev,
        node: {
          ...prev.node,
          data: {
            ...prev.node.data,
            customColor: color
          }
        }
      }));
    }
  }, [setNodes, contextMenu.node, id]);
  const [externalChatInput, setExternalChatInput] = useState("");
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const clickLockRef = useRef(false); // Debounce lock
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved', 'error'

  const handleNodeEdit = useCallback((nodeId, v) => {
    if (isPreviewMode) return;
    setNodes((nds) => {
      let extraNodes = [];
      let extraEdges = [];

      const updated = nds.map((n) => {
        if (n.id === nodeId) {
          const template = orgTemplates.find(t => normalizeString(v).includes(normalizeString(t.nodeLabel)));
          if (template && !n.data.templateApplied) {
            template.metaNodes.forEach((mNode, idx) => {
              const mId = `${n.id}-meta-global-edit-${idx}-${Date.now()}`;
              extraNodes.push({
                id: mId,
                type: mNode.type || 'info',
                hidden: true,
                position: { x: n.position.x, y: n.position.y + 150 + (idx * 100) },
                data: {
                  label: mNode.label,
                  parentId: n.id,
                  isMeta: true,
                  onEdit: handleNodeEdit,
                  onUpload: n.data.onUpload
                }
              });
              extraEdges.push({
                id: `edge-${n.id}-${mId}`,
                source: n.id,
                target: mId,
                type: "smoothstep",
                isMeta: true,
                hidden: true
              });
            });
            return { ...n, data: { ...n.data, label: v, templateApplied: true } };
          }
          return { ...n, data: { ...n.data, label: v } };
        }
        return n;
      });

      if (extraNodes.length > 0) {
        setEdges(eds => [...eds, ...extraEdges]);
        setToast({ show: true, message: `Applied global template for "${v}"`, type: 'success' });
        return [...updated, ...extraNodes];
      }
      return updated;
    });

    // Broadcast label change
    if (id && v && id !== 'new') { // Ensure we have a valid ID and value
      socketService.emitNodeChange(id, [{
        id: nodeId,
        type: 'data',
        data: { label: v }
      }]);
    }
  }, [orgTemplates, id]);
  const [orgTemplate, setOrgTemplate] = useState('classic');
  const xmlInputRef = useRef(null);
  const [hoveredAttachment, setHoveredAttachment] = useState(null); // { url, name }

  const { recordGif, isRecording, progress: gifProgress } = useGifRecorder();
  const { downloadHtml, shareFile, isDownloading: isSharing, progress: shareProgress } = useHtmlDownloader();

  // PDF Progress State
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  useEffect(() => {
    if (isRecording) {
      setToast({ show: true, message: `Generating GIF... ${gifProgress}%`, type: 'info' });
    } else if (isSharing) {
      setToast({ show: true, message: `Sharing Diagram... ${shareProgress}%`, type: 'info' });
    } else if (isPdfDownloading) {
      setToast({ show: true, message: `Preparing PDF... ${pdfProgress}%`, type: 'info' });
    } else if (gifProgress === 100 && !isRecording) {
      setToast({ show: true, message: `GIF Downloaded!`, type: 'success' });
    } else if (pdfProgress === 100 && !isPdfDownloading) {
      // PDF completion message handled in downloadPdf
    } else if (shareProgress === 100 && !isSharing) {
      setToast({ show: true, message: `PDF Uploaded & Share Menu Open!`, type: 'success' });
    }
  }, [isRecording, gifProgress, isSharing, shareProgress, isPdfDownloading, pdfProgress]);


  const handleTemplateChange = (newTemplate) => {
    setOrgTemplate(newTemplate);
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, template: newTemplate }
      }))
    );
  };

  // Undo/Redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);



  // Save to history whenever nodes or edges change
  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    if (nodes.length === 0 && edges.length === 0) return;

    const newState = { nodes, edges };
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      // Keep only last 50 states
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [nodes, edges]);

  // Auto-save functionality - save 3 seconds after last edit
  useEffect(() => {
    // Don't auto-save if:
    // - No ID (new diagram not yet saved)
    // - View mode
    // - No nodes/edges
    // - User doesn't have permission
    if (!id || id === "new" || isViewMode || (nodes.length === 0 && edges.length === 0) || (userRole !== "admin" && userRole !== "manager" && userRole !== "designer" && userRole !== "system_admin" && currentUser?.access_level !== 'editor')) {
      return;
    }

    setSaveStatus('unsaved');

    // Debounce auto-save by 3 seconds
    const autoSaveTimer = setTimeout(async () => {
      setSaveStatus('saving');
      await handleConfirmSave(true);
    }, 3000);

    return () => clearTimeout(autoSaveTimer);
  }, [nodes, edges]); // Only trigger when nodes or edges change

  // Undo/Redo/Copy/SelectAll keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Ignore validation if user is typing in an input field
      const activeElement = document.activeElement;
      const isInput = activeElement && (['INPUT', 'TEXTAREA'].includes(activeElement.tagName) || activeElement.isContentEditable);
      if (isInput) return;

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      // Select All (Ctrl + A)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
        setEdges((eds) => eds.map((edge) => ({ ...edge, selected: true })));
      }
      // Paste (Ctrl + V)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        const { nodes: clipNodes, edges: clipEdges } = copiedElementsRef.current;
        const currentOffset = pasteOffsetRef.current;

        if (clipNodes && clipNodes.length > 0) {
          e.preventDefault();
          const idMapping = {};
          const newNodes = clipNodes.map(node => {
            const newId = `copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            idMapping[node.id] = newId;

            return {
              ...node,
              id: newId,
              selected: true,
              position: {
                x: node.position.x + currentOffset.x,
                y: node.position.y + currentOffset.y
              },
              data: { ...node.data }
            };
          });

          const newEdges = clipEdges.map(edge => ({
            ...edge,
            id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            source: idMapping[edge.source],
            target: idMapping[edge.target],
            selected: true,
            data: { ...edge.data }
          }));

          // Deselect old elements, append new ones
          setNodes(nds => nds.map(n => ({ ...n, selected: false })).concat(newNodes));
          setEdges(eds => eds.map(edge => ({ ...edge, selected: false })).concat(newEdges));

          // Increment offset so consecutive pastes staircase downwards
          pasteOffsetRef.current = { x: currentOffset.x + 50, y: currentOffset.y + 50 };

          // Emit new elements to socket peers
          if (id && id !== 'new') {
            newNodes.forEach(node => socketService.emitNewNode(id, node));
            // Ensure remote users see the edges too if needed
          }
        }
      }
      // Copy (Ctrl + C) - Handles both Element Duplication and External Paste (Word/Docs)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length === 0) return;

        e.preventDefault();

        // 1. Save elements to internal clipboard for Ctrl+V
        const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
        const selectedEdges = edges.filter(ed => selectedNodeIds.has(ed.source) && selectedNodeIds.has(ed.target));

        copiedElementsRef.current = { nodes: selectedNodes, edges: selectedEdges };
        pasteOffsetRef.current = { x: 50, y: 50 }; // Reset offset on new copy

        // 2. Capture the viewport area corresponding to the nodes as a screenshot
        try {

          const padding = 50;
          const captureWidth = rect.width + padding * 2;
          const captureHeight = rect.height + padding * 2;

          // We must calculate the translate to center the selection in the capture
          // Current Viewport Transform
          const transform = getViewportForBounds(
            rect,
            captureWidth,
            captureHeight,
            1, // min zoom
            1  // max zoom
          );

          viewport.classList.add("printing"); // Optional: reuse print styling if exists

          const dataUrl = await toPng(viewport, {
            backgroundColor: "#ffffff",
            width: captureWidth,
            height: captureHeight,
            style: {
              width: captureWidth.toString(),
              height: captureHeight.toString(),
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
            },
            pixelRatio: 2, // Good quality for Word
            filter: (node) => {
              // Optional: Filter out unselected nodes? 
              // This is complex because 'node' is a DOM node, not a ReactFlow node.
              // We'd need to check data-id attributes.
              // For now, we accept that 'Copy' takes a screenshot of the rectangular area.
              // To strictly copy ONLY selected nodes visually is very expensive (hiding others).
              return true;
            }
          });

          viewport.classList.remove("printing");

          // Convert DataURL to Blob
          const res = await fetch(dataUrl);
          const blob = await res.blob();

          // Write to Clipboard
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);

        } catch (err) {
          //console.error("Copy failed", err);
          //setToast({ show: true, message: "Failed to copy image", type: 'error' });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, nodes, edges]); // Dependencies updated for state access

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(prev => prev - 1);
    }
  }, [historyIndex, history, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, history, setNodes, setEdges]);

  useEffect(() => {
    async function loadExisting() {
      if (!id || id === "new") return;

      const api = (await import("../../services/api_service")).default;
      const res = await api.get(`${NETWORK_URLS.GetProcesses}${id}`);
      setProcessParent(res.data.parent || null);
      setProcessStatus(res.data.status || 'Draft');

      // Set name so the editor doesn't ask again
      setProcessName(res.data.name);

      // Load Org Templates (Separate Collection)
      if (res.data.organization_id) {
        try {
          const templRes = await api.get(NETWORK_URLS.Templates(res.data.organization_id));
          setOrgTemplates(templRes.data || []);

          const orgRes = await api.get(NETWORK_URLS.Organization(res.data.organization_id));
          setOrgAttributes(orgRes.data.custom_attributes || []);

          // Fetch History Snapshots for the dropdown
          try {
            const histRes = await api.get(`/processes/${id}/snapshots`);
            setHistorySnapshots(histRes.data || []);
          } catch (histErr) {
            console.error("Failed to fetch snapshots", histErr);
          }
        } catch (e) {
          console.error("Failed to load org data", e);
        }
      }

      const onEdit = handleNodeEdit;

      const onUpload = (nodeId, file) => handleNodeFileUpload(nodeId, file);

      // Load As-Is diagram
      const loadedLayoutDirection = res.data.layout_direction || 'TB';
      setLayoutDirection(loadedLayoutDirection);

      const loadedAsIsNodes = (res.data.as_is_nodes || res.data.nodes || []).map((n) => ({
        ...n,
        zIndex: n.zIndex ?? (n.type === 'shape' ? -1 : 1),
        hidden: n.hidden,
        data: {
          ...n.data,
          label: n.label,
          onEdit,
          onUpload,
          isMeta: n.data?.isMeta,
          readOnly: isViewMode,
          template: (res.data.template || 'classic')
        },
      }));

      // Detect Diagram Type and Reconstruct Layout if FAD
      const detectedType = res.data.diagram_type || (loadedAsIsNodes.some(n => n.type === 'fad_process') ? 'fad' : 'process');
      setDiagramType(detectedType);

      let loadedAsIsEdges = [];
      let finalNodes = loadedAsIsNodes;

      if (detectedType === 'fad') {
        // Reconstruct FAD structure from persisted data
        const fadProcessNode = loadedAsIsNodes.find(n => n.type === 'fad_process' || n.data.is_central);

        if (fadProcessNode) {
          const fadProcess = {
            id: fadProcessNode.id,
            label: fadProcessNode.data.label,
            customColor: fadProcessNode.data.customColor,
            is_central: true,
            attachments: fadProcessNode.data.attachments,
            icon: fadProcessNode.data.icon,
            template: fadProcessNode.data.template,
            description: fadProcessNode.data.description
          };

          // Reconstruct Groups
          const groupsMap = {};
          loadedAsIsNodes.filter(n => n.id !== fadProcessNode.id).forEach(n => {
            const groupId = n.data.group_id || 'default_group';
            if (!groupsMap[groupId]) {
              groupsMap[groupId] = {
                group_id: groupId,
                group_category: n.data.group_category || 'unknown',
                side: n.data.side, // This is crucial - we persisted this!
                nodes: []
              };
            }
            groupsMap[groupId].nodes.push({
              id: n.id,
              label: n.data.label,
              category: n.data.category,
              relationship: n.data.relationship,
              customColor: n.data.customColor,
              type: n.type,
              attachments: n.data.attachments,
              icon: n.data.icon,
              template: n.data.template,
              description: n.data.description
            });
          });

          const fadGroups = Object.values(groupsMap);

          // Run Layout to fix node positions
          // Pass empty edges array as fadLayout only needs edges for some internal logic not strictly required for positioning here, 
          // or better: pass the raw edges if we had them. Here we just position nodes.
          const laidOut = fadLayout(fadProcess, fadGroups, [], loadedLayoutDirection); // Pass direction
          finalNodes = laidOut.map(n => ({
            ...n,
            data: { ...n.data, onEdit, onUpload, readOnly: isViewMode, template: (res.data.template || 'classic') }
          }));

          // REGENERATE EDGES to ensure they match clean layout, BUT PRESERVE MANUAL EDGES.
          const savedEdges = res.data.as_is_edges || res.data.edges || [];

          // 1. Separate Manual Edges (User Created) - Preserve these exactly!
          const manualEdges = savedEdges.filter(e => e.isManualEdge).map(e => ({
            ...e,
            markerStart: undefined, // Ensure no arrow at source (Fix consistency)
          }));

          // 2. Separate Auto Edges - Let Layout Engine regenerate these for perfect geometry
          const autoEdges = savedEdges.filter(e => !e.isManualEdge).map(e => ({
            source: e.source,
            target: e.target,
            label: e.label
          }));

          const generatedEdges = expandGroupEdges(autoEdges, fadProcess, fadGroups);

          // 3. Combine
          loadedAsIsEdges = [...manualEdges, ...generatedEdges];

        } else {
          // Fallback if central node missing
          loadedAsIsEdges = (res.data.as_is_edges || res.data.edges || []).map(e => ({
            ...e,
            sourceHandle: e.sourceHandle || (loadedLayoutDirection === 'LR' ? 'r' : 'b'),
            targetHandle: e.targetHandle || (loadedLayoutDirection === 'LR' ? 'l' : 't'),
            animated: false,
            type: 'smoothstep',
            markerStart: undefined, // No arrow at source
            markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b", width: 30, height: 30 },
            style: { ...e.style, stroke: "#64748b", strokeWidth: 2, strokeDasharray: '0' }
          }));
        }
      } else {
        // Standard Process/Org Loading
        loadedAsIsEdges = (res.data.as_is_edges || res.data.edges || []).map(e => ({
          ...e,
          sourceHandle: e.sourceHandle || (loadedLayoutDirection === 'LR' ? 'r' : 'b'),
          targetHandle: e.targetHandle || (loadedLayoutDirection === 'LR' ? 'l' : 't'),
          animated: false,
          type: 'smoothstep',
          markerStart: undefined, // No arrow at source
          markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b", width: 30, height: 30 },
          style: { ...e.style, stroke: "#64748b", strokeWidth: 2, strokeDasharray: '0' }
        }));
      }

      setNodes(finalNodes); // Set the computed layout

      // Load To-Be diagram (fallback to As-Is if not present - backward compatibility)
      const loadedToBeNodes = (res.data.to_be_nodes || res.data.nodes || []).map((n) => ({
        ...n,
        zIndex: n.zIndex ?? (n.type === 'shape' ? -1 : 1),
        hidden: n.hidden,
        data: {
          ...n.data,
          label: n.label,
          onEdit,
          onUpload,
          isMeta: n.data?.isMeta,
          readOnly: isViewMode,
          template: (res.data.template || 'classic')
        },
      }));

      const loadedToBeEdges = (res.data.to_be_edges || res.data.edges || []).map(e => ({
        ...e,
        sourceHandle: e.sourceHandle || (loadedLayoutDirection === 'LR' ? 'r' : 'b'),
        targetHandle: e.targetHandle || (loadedLayoutDirection === 'LR' ? 'l' : 't'),
        animated: false, // Force Solid Lines
        type: 'smoothstep',
        markerStart: undefined, // No arrow at source
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b", width: 30, height: 30 }, // Big Arrows
        style: { ...e.style, stroke: "#64748b", strokeWidth: 2, strokeDasharray: '0' } // Default to solid
      }));

      // Set version states
      setAsIsNodes(loadedAsIsNodes);
      setAsIsEdges(loadedAsIsEdges);
      setToBeNodes(loadedToBeNodes);
      setToBeEdges(loadedToBeEdges);

      // Load current version (default to as-is)
      const currentVersion = res.data.current_version || 'as-is';
      setDiagramVersion(currentVersion);

      // Set active diagram based on current version
      if (currentVersion === 'as-is') {
        setNodes(loadedAsIsNodes);
        setEdges(loadedAsIsEdges);
      } else {
        setNodes(loadedToBeNodes);
        setEdges(loadedToBeEdges);
      }

      setExpansionRules(res.data.expansionRules || {});

      // Load diagram type and template
      setDiagramType(res.data.diagram_type || 'process');
      const loadedTemplate = res.data.template || 'classic';
      setOrgTemplate(loadedTemplate);


      // Load and log FAD data
      const loadedFadNodes = res.data.fad_nodes || [];
      const loadedFadEdges = res.data.fad_edges || [];

      console.log('🔍 FAD Data loaded from backend:', {
        fadNodes: loadedFadNodes,
        fadEdges: loadedFadEdges,
        hasData: loadedFadNodes.length > 0 || loadedFadEdges.length > 0
      });

      setFadNodes(loadedFadNodes);
      setFadEdges(loadedFadEdges);

      setTimeout(() => {
        window.requestAnimationFrame(() => {
          reactFlowInstance?.fitView({ padding: 0.2 });
        });
      }, 200);
    }

    loadExisting();
  }, [id]);

  const [logoUrl, setLogoUrl] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [pdfConfig, setPdfConfig] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const api = (await import("../../services/api_service")).default;
        const res = await api.get(NETWORK_URLS.GetProfile);
        setCurrentUser(res.data);
        if (res.data.organization) {
          setLogoUrl(res.data.organization.logo_url);
          setOrgName(res.data.organization.name);
          setPdfConfig(res.data.organization.pdf_config);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };
    fetchProfile();
  }, []);





  // Save/Load state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [processName, setProcessName] = useState('');

  // Custom Modals State
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, processId: null });
  const [clearConfirmation, setClearConfirmation] = useState({ show: false });
  const [successModal, setSuccessModal] = useState({ show: false, message: '' });


  // Get user role from localStorage token
  const getUserRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  };

  const userRole = getUserRole();

  /* ---------- Version Switching Handler ---------- */
  const handleVersionSwitch = useCallback((newVersion) => {
    if (newVersion === diagramVersion) return;

    // Save current diagram to current version state
    if (diagramVersion === 'as-is') {
      setAsIsNodes(nodes);
      setAsIsEdges(edges);
    } else {
      setToBeNodes(nodes);
      setToBeEdges(edges);
    }

    // Load new version's diagram
    if (newVersion === 'as-is') {
      setNodes(asIsNodes);
      setEdges(asIsEdges);
    } else {
      setNodes(toBeNodes);
      setEdges(toBeEdges);
    }

    setDiagramVersion(newVersion);
  }, [diagramVersion, nodes, edges, asIsNodes, asIsEdges, toBeNodes, toBeEdges, setNodes, setEdges]);

  const handleNodeFileUpload = useCallback(async (nodeId, file) => {
    try {
      setLoading(true);
      const api = (await import("../../services/api_service")).default;

      // 1. Get SAS Token from backend
      const folderPath = (id && id !== 'new') ? id : 'temp';
      const blobName = `${folderPath}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const sasRes = await api.get(`${NETWORK_URLS.GetSasToken}?blobName=${encodeURIComponent(blobName)}`);
      const { url, sasToken } = sasRes.data;

      // 2. Upload directly to Azure Blob Storage using PUT
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type || 'application/octet-stream'
        }
      });

      if (!response.ok) throw new Error("Upload failed to Azure");

      // 3. Update node data with the new attachment
      const updateNodes = (nds) => nds.map((n) => {
        if (n.id === nodeId) {
          const attachments = n.data.attachments || [];
          return {
            ...n,
            data: {
              ...n.data,
              attachments: [...attachments, { name: file.name, url: url }]
            }
          };
        }
        return n;
      });

      setNodes(updateNodes);
      if (diagramVersion === 'as-is') setAsIsNodes(updateNodes);
      else if (diagramVersion === 'to-be') setToBeNodes(updateNodes);
      else if (diagramVersion === 'fad') setFadNodes(updateNodes);

      setToast({ show: true, message: "File added", type: 'success' });
    } catch (error) {
      console.error("Upload error:", error);
      setToast({ show: true, message: (t('uploadFailed') || "Upload failed") + ": " + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [setNodes, t, id, diagramVersion]);

  const handleUploadFile = useCallback(async (file, prompt = "") => {
    const content = prompt
      ? `Uploaded file: ${file.name}\nInstruction: ${prompt}`
      : `Uploaded file: ${file.name}`;

    const newMsg = {
      role: "user",
      content,
      attachment: file // Pass file object for preview
    };
    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const api = (await import("../../services/api_service")).default;
      const formData = new FormData();
      formData.append('file', file);
      if (prompt) {
        formData.append('prompt', prompt);
      }

      const res = await api.post(NETWORK_URLS.UploadDocument, formData);

      let raw = res.data?.response || "";
      if (res.data?.error) throw new Error(res.data.error);

      // Clean + Parse JSON from model response
      let epcJson = null;
      try {
        epcJson = JSON.parse(raw);
      } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) epcJson = JSON.parse(match[0]);
      }

      if (!epcJson) throw new Error(t('invalidEPCResponse'));

      const parsedNodes = epcJson.nodes || [];
      const parsedEdges = epcJson.edges || [];
      const detectedDiagramType = epcJson.diagram_type || 'process';
      setDiagramType(detectedDiagramType);

      const onEdit = (id, v) => {
        setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label: v } } : n));
      };

      const onUpload = (id, file) => handleNodeFileUpload(id, file);

      const baseNodes = parsedNodes.map((n) => ({
        id: String(n.id),
        type: ["xor", "or", "and"].includes(n.type) ? "rule" : n.type,
        data: {
          label: getGeneratedNodeLabel(n),
          icon: n.icon,
          iconName: n.iconName,
          customColor: n.customColor,
          category: n.category,
          level: n.level,
          ...getBpmnSemanticData(n),
          onEdit,
          onUpload,
          template: orgTemplate,
          hasChildren: false,
          isCollapsed: false,
        },
        category: n.category,
        level: n.level,
        position: { x: 0, y: 0 },
        parentNode: n.parentNode,
        extent: n.extent,
        style: n.style || {},
        draggable: ['bpmn_lane', 'bpmn_empty_lane', 'lane'].includes(n.type) ? false : (n.draggable ?? true),
      }));

      const rfEdges = parsedEdges.map((e, i) => {
        const edgeData = getGeneratedEdgeData(e, {}, detectedDiagramType === 'bpmn' ? 'sequence' : undefined);
        const connectorType = edgeData?.bpmnConnectorType;

        return {
          id: `edge_${i}_${Date.now()}`,
          source: e.source,
          target: e.target,
          type: "smoothstep",
          data: edgeData,
          animated: false, // Force Solid Lines
          markerStart: undefined,
          markerEnd: getBpmnEdgeMarkerEnd(connectorType), // Big Arrows
          style: getBpmnEdgeStyle(connectorType), // Force Solid
        };
      });

      const validEdges = rfEdges.filter((e) =>
        baseNodes.find((n) => n.id === e.source) && baseNodes.find((n) => n.id === e.target)
      );

      if (validEdges.length === 0 && baseNodes.length > 1 && detectedDiagramType === 'process') {
        for (let i = 0; i < baseNodes.length - 1; i++) {
          validEdges.push({
            id: `auto_${i}_${Date.now()}`,
            source: baseNodes[i].id,
            target: baseNodes[i + 1].id,
            type: "smoothstep",
            data: detectedDiagramType === 'bpmn' ? { bpmnConnectorType: 'sequence' } : undefined,
            animated: false, // Force Solid Lines
            markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b", width: 30, height: 30 }, // Big Arrows
            style: { stroke: "#64748b", strokeWidth: 2, strokeDasharray: '0' }, // Force Solid
          });
        }
      }

      let nodesFinal = [];
      let finalEdges = validEdges;

      if (detectedDiagramType === 'organization') {
        const laidOut = organizationalLayout(baseNodes, validEdges.length > 0 ? validEdges : rfEdges);
        nodesFinal = laidOut.map((n) => ({
          ...n,
          hidden: false,
          data: {
            ...n.data,
            hasChildren: (validEdges.length > 0 ? validEdges : rfEdges).some((e) => e.source === n.id),
            isCollapsed: false,
          },
        }));
      } else if (detectedDiagramType === 'fad') {
        const fadProcess = epcJson.process;
        const fadGroups = epcJson.groups;
        const fadInputEdges = epcJson.edges;

        if (fadProcess && fadGroups) {
          const laidOut = fadLayout(fadProcess, fadGroups, fadInputEdges);
          nodesFinal = laidOut.map(n => ({
            ...n,
            data: { ...n.data, onEdit, readOnly: isViewMode }
          }));
          finalEdges = expandGroupEdges(fadInputEdges, fadProcess, fadGroups);
        } else {
          const laidOut = layoutGraph(baseNodes, validEdges, layoutDirection, { nodesep: 200, ranksep: 200 });
          nodesFinal = laidOut.map((n) => ({
            ...n,
            hidden: false,
            data: {
              ...n.data,
              hasChildren: validEdges.some((e) => e.source === n.id),
              isCollapsed: false,
            },
          }));
        }
      } else if (detectedDiagramType === 'vacd') {
        // Detect template from first node's data (default to 'classic')
        const template = baseNodes.find(n => n.data?.template)?.data?.template || 'classic';
        const laidOut = vacdLayout(baseNodes, validEdges, template);
        nodesFinal = laidOut.map((n) => ({
          ...n,
          data: { ...n.data, onEdit, readOnly: isViewMode, template }
        }));
        finalEdges = expandVACDEdges(validEdges, nodesFinal);
      } else if (detectedDiagramType === 'bpmn') {
        const laidOut = bpmnLayout(baseNodes, validEdges, layoutDirection);
        nodesFinal = laidOut.map((n) => ({
          ...n,
          hidden: false,
          data: {
            ...n.data,
            hasChildren: validEdges.some((e) => e.source === n.id),
            isCollapsed: false,
          },
        }));
      } else {
        const laidOut = layoutGraph(baseNodes, validEdges, layoutDirection, { nodesep: 200, ranksep: 200 });
        nodesFinal = laidOut.map((n) => ({
          ...n,
          hidden: false,
          data: {
            ...n.data,
            hasChildren: validEdges.some((e) => e.source === n.id),
            isCollapsed: false,
          },
        }));
      }

      setAsIsNodes(nodesFinal);
      setAsIsEdges(finalEdges);
      setToBeNodes(nodesFinal);
      setToBeEdges(finalEdges);
      setDiagramVersion('as-is');
      setNodes(nodesFinal);
      setEdges(finalEdges);
      setFadNodes(epcJson.fad_nodes || []);
      setFadEdges(epcJson.fad_edges || []);

      setTimeout(() => {
        window.requestAnimationFrame(() => {
          reactFlowInstance?.fitView({ padding: 0.2 });
        });
      }, 200);

      // Call rule generator
      const rulesResponse = await api.post(NETWORK_URLS.GenerateRules, { nodes: parsedNodes });
      let ruleJson = null;
      try {
        ruleJson = JSON.parse(rulesResponse.data.response);
      } catch {
        const match = rulesResponse.data.response.match(/\{[\s\S]*\}/);
        if (match) ruleJson = JSON.parse(match[0]);
      }
      if (ruleJson?.rules) {
        const formattedRules = Object.fromEntries(
          Object.entries(ruleJson.rules).map(([type, labels]) => [
            type,
            labels.map((label) => ({ type: "info", label })),
          ])
        );
        setExpansionRules(formattedRules);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t('epcUpdated') },
      ]);

    } catch (err) {
      console.error(err);
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || t('epcUploadError') || "Error uploading document and generating diagram.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMsg },
      ]);
    } finally {
      setLoading(false);
    }
  }, [nodes, edges, layoutDirection, reactFlowInstance, expansionRules, t]);

  /* ---------- Handle Chat Message ---------- */
  const handleSendMessage = useCallback(async (text, file) => {
    if (file) {
      handleUploadFile(file, text);
      return;
    }

    const newMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    // Optimistically trigger the canvas animation if the prompt looks like a diagram request
    const actionVerbs = "create|generate|make|draw|build|design|modify|update|change|add|insert|remove|delete|rename|connect|link";
    const diagramNouns = "epc|diagram|process|flow|map|model|node|edge|connection|rule|function|event|layout";
    const isLikelyDiagramRequest = new RegExp(`(${actionVerbs}).*(${diagramNouns})`, 'i').test(text);
    
    if (isLikelyDiagramRequest) {
      setIsAIGenerating(true);
      setGenerationPhase(0); // Understanding
      setTimeout(() => {
        setGenerationPhase(prev => (prev === 0 ? 1 : prev)); // Move to Analyzing after 1.5s
      }, 1500);
    }

    try {
      abortControllerRef.current = new AbortController();
      const api = (await import("../../services/api_service")).default;

      const visibleNodes = nodes.filter(n => !n.data?.isExpandedNode);
      const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
      const visibleEdges = edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target) && !e.isExpansionEdge);

      const res = await api.post(NETWORK_URLS.GenerateEPC, {
        prompt: text,
        currentNodes: visibleNodes.length > 0 ? visibleNodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.data.label,
          icon: n.data.icon,
          iconName: n.data.iconName,
          customColor: n.data.customColor,
          parentNode: n.parentNode,
          extent: n.extent,
          eventType: n.data.eventType,
          triggerType: n.data.triggerType,
          isInterrupting: n.data.isInterrupting,
          isThrowing: n.data.isThrowing,
          activityType: n.data.activityType,
          taskType: n.data.taskType,
          loopType: n.data.loopType,
          isAdHoc: n.data.isAdHoc,
          isCompensation: n.data.isCompensation,
          gatewayType: n.data.gatewayType,
          dataType: n.data.dataType,
          // Pass persisted FAD metadata to AI
          category: n.data.category,
          group_id: n.data.group_id,
          side: n.data.side
        })) : null,
        currentEdges: visibleEdges.length > 0 ? visibleEdges.map(e => ({
          source: e.source,
          target: e.target,
          bpmnConnectorType: e.data?.bpmnConnectorType,
          label: e.data?.label
        })) : null
      }, { signal: abortControllerRef.current.signal });

      if (res.data?.error) {
        throw new Error(res.data.error);
      }
      let raw = res.data?.response || "";

      // Clean + Parse JSON from model response
      let epcJson = null;
      try {
        epcJson = JSON.parse(raw);
      } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) epcJson = JSON.parse(match[0]);
      }

      if (!epcJson) throw new Error(t('invalidEPCResponse'));

      const parsedNodes = epcJson.nodes || [];
      const parsedEdges = epcJson.edges || [];

      // Detect diagram type from AI response
      const detectedDiagramType = epcJson.diagram_type || 'process';
      
      if (detectedDiagramType === 'chat') {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: epcJson.message || "I'm here to help!" },
        ]);
        setLoading(false);
        setIsAIGenerating(false);
        return;
      }

      setDiagramType(detectedDiagramType);

      // -------------------- 2) SETUP ON-EDIT HANDLER --------------------
      const onEdit = handleNodeEdit;

      const onUpload = (id, file) => handleNodeFileUpload(id, file);

      // -------------------- 3) CREATE NODE OBJECTS --------------------
      // -------------------- 3) CREATE NODE OBJECTS --------------------
      const baseNodes = parsedNodes.map((n) => {
        // MERGE METADATA: Find existing node to preserve hidden FAD structure fields
        const existingNode = nodes.find(en => en.id === String(n.id)) || {};
        const existingData = existingNode.data || {};

        return {
          id: String(n.id),
          type: ["xor", "or", "and"].includes(n.type) ? "rule" : n.type,
          data: {
            label: getGeneratedNodeLabel(n),
            // Preserve existing visuals when AI omits them, but allow explicit AI updates.
            icon: n.icon ?? existingData.icon,
            iconName: n.iconName ?? existingData.iconName,
            customColor: n.customColor ?? existingData.customColor,
            ...getBpmnSemanticData(n, existingData),

            // CRITICAL: Preserve FAD Metadata from existing node if AI drops it
            group_id: n.group_id || existingData.group_id,
            side: n.side || existingData.side,
            group_category: n.group_category || existingData.group_category,
            is_central: n.is_central || existingData.is_central,

            category: n.category, // For organizational nodes
            level: n.level,       // For organizational nodes
            onEdit,
            onUpload,
            // Preserve existing template preference
            template: existingData.template || orgTemplate,
            hasChildren: false,
            isCollapsed: false,
          },
          // Store raw properties for organizational layout
          category: n.category,
          level: n.level,
          position: n.position || { x: 0, y: 0 },
          parentNode: n.parentNode,
          extent: n.extent,
          // Fix: Ensure VACD nodes have default dimensions for AI Generation
          style: (() => {
            if (['vacd', 'management_process', 'support_process'].includes(n.type)) return { width: 220, height: 60 };
            if (['chevron_left', 'chevron_right'].includes(n.type)) return { width: 60, height: 400 };
            return n.style || {};
          })(),
          draggable: ['bpmn_lane', 'bpmn_empty_lane', 'lane'].includes(n.type) ? false : (n.draggable ?? true),
        };
      });

      // -------------------- 4) CREATE EDGE OBJECTS --------------------
      const layoutDirection = epcJson.layout || 'LR'; // Default to Left-Right for straight flow

      // -------------------- 4) CREATE EDGE OBJECTS --------------------
      const rfEdges = parsedEdges.map((e, i) => {
        // Check if this edge already exists to preserve manual handles
        const existingEdge = edges.find(
          existing => existing.source === e.source && existing.target === e.target
        );

        let sHandle = e.sourceHandle || existingEdge?.sourceHandle || null;
        let tHandle = e.targetHandle || existingEdge?.targetHandle || null;
        const edgeData = getGeneratedEdgeData(e, existingEdge, detectedDiagramType === 'bpmn' ? 'sequence' : undefined);
        const connectorType = edgeData?.bpmnConnectorType;

        // Auto-assign handles based on layout direction if not specified
        if (!sHandle) sHandle = layoutDirection === 'LR' ? 'r' : 'b';
        if (!tHandle) tHandle = layoutDirection === 'LR' ? 'l' : 't';

        return {
          id: existingEdge?.id || `edge_${i}_${Date.now()}`,
          source: e.source,
          target: e.target,
          type: "smoothstep",
          sourceHandle: sHandle,
          targetHandle: tHandle,
          data: edgeData,
          isManualEdge: existingEdge?.isManualEdge || false,
          animated: false, // Force Solid Lines
          markerStart: undefined, // No arrow at source
          markerEnd: getBpmnEdgeMarkerEnd(connectorType), // Big Arrows
          style: getBpmnEdgeStyle(connectorType),
        };
      });

      // Auto-link if no valid edges exist (for process diagrams only)
      const validEdges = rfEdges.filter((e) =>
        baseNodes.find((n) => n.id === e.source) && baseNodes.find((n) => n.id === e.target)
      );

      if (validEdges.length === 0 && baseNodes.length > 1 && detectedDiagramType === 'process') {
        const sourceH = layoutDirection === 'LR' ? 'r' : 'b';
        const targetH = layoutDirection === 'LR' ? 'l' : 't';

        for (let i = 0; i < baseNodes.length - 1; i++) {
          // Check if this auto-link already exists
          const existingEdge = edges.find(
            e => e.source === baseNodes[i].id && e.target === baseNodes[i + 1].id
          );

          validEdges.push({
            id: existingEdge?.id || `auto_${i}_${Date.now()}`,
            source: baseNodes[i].id,
            target: baseNodes[i + 1].id,
            type: "smoothstep",
            sourceHandle: existingEdge?.sourceHandle || sourceH,
            targetHandle: existingEdge?.targetHandle || targetH,
            data: detectedDiagramType === 'bpmn' ? { bpmnConnectorType: 'sequence' } : undefined,
            isManualEdge: existingEdge?.isManualEdge || false,
            animated: false, // Force Solid Lines
            markerStart: undefined, // No arrow at source
            markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b", width: 30, height: 30 }, // Big Arrows
            style: { stroke: "#64748b", strokeWidth: 2, strokeDasharray: '0' },
          });
        }
      }

      // -------------------- 5) AUTO LAYOUT --------------------
      // Use appropriate layout based on diagram type
      let nodesFinal = [];
      let finalEdges = validEdges;

      if (detectedDiagramType === 'organization') {
        const laidOut = organizationalLayout(baseNodes, validEdges.length > 0 ? validEdges : rfEdges);
        nodesFinal = laidOut.map((n) => ({
          ...n,
          hidden: false,
          data: {
            ...n.data,
            hasChildren: (validEdges.length > 0 ? validEdges : rfEdges).some((e) => e.source === n.id),
            isCollapsed: false,
          },
        }));
      } else if (detectedDiagramType === 'fad' || (diagramType === 'fad' && baseNodes.some(n => n.data.is_central))) {
        // IMPROVED: If explicit FAD structure is returned, use it.
        // If not (incremental update), RECONSTRUCT it from baseNodes metadata to keep FAD layout.
        const fadProcess = epcJson.process || baseNodes.find(n => n.data.is_central || n.type === 'fad_process');

        let fadGroups = epcJson.groups;
        let fadInputEdges = epcJson.edges || [];

        if (!fadGroups && fadProcess) {
          // Reconstruct groups from node metadata for incremental updates
          const groupsMap = {};
          baseNodes.filter(n => n.id !== fadProcess.id).forEach(n => {
            const groupId = n.data.group_id || 'default_group';
            if (!groupsMap[groupId]) {
              groupsMap[groupId] = {
                group_id: groupId,
                group_category: n.data.group_category || 'unknown',
                side: n.data.side,
                nodes: []
              };
            }
            groupsMap[groupId].nodes.push({
              id: n.id,
              label: n.data.label,
              category: n.data.category,
              relationship: n.data.relationship,
              customColor: n.data.customColor,
              icon: n.data.icon,
              type: n.type
            });
          });
          fadGroups = Object.values(groupsMap);

          // Use current 'validEdges' (auto-linked or parsed) as input for regeneration
          fadInputEdges = validEdges.length > 0 ? validEdges.map(e => ({ source: e.source, target: e.target, label: e.label })) : [];
        }

        if (fadProcess && fadGroups) {
          // ensure fadProcess is formatted correctly if pulled from node
          const formattedProcess = {
            id: fadProcess.id,
            label: fadProcess.label || fadProcess.data?.label,
            customColor: fadProcess.data?.customColor || fadProcess.customColor,
            icon: fadProcess.data?.icon || fadProcess.icon
          };

          const laidOut = fadLayout(formattedProcess, fadGroups, fadInputEdges, layoutDirection); // Pass direction
          nodesFinal = laidOut.map(n => ({
            ...n,
            data: { ...n.data, onEdit, readOnly: isViewMode }
          }));
          finalEdges = expandGroupEdges(fadInputEdges, formattedProcess, fadGroups);
        } else {
          // Fallback only if absolutely no central node found
          const laidOut = layoutGraph(baseNodes, validEdges, layoutDirection, { nodesep: 200, ranksep: 200 });
          nodesFinal = laidOut.map((n) => ({
            ...n,
            hidden: false,
            data: {
              ...n.data,
              hasChildren: validEdges.some((e) => e.source === n.id),
              isCollapsed: false,
            },
          }));
        }
      } else if (detectedDiagramType === 'vacd') {
        // Detect template from first node's data (default to 'classic')
        const template = baseNodes.find(n => n.data?.template)?.data?.template || 'classic';
        const laidOut = vacdLayout(baseNodes, validEdges, template);
        nodesFinal = laidOut.map((n) => ({
          ...n,
          data: { ...n.data, onEdit, readOnly: isViewMode, template }
        }));
        finalEdges = expandVACDEdges(validEdges, nodesFinal);
      } else if (detectedDiagramType === 'bpmn') {
        const laidOut = bpmnLayout(baseNodes, validEdges, layoutDirection);
        nodesFinal = laidOut.map((n) => ({
          ...n,
          hidden: false,
          data: {
            ...n.data,
            hasChildren: validEdges.some((e) => e.source === n.id),
            isCollapsed: false,
          },
        }));
      } else {
        const laidOut = layoutGraph(baseNodes, validEdges, layoutDirection, { nodesep: 200, ranksep: 200 });
        nodesFinal = laidOut.map((n) => ({
          ...n,
          hidden: false,
          data: {
            ...n.data,
            hasChildren: validEdges.some((e) => e.source === n.id),
            isCollapsed: false,
          },
        }));
      }


      // Extract FAD data from AI response (for process diagram attachments)
      const fadNodesData = epcJson.fad_nodes || [];
      const fadEdgesData = epcJson.fad_edges || [];

      // Debug logging for FAD data
      console.log('🔍 FAD Data from AI:', {
        fadNodes: fadNodesData,
        fadEdges: fadEdgesData,
        hasData: fadNodesData.length > 0 || fadEdgesData.length > 0
      });

      // Set As-Is version (AI-generated baseline)
      const nodeMapFinal = {};
      nodesFinal.forEach((n) => { nodeMapFinal[n.id] = n; });

      finalEdges = finalEdges.map(e => {
        if (e.isManualEdge) return e;
        const sNode = nodeMapFinal[e.source];
        const tNode = nodeMapFinal[e.target];
        if (sNode && tNode) {
          const sX = sNode.position.x + (sNode.width || 200) / 2;
          const sY = sNode.position.y + (sNode.height || 90) / 2;
          const tX = tNode.position.x + (tNode.width || 200) / 2;
          const tY = tNode.position.y + (tNode.height || 90) / 2;

          const dx = tX - sX;
          const dy = tY - sY;

          let sHandle = layoutDirection === 'LR' ? 'r' : 'b';
          let tHandle = layoutDirection === 'LR' ? 'l' : 't';

          if (layoutDirection === 'LR') {
            if (Math.abs(dy) > 60) {
              // Diverting to a different vertical rank
              if (dy > 0) {
                sHandle = 'b'; tHandle = 'l';
              } else {
                sHandle = 't'; tHandle = 'l';
              }
            } else if (dx < 0 && Math.abs(dx) > Math.abs(dy)) {
              sHandle = 'l'; tHandle = 'r';
            }
          } else {
            if (Math.abs(dx) > 60) {
              // Diverting to a different horizontal rank
              if (dx > 0) {
                sHandle = 'r'; tHandle = 't';
              } else {
                sHandle = 'l'; tHandle = 't';
              }
            } else if (dy < 0 && Math.abs(dy) > Math.abs(dx)) {
              sHandle = 't'; tHandle = 'b';
            }
          }
          return { ...e, sourceHandle: sHandle, targetHandle: tHandle };
        }
        return e;
      });

      setAsIsNodes(nodesFinal);
      setAsIsEdges(finalEdges);

      // Set To-Be version (initially same as As-Is)
      setToBeNodes(nodesFinal);
      setToBeEdges(finalEdges);

      // Set current view to As-Is
      setDiagramVersion('as-is');
      
      // Store backups for Preview Mode
      backupNodesRef.current = nodes;
      backupEdgesRef.current = edges;

      // Start Progressive Generation
      setIsAIGenerating(true);
      setGenerationPhase(2); // Generating
      
      // Queue nodes for progressive rendering
      generationQueueRef.current = { nodes: [...nodesFinal], edges: [...finalEdges] };
      setNodes([]); // Clear canvas to start drawing
      setEdges([]);

      // Start progressive loop
      if (generationTimerRef.current) clearInterval(generationTimerRef.current);
      
      generationTimerRef.current = setInterval(() => {
          if (generationQueueRef.current.nodes.length === 0 && generationQueueRef.current.edges.length === 0) {
              clearInterval(generationTimerRef.current);
              
              // Smooth transition to finalized state
              setTimeout(() => {
                // 1. Remove all generating glow classes for production-ready look
                setNodes(prev => prev.map(n => ({
                  ...n,
                  className: n.className?.replace('node-generating-glow', '').trim()
                })));
                
                // 2. Remove edge animations if any (optional, keeping them might look nice)
                
                // 3. Switch UI modes
                setPreviewMode(true);
                setIsAIGenerating(false);
                
                // 4. Smoothly fit view
                window.requestAnimationFrame(() => {
                  reactFlowInstance?.fitView({ padding: 0.2, duration: 800 });
                });
              }, 500);
              return;
          }
          
          // Pop 1 node or edge per tick for "building" effect
          if (generationQueueRef.current.nodes.length > 0) {
              const nextNode = generationQueueRef.current.nodes.shift();
              setNodes(prev => [...prev, { 
                ...nextNode, 
                className: `${nextNode.className || ''} node-generating-glow`.trim() 
              }]);
          } else if (generationQueueRef.current.edges.length > 0) {
              const nextEdge = generationQueueRef.current.edges.shift();
              setEdges(prev => [...prev, { 
                ...nextEdge, 
                className: `${nextEdge.className || ''} path-draw-animated`.trim() 
              }]);
          }
      }, 60); // Slightly slower tick for better visual tracking

      // Set FAD data
      setFadNodes(fadNodesData);
      setFadEdges(fadEdgesData);

      // Force viewport reset handled at the end of progressive drawing
      // -------------------- 6) CALL NEW RULE GENERATOR --------------------
      const rulesResponse = await api.post(NETWORK_URLS.GenerateRules, { nodes: parsedNodes });
      let ruleJson = null;

      try {
        ruleJson = JSON.parse(rulesResponse.data.response);
      } catch {
        const match = rulesResponse.data.response.match(/\{[\s\S]*\}/);
        if (match) ruleJson = JSON.parse(match[0]);
      }

      if (ruleJson?.rules) {
        const formattedRules = Object.fromEntries(
          Object.entries(ruleJson.rules).map(([type, labels]) => [
            type,
            labels.map((label) => ({ type: "info", label })),
          ])
        );

        setExpansionRules(formattedRules);
      }

      // -------------------- 6.5) APPLY GLOBAL TEMPLATES --------------------
      if (orgTemplates.length > 0) {
        setNodes(nds => {
          let extraNodes = [];
          let extraEdges = [];

          const updatedNodes = nds.map(node => {
            const template = orgTemplates.find(t => normalizeString(node.data.label).includes(normalizeString(t.nodeLabel)));
            if (template && !node.data.templateApplied) {
              template.metaNodes.forEach((mNode, idx) => {
                const mId = `${node.id}-meta-global-${idx}`;
                extraNodes.push({
                  id: mId,
                  type: mNode.type || 'info',
                  hidden: true,
                  position: { x: node.position.x, y: node.position.y + 150 + (idx * 100) },
                  data: {
                    label: mNode.label,
                    parentId: node.id,
                    isMeta: true,
                    onEdit: node.data.onEdit,
                    onUpload: node.data.onUpload
                  }
                });
                extraEdges.push({
                  id: `edge-${node.id}-${mId}`,
                  source: node.id,
                  target: mId,
                  type: "smoothstep",
                  isMeta: true,
                  hidden: true
                });
              });
              return { ...node, data: { ...node.data, templateApplied: true } };
            }
            return node;
          });

          if (extraNodes.length > 0) {
            setEdges(eds => [...eds, ...extraEdges]);
            return [...updatedNodes, ...extraNodes];
          }
          return updatedNodes;
        });
      }

      // -------------------- 7) CHAT SUCCESS MSG --------------------
      const aiMessage = epcJson.message || t('epcUpdated');
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiMessage },
      ]);

    } catch (err) {
      console.error(err);
      setIsAIGenerating(false);
      setPreviewMode(false);
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || t('epcGenerationError') || "Error generating diagram.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMsg },
      ]);
    } finally {
      setLoading(false);
    }
  }, [nodes, edges, layoutDirection, reactFlowInstance, expansionRules, t, handleUploadFile]);



  /* ---------- Connect Interaction ---------- */


  const onEdgeUpdate = useCallback(
    (oldEdge, newConnection) => setEdges((els) => updateEdge(oldEdge, newConnection, els)),
    []
  );

  /* ---------- Node Click Expansion ---------- */
  /* ---------- Node Click Expansion / Eraser ---------- */
  const onNodeClick = useCallback((event, node) => {
    if (isEraserActive) {
      // Emit socket event for node deletion
      onNodesChangeSocket([{ id: node.id, type: 'remove' }]);

      // Handle connected edges explicitly
      const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
      if (connectedEdges.length > 0) {
        const edgeChanges = connectedEdges.map(e => ({ id: e.id, type: 'remove' }));
        onEdgesChangeSocket(edgeChanges);
      }
      return;
    }

    if (selectedNodeForPanel && selectedNodeForPanel.id !== node.id) {
      setSelectedNodeForPanel({ ...node, __defaultTab: selectedNodeForPanel.__defaultTab });
    }

    // Show Quick Context Pad ONLY if not Approved and not in View Mode
    const isApproved = processStatus === 'Approved';
    if (!isApproved && !isViewMode) {
      const nodeElement = document.querySelector(`.react-flow__node[data-id="${node.id}"]`);
      if (nodeElement) {
        const rect = nodeElement.getBoundingClientRect();
        setContextPad({
          show: true,
          node: node,
          x: rect.right + 10,
          y: rect.top - 180,   // Positioned strictly ABOVE the node top edge
          showColors: false
        });
      }
    }

    // Debounce to prevent rapid-click races
    if (clickLockRef.current) return;
    // clickLockRef.current = true; // Disabled strictly locking, replaced with timer based lock handling

    // Clear any existing timer content
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
  }, [isEraserActive, onNodesChangeSocket, edges, onEdgesChangeSocket, selectedNodeForPanel, processStatus, isViewMode]);

  /* ---------- Meta Expansion Helper ---------- */
  const handleMetaExpansion = useCallback((node) => {
    // Disable expansion for metadata nodes
    if (node.data?.isMeta || node.id.includes('-meta-')) return;

    // Disable expansion for VACD nodes (they don't need meta nodes)
    const vacdNodeTypes = ['management_process', 'support_process', 'vacd', 'chevron_left', 'chevron_right', 'vacd_lane', 'vacd_sub_lane'];
    if (vacdNodeTypes.includes(node.type)) return;

    // Disable expansion for BPMN nodes
    if (node.type && node.type.startsWith('bpmn_')) return;

    const rules = expansionRules[node.type];

    // Robust Child Detection:
    // 1. ID pattern (legacy/standard expansion)
    // 2. Explicit Parent Link (standard)
    // 3. Heuristic: Connected nodes with matching labels (Fix for Chatbot duplicates)

    const prefix = `${node.id}-meta-`;

    // Find all nodes connected to this node (Both Directions) to catch Inputs (Left) and Outputs (Right/Bottom)
    const connectedNeighborIds = edges
      .filter(e => e.source === node.id || e.target === node.id)
      .map(e => e.source === node.id ? e.target : e.source);

    // Heuristic: If a connected node has a label that matches one of our rules, treat it as a child
    const isRuleMatch = (n) => {
      if (!rules) return false;
      // Check if the node's label starts with or equals any of the rule labels
      // We use 'startsWith' because chatbot labels might be "Category:..." vs rule "Category"
      return rules.some(r => n.data?.label && (n.data.label === r.label || n.data.label.startsWith(r.label)));
    };

    const isChild = (n) => {
      // Standard checks
      if (n.id.startsWith(prefix)) return true;
      if (n.data?.parentId === node.id) return true;

      // Robust Heuristic: Any metadata-like node connected to this node
      // Catches AI nodes (Inputs/Outputs) and manually created ones
      // We exclude core flow types (event/function/xor/or/and) to avoid collapsing the main process
      const isMetaType = ['info', 'role', 'system', 'document', 'risk', 'control'].includes(n.type);
      if (connectedNeighborIds.includes(n.id) && (isMetaType || n.data?.isMeta)) return true;

      return false;
    };

    const metaChildren = nodes.filter(isChild);
    const metaChildrenIds = new Set(metaChildren.map(n => n.id));

    // Any visible child means we are expanded
    const isExpanded = metaChildren.some(n => !n.hidden);

    if (!isExpanded) {
      // --- ACTION: EXPAND ---
      if (metaChildren.length > 0) {
        // Show existing children
        setNodes(nds => nds.map(n => {
          if (isChild(n)) return { ...n, hidden: false };
          if (n.id === node.id) return { ...n, data: { ...n.data, isCollapsed: false } };
          return n;
        }));

        // Show edges connected to these children
        setEdges(eds => eds.map(e => {
          // If edge connects to one of the children getting shown, show it!
          if (metaChildrenIds.has(e.source) || metaChildrenIds.has(e.target)) {
            return { ...e, hidden: false };
          }
          if (e.source === node.id && e.isMeta) return { ...e, hidden: false };
          return e;
        }));
      } else {
        // Create new children
        if (node.data?.templateApplied) return;
        if (!rules) return;

        const newNodes = rules.map((rule, i) => ({
          id: `${prefix}${i}`, // Deterministic ID
          type: rule.type,
          // Position BELOW the node (Vertical Stack) to avoid horizontal collision
          position: { x: node.position.x, y: node.position.y + 150 + (i * 100) },
          data: {
            label: rule.label,
            onEdit: node.data.onEdit,
            onUpload: node.data.onUpload,
            isMeta: true,
            parentId: node.id // Explicit Link
          }
        }));

        const newEdges = newNodes.map(n => ({
          id: `edge-${node.id}-${n.id}`,
          source: node.id,
          target: n.id,
          type: "smoothstep",
          markerStart: undefined, // No arrow at source
          isMeta: true
        }));

        setNodes(nds => {
          const existingIds = new Set(nds.map(n => n.id));
          const toAdd = newNodes.filter(n => !existingIds.has(n.id));

          if (toAdd.length === 0) {
            // Force show existing if logic failed to detect them in 'metaChildren' above (e.g. stale closure)
            return nds.map(n => {
              if (isChild(n)) return { ...n, hidden: false };
              if (n.id === node.id) return { ...n, data: { ...n.data, isCollapsed: false } };
              return n;
            });
          }

          const combined = [...nds, ...toAdd];
          // Update parent state in the new list
          return combined.map(n => n.id === node.id ? { ...n, data: { ...n.data, isCollapsed: false } } : n);
        });

        setEdges(eds => {
          const existingIds = new Set(eds.map(e => e.id));
          const toAdd = newEdges.filter(e => !existingIds.has(e.id));
          return toAdd.length > 0 ? [...eds, ...toAdd] : eds;
        });
      }
    } else {
      // --- ACTION: COLLAPSE ---
      // Force hide ALL children (Prefix or ParentID match)
      setNodes(nds => nds.map(n => {
        if (isChild(n)) return { ...n, hidden: true };
        if (n.id === node.id) return { ...n, data: { ...n.data, isCollapsed: true } };
        return n;
      }));

      // Hide edges connected to the children we are hiding
      setEdges(eds => eds.map(e => {
        // If edge connects to a child we are hiding, hide the edge too!
        // This covers both Source->Child and Child->Target
        if (metaChildrenIds.has(e.source) || metaChildrenIds.has(e.target)) {
          return { ...e, hidden: true };
        }
        if (e.source === node.id && e.isMeta) return { ...e, hidden: true };
        return e;
      }));
    }
  }, [nodes, edges, expansionRules, setNodes, setEdges]);


  const onEdgeClick = useCallback((event, edge) => {
    if (isEraserActive) {
      onEdgesChangeSocket([{ id: edge.id, type: 'remove' }]);
    }
  }, [isEraserActive, onEdgesChangeSocket]);

  /* ---------- Drag & Drop ---------- */
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');
      const shapeType = event.dataTransfer.getData('application/reactflow-shape');
      const iconName = event.dataTransfer.getData('application/reactflow-icon');
      const symbolSet = event.dataTransfer.getData('application/reactflow-set');
      const symbolName = event.dataTransfer.getData('application/reactflow-name');
      const nodeSymbol = event.dataTransfer.getData('application/reactflow-symbol');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const onEdit = handleNodeEdit;
      const onUpload = (nodeId, file) => handleNodeFileUpload(nodeId, file);

      let newNodeType = type;
      let extraData = {};
      let defaultStyle = undefined;

      // Define specialized types that should NOT be converted to generic 'shape' nodes
      const specializedTypes = [
        'event', 'function', 'rule', 'role', 'info',
        'management_process', 'support_process', 'vacd', 'valueaddedchain',
        'processgroup', 'chevron_left', 'chevron_right', 'vacd_lane', 'vacd_sub_lane',
        'process', 'core_process'
      ];

      if (shapeType && !specializedTypes.includes(type)) {
        newNodeType = 'shape';
        extraData = { shapeType: shapeType };
        defaultStyle = { width: 100, height: 100 };
      } else {
        const legacyShapeTypes = ['rectangle', 'circle', 'triangle', 'rounded'];
        if (legacyShapeTypes.includes(type)) {
          newNodeType = 'shape';
          extraData = { shapeType: type };
          defaultStyle = { width: 100, height: 100 };
        } else if (['pool', 'lane', 'bpmn_pool', 'bpmn_lane', 'bpmn_empty_lane', 'connector', 'group'].includes(type)) {
          // Maintain original type for specialized rendering in ShapeNode
          newNodeType = type;
          extraData = { shapeType: 'rectangle' };

          // Specialized dimensioning
          if (type === 'pool' || type === 'bpmn_pool') defaultStyle = { width: 1000, height: 500 };
          else if (type === 'lane' || type === 'bpmn_lane') defaultStyle = { width: 600, height: 150 };
          else if (type === 'bpmn_empty_lane') defaultStyle = { width: 1000, height: 120 };
          else if (type === 'group') defaultStyle = { width: 300, height: 300 };
          else if (type === 'connector') defaultStyle = { width: 100, height: 40 };
        } else if (['management_process', 'support_process', 'vacd', 'valueaddedchain', 'processgroup'].includes(type)) {
          // VACD Process Nodes
          defaultStyle = { width: 220, height: 60 };
        } else if (['chevron_left', 'chevron_right'].includes(type)) {
          // VACD Boundary Nodes
          defaultStyle = { width: 60, height: 400 };
        } else if (type === 'vacd_lane') {
          // VACD Main Lane
          defaultStyle = { width: 800, height: 300 };
        } else if (type === 'vacd_sub_lane') {
          // VACD Sub-Lane
          defaultStyle = { width: 400, height: 200 };
        }
      }
      const newNode = {
        id: `dnd_${Date.now()}`,
        type: newNodeType,
        position,
        draggable: ['bpmn_lane', 'bpmn_empty_lane', 'lane'].includes(newNodeType) ? false : true,
        data: {
          label: label,
          icon: iconName,
          symbolSet: symbolSet || null,
          symbolName: symbolName || null,
          symbol: nodeSymbol || null,
          onEdit,
          onUpload,
          template: orgTemplate,
          ...extraData
        },
        // Set dimensions for structural elements and shapes
        style: defaultStyle,
        // Ensure structural elements and shapes are behind interactive nodes (Functions, Events) and edges
        zIndex: ['pool', 'lane', 'bpmn_pool', 'bpmn_lane', 'bpmn_empty_lane', 'group', 'shape', 'connector'].includes(newNodeType) ? -1 : 10
      };

      // Determine Parenting Logic for Pools and Lanes
      const containerTypes = ['bpmn_pool', 'bpmn_lane', 'bpmn_empty_lane', 'pool', 'lane', 'group'];
      const currentNodes = reactFlowInstance.getNodes();

      const containsPoint = (n, p) => {
        if (!n.position || (!n.style && !n.width)) return false;
        // Find width/height either from node.width/height (if rendered) or defaultStyle
        const w = n.width || n.style?.width || 0;
        const h = n.height || n.style?.height || 0;
        // Consider absolute position if parentNode exists
        const getAbsolutePosition = (nodeId) => {
          const node = currentNodes.find(nd => nd.id === nodeId);
          if (!node || !node.parentNode) return node.position;
          const parentPos = getAbsolutePosition(node.parentNode);
          return { x: node.position.x + parentPos.x, y: node.position.y + parentPos.y };
        };
        const absPos = n.parentNode ? getAbsolutePosition(n.id) : n.position;

        return p.x >= absPos.x && p.x <= absPos.x + w &&
          p.y >= absPos.y && p.y <= absPos.y + h;
      };

      // Reverse to check front-most nodes (z-index wise or array-order wise) first
      const parentCandidate = [...currentNodes]
        .reverse()
        .find(n => containerTypes.includes(n.type) && containsPoint(n, position));

      if (parentCandidate) {
        // If dropping a Lane inside a Pool
        if (['bpmn_lane', 'bpmn_empty_lane', 'lane'].includes(newNodeType) && ['bpmn_pool', 'pool'].includes(parentCandidate.type)) {
          newNode.parentNode = parentCandidate.id;
          newNode.extent = 'parent';
          const parentWidth = parentCandidate.width || parentCandidate.style?.width || 1000;
          const parentAbsoluteX = parentCandidate.parentNode
            ? currentNodes.find(nd => nd.id === parentCandidate.parentNode)?.position.x + parentCandidate.position.x
            : parentCandidate.position.x;
          const parentAbsoluteY = parentCandidate.parentNode
            ? currentNodes.find(nd => nd.id === parentCandidate.parentNode)?.position.y + parentCandidate.position.y
            : parentCandidate.position.y;

          if (newNodeType === 'bpmn_empty_lane' || newNodeType === 'bpmn_lane') {
            newNode.position = {
              x: SWIMLANE_INNER_OFFSET_X,
              y: Math.max(0, position.y - parentAbsoluteY)
            };
            newNode.style = {
              ...(newNode.style || {}),
              width: Math.max(220, parentWidth - SWIMLANE_INNER_OFFSET_X)
            };
            newNode.width = newNode.style.width;
          } else {
            newNode.position = {
              x: position.x - parentAbsoluteX,
              y: position.y - parentAbsoluteY
            };
          }
        }
        // If dropping a regular shape inside a Lane or Pool or Group
        else if (!containerTypes.includes(newNodeType)) {
          newNode.parentNode = parentCandidate.id;
          newNode.extent = 'parent';
          // Ensure we calculate against absolute position of the parent candidate
          const parentAbsPos = parentCandidate.parentNode
            ? {
              x: currentNodes.find(nd => nd.id === parentCandidate.parentNode)?.position.x + parentCandidate.position.x,
              y: currentNodes.find(nd => nd.id === parentCandidate.parentNode)?.position.y + parentCandidate.position.y
            }
            : parentCandidate.position;

          newNode.position = {
            x: position.x - parentAbsPos.x,
            y: position.y - parentAbsPos.y
          };
        }
      }

      setNodes((nds) => nds.concat(newNode));
      if (id && id !== 'new') {
        socketService.emitNewNode(id, newNode);
      }

      // Auto-inject global templates if label matches
      const template = orgTemplates.find(t => normalizeString(label).includes(normalizeString(t.nodeLabel)));
      if (template) {
        const extraNodes = template.metaNodes.map((mNode, idx) => ({
          id: `${newNode.id}-meta-global-${idx}`,
          type: mNode.type || 'info',
          hidden: true,
          position: { x: position.x, y: position.y + 150 + (idx * 100) },
          data: {
            label: mNode.label,
            parentId: newNode.id,
            isMeta: true,
            onEdit,
            onUpload
          }
        }));

        const extraEdges = extraNodes.map(mNode => ({
          id: `edge-${newNode.id}-${mNode.id}`,
          source: newNode.id,
          target: mNode.id,
          type: "smoothstep",
          isMeta: true,
          hidden: true
        }));

        setNodes(nds => [...nds, ...extraNodes]);
        setEdges(eds => [...eds, ...extraEdges]);
        setToast({ show: true, message: `Applied global template for "${label}"`, type: 'success' });
      }
    },
    [reactFlowInstance, setNodes, setEdges, orgTemplate, orgTemplates]
  );



  /* ---------- Delete Node/Edge ---------- */
  const handleDelete = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    const selectedEdges = edges.filter((edge) => edge.selected);

    if (selectedNodes.length > 0) {
      setNodes((nds) => nds.filter((node) => !node.selected));
      // Also remove edges connected to deleted nodes
      const selectedNodeIds = selectedNodes.map(n => n.id);
      setEdges((eds) => eds.filter((edge) =>
        !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
      ));

      // Emit Node Deletion
      const nodeChanges = selectedNodes.map(n => ({ id: n.id, type: 'remove' }));
      onNodesChangeSocket(nodeChanges);
    }
    if (selectedEdges.length > 0) {
      setEdges((eds) => eds.filter((edge) => !edge.selected));

      // Emit Edge Deletion
      const edgeChanges = selectedEdges.map(e => ({ id: e.id, type: 'remove' }));
      onEdgesChangeSocket(edgeChanges);
    }
  }, [nodes, edges, setNodes, setEdges, onNodesChangeSocket, onEdgesChangeSocket]);

  /* ---------- Save/Load Handlers ---------- */
  const handleConfirmSave = useCallback(async (isAutoSave = false) => {
    if (!processName.trim()) return;

    try {
      const api = (await import('../../services/api_service')).default;

      // Update current version state before saving
      const currentAsIsNodes = diagramVersion === 'as-is' ? nodes : asIsNodes;
      const currentAsIsEdges = diagramVersion === 'as-is' ? edges : asIsEdges;
      const currentToBeNodes = diagramVersion === 'to-be' ? nodes : toBeNodes;
      const currentToBeEdges = diagramVersion === 'to-be' ? edges : toBeEdges;

      const payload = {
        name: processName,
        parent: processParent || null,
        // Legacy fields for backward compatibility
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          zIndex: n.zIndex,
          style: n.style,
          width: n.width,   // Persist measured width for pool/lane children
          height: n.height, // Persist measured height for pool/lane children
          parentNode: n.parentNode, // Persist pool/lane hierarchy
          extent: n.extent,         // Persist containment extent
          label: n.data.label,
          icon: n.data.icon,
          position: n.position,
          hidden: n.hidden,
          data: {
            ...n.data,
            isMeta: n.data.isMeta
          }
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle, // Persist source handle
          targetHandle: e.targetHandle, // Persist target handle
          isManualEdge: e.isManualEdge, // Persist manual edge flag
          type: e.type,
          animated: e.animated,
          markerEnd: e.markerEnd,
          style: e.style,
          isMeta: e.isMeta,
          data: e.data
        })),
        // As-Is diagram version
        as_is_nodes: currentAsIsNodes.map(n => ({
          id: n.id,
          type: n.type,
          zIndex: n.zIndex,
          style: n.style,
          width: n.width,   // Persist measured width for pool/lane children
          height: n.height, // Persist measured height for pool/lane children
          parentNode: n.parentNode, // Persist pool/lane hierarchy
          extent: n.extent,         // Persist containment extent
          label: n.data.label,
          icon: n.data.icon,
          position: n.position,
          hidden: n.hidden,
          data: {
            ...n.data,
            isMeta: n.data.isMeta
          }
        })),
        as_is_edges: currentAsIsEdges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle, // Persist source handle
          targetHandle: e.targetHandle, // Persist target handle
          isManualEdge: e.isManualEdge, // Persist manual edge flag
          type: e.type,
          animated: e.animated,
          markerEnd: e.markerEnd,
          style: e.style,
          isMeta: e.isMeta,
          data: e.data
        })),
        // To-Be diagram version
        to_be_nodes: currentToBeNodes.map(n => ({
          id: n.id,
          type: n.type,
          zIndex: n.zIndex,
          style: n.style,
          width: n.width,   // Persist measured width for pool/lane children
          height: n.height, // Persist measured height for pool/lane children
          parentNode: n.parentNode, // Persist pool/lane hierarchy
          extent: n.extent,         // Persist containment extent
          label: n.data.label,
          icon: n.data.icon,
          position: n.position,
          hidden: n.hidden,
          data: {
            ...n.data,
            isMeta: n.data.isMeta
          }
        })),
        to_be_edges: currentToBeEdges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle, // Persist source handle
          targetHandle: e.targetHandle, // Persist target handle
          isManualEdge: e.isManualEdge, // Persist manual edge flag
          type: e.type,
          animated: e.animated,
          markerEnd: e.markerEnd,
          style: e.style,
          isMeta: e.isMeta,
          data: e.data
        })),
        current_version: diagramVersion,
        diagram_type: diagramType, // 'process' or 'organization'
        expansionRules: expansionRules || {},
        fad_nodes: fadNodes,
        fad_edges: fadEdges,
        template: orgTemplate,
        layout_direction: layoutDirection // Persist Layout Direction
      };

      // Debug logging for save operation
      console.log('💾 Saving process with FAD data:', {
        fadNodes: fadNodes.length,
        fadEdges: fadEdges.length,
        hasFadData: fadNodes.length > 0 || fadEdges.length > 0,
        layoutDirection
      });

      let savedId = id;

      if (id && id !== "new") {
        await api.put(`${NETWORK_URLS.GetProcesses}${id}`, payload);
      } else {
        const res = await api.post(NETWORK_URLS.GetProcesses, payload);
        savedId = res.data._id;
      }

      // 🔥 FIX: Update URL and keep folder context after save
      window.history.replaceState(
        null,
        "",
        `/editor/${savedId}?parent=${processParent || ""}`
      );

      setSaveStatus('saved');
      if (!isAutoSave) {
        setToast({ show: true, message: t('modelSaved'), type: 'success' });
      }
      setShowSaveModal(false);

    } catch (err) {
      setSaveStatus('error');
      if (!isAutoSave) {
        setToast({ show: true, message: t('saveFailed') + (err.response?.data?.error || err.message), type: 'error' });
      }
    }
  }, [processName, processParent, id, nodes, edges, expansionRules, fadNodes, fadEdges, t, diagramVersion, asIsNodes, asIsEdges, toBeNodes, toBeEdges, diagramType]);


  const handleSaveClick = useCallback(() => {
    if (isPreviewMode) return;
    if (userRole !== "admin" && userRole !== "manager" && userRole !== "designer" && userRole !== "system_admin" && currentUser?.access_level !== 'editor') {
      setToast({ show: true, message: t('permissionDeniedSave'), type: 'error' });
      return;
    }

    // If editing an existing model → save directly
    if (id && id !== "new") {
      handleConfirmSave();
      return;
    }

    // If new model → ask for name only ONE time
    if (!processName.trim()) {
      setShowSaveModal(true);
      return;
    }

    // If name already exists, just save
    handleConfirmSave();
  }, [id, processName, userRole, handleConfirmSave, t]);

  const handleDeleteProcess = useCallback((e, processId) => {
    e.stopPropagation();
    setDeleteConfirmation({ show: true, processId });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (isPreviewMode) return;
    if (!deleteConfirmation.processId) return;

    try {
      const api = (await import('../../services/api_service')).default;
      await api.delete(`${NETWORK_URLS.GetProcesses}${deleteConfirmation.processId}`);

      // This part seems to be for a list of processes, not directly relevant here
      // setSavedProcesses(prev => prev.filter(p => p._id !== deleteConfirmation.processId));
      setDeleteConfirmation({ show: false, processId: null });
      setToast({ show: true, message: t('processDeleted'), type: 'success' });
    } catch (err) {
      alert(t('deleteFailed') + (err.response?.data?.error || err.message));
    }
  }, [deleteConfirmation.processId, t]);

  /* ---------- Clear Board Handler ---------- */
  const handleClearClick = useCallback(() => {
    setClearConfirmation({ show: true });
  }, []);

  const handleConfirmClear = useCallback(() => {
    if (isPreviewMode) return;
    setNodes([]);
    setEdges([]);
    setMessages([]);
    setClearConfirmation({ show: false });
    setToast({ show: true, message: t('boardCleared'), type: 'delete' });
    console.log("Board cleared");
  }, [setNodes, setEdges, setMessages, t]);

  /* ---------- Version History Handlers ---------- */
  const handlePreviewVersion = useCallback((snapshot) => {
    // Save current state as original if not already in preview mode
    if (!isPreviewMode) {
      setOriginalModelData({
        nodes: [...nodes],
        edges: [...edges],
        diagramType: diagramType,
        processName: processName
      });
    }

    setCurrentPreviewSnapshot(snapshot);

    // Load snapshot data
    const snapshotNodes = (snapshot.as_is_nodes || snapshot.nodes || []).map(n => ({
      ...n,
      data: {
        ...n.data,
        readOnly: true // Force read-only in preview
      }
    }));
    const snapshotEdges = snapshot.as_is_edges || snapshot.edges || [];

    setNodes(snapshotNodes);
    setEdges(snapshotEdges);
    setIsPreviewMode(true);

    if (snapshot.diagram_type) setDiagramType(snapshot.diagram_type);

    setToast({ show: true, message: `Previewing Version ${snapshot.version || 'snapshot'}`, type: 'timeline' });

    // Fit view
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.2 });
    }, 100);
  }, [nodes, edges, isPreviewMode, diagramType, processName, reactFlowInstance]);

  const handleExitPreview = useCallback(() => {
    if (originalModelData) {
      setNodes(originalModelData.nodes);
      setEdges(originalModelData.edges);
      setDiagramType(originalModelData.diagramType);
      setProcessName(originalModelData.processName);
    }
    setIsPreviewMode(false);
    setOriginalModelData(null);
    setCurrentPreviewSnapshot(null);
    setToast({ show: true, message: "Returned to latest version", type: 'timeline' });

    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.2 });
    }, 100);
  }, [originalModelData, reactFlowInstance]);

  const handleRestoreFinished = useCallback((newProcessId) => {
    setToast({ show: true, message: "Version restored as new draft", type: 'timeline' });
    // Navigate to the new draft
    window.location.href = `/editor/${newProcessId}`;
  }, []);

  /* ---------- Download PDF ---------- */
  const downloadPdf = useCallback((format = 'auto', isShare = false) => {
    return new Promise((resolve, reject) => {

      if (format === 'gif') {
        const processNameSafe = (processName || 'process').replace(/[^a-z0-9\u0600-\u06FF]/gi, '_').toLowerCase(); // Support Arabic chars if needed or just replace unsafe
        recordGif({
          nodes: getNodes(), // ReactFlow instance method to get current nodes
          duration: 4000,
          fps: 5,
          fileName: `${processNameSafe || 'process'}.gif`
        });
        return;
      }

      if (format === 'html') {
        downloadHtml({
          nodes: getNodes(),
          fileName: `${processName || 'process'}.html`,
          logoUrl: logoUrl,
          orgName: orgName,
          processName: processName || 'EPC Diagram',
          watermarkEnabled: pdfConfig?.watermark_enabled !== false // Default to true if undefined
        });
        return;
      }


      const nodes = getNodes();
      // Use getNodesBounds instead of getRectOfNodes (deprecated)
      const nodesBounds = getNodesBounds(nodes);

      // Add padding to the capture area
      const padding = 100;
      const captureWidth = nodesBounds.width + padding * 2;
      const captureHeight = nodesBounds.height + padding * 2;

      // Reduced pixel ratio from 4 to 2 to prevent main thread blockage/OOM
      const pixelRatio = 2;

      // Use getViewportForBounds instead of getTransformForBounds (deprecated)
      const viewportTransform = getViewportForBounds(
        nodesBounds,
        captureWidth,
        captureHeight,
        0.5,
        2
      );

      const viewport = document.querySelector(".react-flow__viewport");
      if (!viewport) {
        console.error("React Flow viewport not found");
        return;
      }

      setIsPdfDownloading(true);
      setPdfProgress(5); // Start visible

      // Simulation Interval for PDF
      const progressInterval = setInterval(() => {
        setPdfProgress(prev => {
          const next = prev + 5;
          // Cap at 95 until render is done
          return next > 95 ? 95 : next;
        });
      }, 100); // Slower updates (100ms) to reduce React render pressure

      try {
        viewport.classList.add("printing");

        // Wait 2 seconds to let the progress bar slide to ~95% before blocking the thread
        setTimeout(() => {
          toPng(viewport, {
            backgroundColor: "#ffffff",
            width: captureWidth,
            height: captureHeight,
            style: {
              width: captureWidth.toString(),
              height: captureHeight.toString(),
              transform: `translate(${viewportTransform.x}px, ${viewportTransform.y}px) scale(${viewportTransform.zoom})`,
            },
            pixelRatio: pixelRatio,
          })
            .then((dataUrl) => {
              setPdfProgress(prev => Math.max(prev, 95)); // Jump to 95% after image capture (major heavy lifting done)
              // Convert pixels to mm (1px = 0.264583mm)
              const pxToMm = 0.264583;

              let pdfWidth, pdfHeight;

              if (format === 'a4') {
                pdfWidth = 297; // Landscape A4 by default
                pdfHeight = 210;
              } else if (format === 'a3') {
                pdfWidth = 420; // Landscape A3 by default
                pdfHeight = 297;
              } else {
                // Auto/Original
                const scaleFactor = 1.5;
                pdfWidth = captureWidth * pxToMm * scaleFactor;
                pdfHeight = captureHeight * pxToMm * scaleFactor;
              }

              // Determine orientation for A4/A3 based on image aspect ratio?
              // For now, let's stick to Landscape as diagrams are usually horizontal. 
              // However, if the user requested A4/A3, we should probably check if it fits better in Portrait.

              let orientation = "l";
              if (format === 'a4' || format === 'a3') {
                // If drawing is taller than wide, maybe switch to portrait?
                if (captureHeight > captureWidth) {
                  orientation = "p";
                  // Swap dimensions for portrait
                  [pdfWidth, pdfHeight] = [pdfHeight, pdfWidth];
                }
              } else {
                orientation = pdfWidth > pdfHeight ? "l" : "p";
              }

              const pdf = new jsPDF({
                orientation: orientation,
                unit: "mm",
                format: format === 'auto' ? [pdfWidth, pdfHeight] : format, // jsPDF understands 'a4', 'a3' strings too if passed directly, but we calculated dims.
                compress: true,
              });

              // Re-affirm dimensions in case jsPDF 'format' string details differ slightly or just set manually
              const pdfPageWidth = pdf.internal.pageSize.getWidth();
              const pdfPageHeight = pdf.internal.pageSize.getHeight();

              const replacePlaceholders = (template, data) => {
                if (!template) return "";
                return template.replace(/{{(.*?)}}/g, (match, p1) => {
                  const key = p1.trim();
                  if (key === 'org_name') return data.orgName || "";
                  if (key === 'process_name') return data.processName || "";
                  if (key === 'date') return data.date || "";
                  if (key === 'page_number') return data.pageNumber || "1";
                  return match;
                });
              };

              const config = pdfConfig || {
                header: { left: "{{org_name}}", center: "{{process_name}}", right: "{{date}}" },
                footer: { left: "", center: "Page {{page_number}}", right: "" },
                show_logo: true,
                header_height: 30,
                footer_height: 20
              };

              const headerHeight = config.header_height || 30;
              const footerHeight = config.footer_height || 20;

              const drawHeader = (imgData = null, logoW = 25, logoH = 15) => {
                try {
                  pdf.setFont("helvetica", "bold");
                  const placeholderData = {
                    orgName: orgName || "Meerana",
                    processName: processName || "EPC Diagram",
                    date: new Date().toLocaleDateString()
                  };

                  // Left Section
                  if (config.show_logo && imgData) {
                    // Draw at original x=10, y=5 but with corrected aspect ratio dimensions
                    pdf.addImage(imgData, "PNG", 10, 5, logoW, logoH);
                  } else {
                    pdf.setFontSize(12);
                    pdf.text(replacePlaceholders(config.header.left, placeholderData), 10, 12);
                  }

                  // Center Section
                  pdf.setFontSize(14);
                  const centerText = replacePlaceholders(config.header.center, placeholderData);
                  const centerWidth = pdf.getTextWidth(centerText);
                  pdf.text(centerText, (pdfPageWidth - centerWidth) / 2, 12);

                  // Right Section
                  pdf.setFontSize(9);
                  const rightText = replacePlaceholders(config.header.right, placeholderData);
                  const rightWidth = pdf.getTextWidth(rightText);
                  pdf.text(rightText, pdfPageWidth - rightWidth - 10, 12);

                  // Horizontal line under header
                  pdf.setLineWidth(0.3);
                  pdf.line(10, headerHeight - 2, pdfPageWidth - 10, headerHeight - 2);
                } catch (e) {
                  console.warn("Header drawing failed:", e);
                }
              };

              const drawFooter = () => {
                try {
                  pdf.setFont("helvetica", "normal");
                  pdf.setFontSize(9);
                  const placeholderData = {
                    orgName: orgName || "Meerana",
                    processName: processName || "EPC Diagram",
                    date: new Date().toLocaleDateString(),
                    pageNumber: "1"
                  };

                  // Left Section
                  pdf.text(replacePlaceholders(config.footer.left, placeholderData), 10, pdfPageHeight - 10);

                  // Center Section
                  const centerText = replacePlaceholders(config.footer.center, placeholderData);
                  const centerWidth = pdf.getTextWidth(centerText);
                  pdf.text(centerText, (pdfPageWidth - centerWidth) / 2, pdfPageHeight - 10);

                  // Right Section
                  const rightText = replacePlaceholders(config.footer.right, placeholderData);
                  const rightWidth = pdf.getTextWidth(rightText);
                  pdf.text(rightText, pdfPageWidth - rightWidth - 10, pdfPageHeight - 10);

                  // Horizontal line above footer
                  pdf.setLineWidth(0.2);
                  pdf.line(10, pdfPageHeight - footerHeight + 2, pdfPageWidth - 10, pdfPageHeight - footerHeight + 2);
                } catch (e) {
                  console.warn("Footer drawing failed:", e);
                }
              };

              const drawDiagramAndSave = () => {
                // Calculate fit
                const availableWidth = pdfPageWidth - 20; // 10mm margin each side
                const availableHeight = pdfPageHeight - headerHeight - footerHeight - 10; // Margin top/bottom

                const imgOriginalWidthMm = captureWidth * pxToMm;
                const imgOriginalHeightMm = captureHeight * pxToMm;

                let imgWidthMm = imgOriginalWidthMm;
                let imgHeightMm = imgOriginalHeightMm;

                if (format !== 'auto') {
                  const widthRatio = availableWidth / imgOriginalWidthMm;
                  const heightRatio = availableHeight / imgOriginalHeightMm;
                  const fitScale = Math.min(widthRatio, heightRatio);

                  imgWidthMm = imgOriginalWidthMm * fitScale;
                  imgHeightMm = imgOriginalHeightMm * fitScale;
                } else {
                  const scaleFactor = 1.5;
                  imgWidthMm = imgOriginalWidthMm * scaleFactor;
                  imgHeightMm = imgOriginalHeightMm * scaleFactor;
                }

                const imgX = (pdfPageWidth - imgWidthMm) / 2;
                const imgY = headerHeight + (availableHeight - imgHeightMm) / 2;

                pdf.addImage(
                  dataUrl,
                  "PNG",
                  imgX,
                  Math.max(headerHeight, imgY),
                  imgWidthMm,
                  imgHeightMm,
                  undefined,
                  "FAST"
                );

                drawFooter();

                // Watermark Logic
                if (config.watermark_enabled !== false) {
                  try {
                    // Watermark: Transparency with Blend Mode
                    // Using "Multiply" blend mode guarantees the background lines show through the text

                    // 1. Calculate Coordinates & Angle FIRST (Fix ReferenceError)
                    const availableH = pdfPageHeight - config.header_height - config.footer_height;
                    const centerX = pdfPageWidth / 2;
                    // Absolute center of the page as requested
                    const centerY = pdfPageHeight / 2;
                    const angleDeg = 35;

                    // 2. Save state
                    pdf.saveGraphicsState();

                    try {
                      // 3. Set Font & Color
                      pdf.setFont("helvetica", "normal");
                      // Lighter Gray (200) for subtle appearance
                      pdf.setTextColor(200, 200, 200);

                      const fontSize = Math.max(60, Math.min(120, pdfPageWidth / 3.5));
                      pdf.setFontSize(fontSize);

                      // 4. Set Transparency & Blend Mode
                      // opacity: 0.3 (30% visible) - Lighter touch
                      // BM: "/Multiply" ensures lines show through
                      let gState;
                      if (typeof jsPDF.GState !== 'undefined') {
                        gState = new jsPDF.GState({ opacity: 0.3, "BM": "/Multiply" });
                      } else if (pdf.GState) {
                        // Sometimes it's on the instance in older versions/wrappers
                        gState = new pdf.GState({ opacity: 0.3, "BM": "/Multiply" });
                      } else {
                        // Try duck-typing: pass plain object (some jsPDF versions accept this)
                        gState = { opacity: 0.3, "BM": "/Multiply" };
                      }

                      // Apply State
                      try {
                        pdf.setGState(gState);
                      } catch (err) {
                        console.warn("setGState failed:", err);
                        // Fallback to lighter color if transparency fails
                        pdf.setTextColor(215, 215, 215);
                      }

                      // 5. Draw Text (Manual Centering)
                      const text = "TASREE3";
                      const textWidth = pdf.getTextWidth(text);
                      const angleRad = angleDeg * (Math.PI / 180);

                      const xOffset = (textWidth / 2) * Math.cos(angleRad);
                      const yOffset = (textWidth / 2) * Math.sin(angleRad);

                      // x = CenterX - xOffset
                      // y = CenterY - (-yOffset) = CenterY + yOffset

                      pdf.text(text, centerX - xOffset, centerY + yOffset, {
                        angle: angleDeg,
                        renderingMode: 'fill'
                      });

                    } catch (e) {
                      console.warn("Watermark logic error:", e);
                    } finally {
                      // 6. Restore state
                      try {
                        pdf.restoreGraphicsState();
                      } catch (e) {
                        console.warn("Restore state error", e);
                      }
                    }

                  } catch (e) {
                    console.warn("Watermark drawing failed:", e);
                  }
                }

                if (isShare) {
                  const blob = pdf.output('blob');
                  resolve(blob);
                } else {
                  pdf.save(`${processName || "epc-diagram"}.pdf`);
                  setToast({ show: true, message: "PDF Downloaded!", type: 'success' });
                }
                viewport.classList.remove("printing");

                // Finalize internal progress state
                clearInterval(progressInterval);
                setPdfProgress(100);
                setIsPdfDownloading(false);

                // Reset progress bar after a delay 
                setTimeout(() => {
                  setPdfProgress(0);
                }, 1500);
              };

              // ---- HEADER (logo + org name + diagram name) ----
              if (config.show_logo) {
                const logo = new Image();
                logo.crossOrigin = "Anonymous";
                let logoSrc = "/logo.png";

                if (logoUrl) {
                  if (logoUrl.startsWith('http')) {
                    logoSrc = logoUrl;
                  } else {
                    const baseUrl = NETWORK_URLS.BASE_URL;
                    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                    const cleanPath = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
                    logoSrc = `${cleanBase}${cleanPath}`;
                  }
                }

                // Add timestamp to foil caching
                logo.src = `${logoSrc}?t=${new Date().getTime()}`;

                logo.onload = () => {
                  try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = logo.width;
                    canvas.height = logo.height;


                    ctx.drawImage(logo, 0, 0);
                    const pngData = canvas.toDataURL('image/png');

                    // Fit within a larger box
                    const maxWidth = 45;
                    const maxHeight = 22;
                    const ratio = logo.width / logo.height;

                    let finalW = maxWidth;
                    let finalH = finalW / ratio;

                    if (finalH > maxHeight) {
                      finalH = maxHeight;
                      finalW = finalH * ratio;
                    }

                    drawHeader(pngData, finalW, finalH);
                    drawDiagramAndSave();
                  } catch (e) {
                    console.warn("Could not convert logo to PNG, falling back to text", e);
                    drawHeader(null);
                    drawDiagramAndSave();
                  }
                };

                // If logo fails to load, still draw text header & diagram
                logo.onerror = () => {
                  console.warn("Logo failed to load, falling back to text header.");
                  drawHeader(null);
                  drawDiagramAndSave();
                };
              } else {
                drawHeader(null);
                drawDiagramAndSave();
              }
            })
            .catch((err) => {
              clearInterval(progressInterval);
              setIsPdfDownloading(false);
              setPdfProgress(0);
              viewport.classList.remove("printing");
              reject(err);
            });
        }, 100); // end of initial setTimeout for styles

      } catch (error) {
        clearInterval(progressInterval);
        setIsPdfDownloading(false);
        setPdfProgress(0);
        viewport.classList.remove("printing");
        reject(error);
      }
    }); // end Promise
  }, [t, processName, logoUrl, orgName, pdfConfig, getNodes]);

  /* ---------- Share Diagram ---------- */
  const shareDiagram = useCallback(async () => {
    try {
      // Ensure we have a clean process name for branding
      let cleanName = (processName && processName.trim() !== "" && processName !== "1" && processName !== "undefined")
        ? processName.trim()
        : "Tasree3 Diagram";

      const safeFileName = cleanName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || "diagram";

      // 1. Generate PDF Blob
      const pdfBlob = await downloadPdf('auto', true);
      const pdfFile = new File([pdfBlob], `${safeFileName}.pdf`, { type: 'application/pdf' });

      // 2. Share
      await shareFile({
        file: pdfFile,
        title: cleanName,
        text: `Check out this business process diagram generated by Tasree3 Process Reengineering.\n\nNote: This link will expire in 24 hours. Please download and save the PDF for your records.`
      });
    } catch (error) {
      if (error.message === "link_ready_copied") {
        setToast({ show: true, message: "PDF Share Link ready & copied to clipboard!", type: 'success' });
      } else if (error.message === "fallback_copied") {
        setToast({ show: true, message: "Workspace link copied to clipboard!", type: 'success' });
      } else {
        console.error("Sharing failed", error);
        const errorMsg = error?.response?.data?.error || error?.message || "Sharing failed";
        setToast({ show: true, message: `${errorMsg}. Workspace link copied as fallback.`, type: 'success' });
        try { navigator.clipboard.writeText(window.location.href); } catch (e) { }
      }
    }
  }, [shareFile, downloadPdf, processName, logoUrl, orgName, setToast]);

  /* ---------- Download XML ---------- */
  const downloadXml = useCallback((format = 'native') => {
    const ext = format === 'bpmn' ? '.bpmn' : '.xml';
    const fileName = `${processName || "epc-diagram"}${ext}`;

    const escapeXml = (str) => {
      if (!str) return "";
      return str.toString().replace(/[<>&"']/g, (c) => {
        const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' };
        return map[c];
      });
    };

    const sanitizeTag = (str) => {
      if (!str) return "node";
      // XML tags must start with a letter or underscore and cannot contain spaces
      let sanitized = str.toString().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      if (/^[0-9-]/.test(sanitized)) sanitized = 'n_' + sanitized;
      return sanitized || "node";
    };

    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;

    if (format === 'bpmn') {
      xmlContent += `<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">\n`;
      xmlContent += `  <bpmn:process id="Process_1" isExecutable="false">\n`;

      let diShapes = '';
      let diEdges = '';

      nodes.forEach(node => {
        let bpmnTag = 'bpmn:task';
        let attrs = `id="${escapeXml(node.id)}" name="${escapeXml(node.data?.label || '')}"`;

        if (node.type === 'bpmn_event') {
          const eType = node.data?.eventType || 'start';
          if (eType === 'start') bpmnTag = 'bpmn:startEvent';
          else if (eType === 'end') bpmnTag = 'bpmn:endEvent';
          else bpmnTag = 'bpmn:intermediateCatchEvent';
        } else if (node.type === 'bpmn_gateway' || node.type === 'rule') {
          const gType = node.data?.gatewayType || 'exclusive';
          if (gType === 'parallel') bpmnTag = 'bpmn:parallelGateway';
          else if (gType === 'inclusive') bpmnTag = 'bpmn:inclusiveGateway';
          else if (gType === 'complex') bpmnTag = 'bpmn:complexGateway';
          else if (gType === 'event_based') bpmnTag = 'bpmn:eventBasedGateway';
          else bpmnTag = 'bpmn:exclusiveGateway';
        } else if (node.type === 'bpmn_task' || node.type === 'function') {
          const tType = node.data?.taskType || 'none';
          const aType = node.data?.activityType || 'task';
          if (aType === 'subprocess') bpmnTag = 'bpmn:subProcess';
          else if (aType === 'call_activity') bpmnTag = 'bpmn:callActivity';
          else if (aType === 'transaction') bpmnTag = 'bpmn:transaction';
          else {
            if (tType === 'user') bpmnTag = 'bpmn:userTask';
            else if (tType === 'service') bpmnTag = 'bpmn:serviceTask';
            else if (tType === 'send') bpmnTag = 'bpmn:sendTask';
            else if (tType === 'receive') bpmnTag = 'bpmn:receiveTask';
            else if (tType === 'script') bpmnTag = 'bpmn:scriptTask';
            else if (tType === 'manual') bpmnTag = 'bpmn:manualTask';
            else if (tType === 'business_rule') bpmnTag = 'bpmn:businessRuleTask';
            else bpmnTag = 'bpmn:task';
          }
        } else if (node.type === 'event') {
          bpmnTag = 'bpmn:intermediateCatchEvent';
        } else if (node.type === 'bpmn_data' || ['document', 'system', 'role', 'risk', 'control', 'info'].includes(node.type)) {
          const dType = node.data?.dataType || 'object';
          if (dType === 'store') bpmnTag = 'bpmn:dataStoreReference';
          else bpmnTag = 'bpmn:dataObjectReference';
        } else {
          bpmnTag = 'bpmn:task';
        }

        const incoming = edges.filter(e => e.target === node.id).map(e => `      <bpmn:incoming>${escapeXml(e.id)}</bpmn:incoming>\n`).join('');
        const outgoing = edges.filter(e => e.source === node.id).map(e => `      <bpmn:outgoing>${escapeXml(e.id)}</bpmn:outgoing>\n`).join('');

        xmlContent += `    <${bpmnTag} ${attrs}>\n${incoming}${outgoing}    </${bpmnTag}>\n`;

        const w = node.width || 160;
        const h = node.height || 70;
        const x = node.position?.x || 0;
        const y = node.position?.y || 0;
        diShapes += `      <bpmndi:BPMNShape id="${escapeXml(node.id)}_di" bpmnElement="${escapeXml(node.id)}">\n`;
        diShapes += `        <dc:Bounds x="${x}" y="${y}" width="${w}" height="${h}" />\n`;
        diShapes += `      </bpmndi:BPMNShape>\n`;
      });

      edges.forEach(edge => {
        const bpmnTag = edge.data?.bpmnConnectorType === 'message' ? 'bpmn:messageFlow' : 'bpmn:sequenceFlow';
        xmlContent += `    <${bpmnTag} id="${escapeXml(edge.id)}" sourceRef="${escapeXml(edge.source)}" targetRef="${escapeXml(edge.target)}" />\n`;
        
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        let sx = 0, sy = 0, tx = 0, ty = 0;
        if (sourceNode) {
          sx = (sourceNode.position?.x || 0) + (sourceNode.width || 160) / 2;
          sy = (sourceNode.position?.y || 0) + (sourceNode.height || 70) / 2;
        }
        if (targetNode) {
          tx = (targetNode.position?.x || 0) + (targetNode.width || 160) / 2;
          ty = (targetNode.position?.y || 0) + (targetNode.height || 70) / 2;
        }

        diEdges += `      <bpmndi:BPMNEdge id="${escapeXml(edge.id)}_di" bpmnElement="${escapeXml(edge.id)}">\n`;
        diEdges += `        <di:waypoint x="${sx}" y="${sy}" />\n`;
        diEdges += `        <di:waypoint x="${tx}" y="${ty}" />\n`;
        diEdges += `      </bpmndi:BPMNEdge>\n`;
      });

      xmlContent += `  </bpmn:process>\n`;
      
      xmlContent += `  <bpmndi:BPMNDiagram id="BPMNDiagram_1">\n`;
      xmlContent += `    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">\n`;
      xmlContent += diShapes;
      xmlContent += diEdges;
      xmlContent += `    </bpmndi:BPMNPlane>\n`;
      xmlContent += `  </bpmndi:BPMNDiagram>\n`;

      xmlContent += `</bpmn:definitions>`;
    } else if (diagramType === 'organization') {
      xmlContent += `<organization name="${escapeXml(processName || 'Organization Chart')}">\n`;
      nodes.forEach(node => {
        xmlContent += `  <element id="${escapeXml(node.id)}" type="${escapeXml(node.type)}" category="${escapeXml(node.data?.category || '')}" level="${escapeXml(node.data?.level || 0)}">\n`;
        xmlContent += `    <label><![CDATA[${node.data?.label || ''}]]></label>\n`;
        // Find parent via edges
        const parentEdge = edges.find(e => e.target === node.id);
        if (parentEdge) {
          xmlContent += `    <parent id="${escapeXml(parentEdge.source)}"/>\n`;
        }
        xmlContent += `  </element>\n`;
      });
      xmlContent += `</organization>`;
    } else {
      // Default to EPML-like for process/fad
      xmlContent += `<epml xmlns="http://www.epml.org">\n`;
      xmlContent += `  <directory>\n`;
      xmlContent += `    <epc epcId="${escapeXml(id || 'new')}" name="${escapeXml(processName || 'Process Diagram')}">\n`;

      nodes.forEach(node => {
        let nodeType = node.type;
        if (node.type === 'rule') {
          const label = node.data?.label?.toLowerCase() || '';
          if (label.includes('xor')) nodeType = 'xor';
          else if (label.includes('and')) nodeType = 'and';
          else if (label.includes('or')) nodeType = 'or';
          else nodeType = 'rule';
        }

        const tagName = sanitizeTag(nodeType);
        xmlContent += `      <${tagName} id="${escapeXml(node.id)}">\n`;
        xmlContent += `        <name><![CDATA[${node.data?.label || ''}]]></name>\n`;
        if (node.data?.isMeta) {
          xmlContent += `        <metadata>true</metadata>\n`;
          xmlContent += `        <parentId>${escapeXml(node.data?.parentId || '')}</parentId>\n`;
        }
        xmlContent += `      </${tagName}>\n`;
      });

      edges.forEach((edge, index) => {
        xmlContent += `      <arc id="edge_${index}">\n`;
        xmlContent += `        <flow source="${escapeXml(edge.source)}" target="${escapeXml(edge.target)}"/>\n`;
        if (edge.isMeta) {
          xmlContent += `        <isMeta>true</isMeta>\n`;
        }
        xmlContent += `      </arc>\n`;
      });

      xmlContent += `    </epc>\n`;
      xmlContent += `  </directory>\n`;
      xmlContent += `</epml>`;
    }

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({ show: true, message: t('xmlExported'), type: 'success' });
  }, [nodes, edges, processName, diagramType, id, t]);

  /* ---------- Import XML ---------- */
  const handleImportXml = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const xmlContent = e.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

        // Basic error check
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) throw new Error("Invalid XML");

        const onEdit = (id, v) => {
          setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: v } } : n)));
        };

        const orgNode = xmlDoc.getElementsByTagName("organization")[0];
        const epcNode = xmlDoc.getElementsByTagName("epc")[0];
        const bpmnDefs = xmlDoc.getElementsByTagName("bpmn:definitions")[0] || xmlDoc.getElementsByTagName("definitions")[0];

        if (!orgNode && !epcNode && !bpmnDefs) {
          // NOT OUR FORMAT -> AI logic
          setToast({ show: true, message: "Unrecognized XML format. Understanding via AI...", type: 'success' });
          setIsRightOpen(true); // Open chat to show progress
          await handleUploadFile(file, "This is an XML file from another source. Please understand its structure and extract the diagram data (nodes and edges) from it.");
          return;
        }

        let newNodes = [];
        let newEdges = [];
        let newDiagramType = 'process';

        // Check if Organizational Chart
        if (orgNode) {
          newDiagramType = 'organization';
          setProcessName(orgNode.getAttribute("name") || "");

          const elements = xmlDoc.getElementsByTagName("element");
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const nameNode = el.getElementsByTagName("label")[0];
            const label = nameNode ? nameNode.textContent : "";

            newNodes.push({
              id: el.getAttribute("id"),
              type: el.getAttribute("type") || "org_element",
              position: { x: 0, y: 0 },
              data: {
                label,
                category: el.getAttribute("category"),
                level: parseInt(el.getAttribute("level") || "0"),
                onEdit,
                template: orgTemplate
              }
            });

            const parentNode = el.getElementsByTagName("parent")[0];
            if (parentNode) {
              newEdges.push({
                id: `edge_import_org_${i}`,
                source: parentNode.getAttribute("id"),
                target: el.getAttribute("id"),
                type: "smoothstep"
              });
            }
          }

          // Apply Layout
          newNodes = organizationalLayout(newNodes, newEdges, layoutDirection);
        } else if (epcNode) {
          // Check for EPC/FAD (EPML format)
          newDiagramType = 'process'; // Default to process, can be FAD logic later
          setProcessName(epcNode.getAttribute("name") || "");

          // Nodes
          const possibleTags = ["event", "function", "xor", "or", "and", "rule", "system", "document", "risk", "control", "role", "info", "fad_process"];
          possibleTags.forEach(tag => {
            const tags = xmlDoc.getElementsByTagName(tag);
            for (let i = 0; i < tags.length; i++) {
              const el = tags[i];
              const nameNode = el.getElementsByTagName("name")[0];
              const label = nameNode ? nameNode.textContent : "";
              const isMeta = el.getElementsByTagName("metadata")[0]?.textContent === "true";
              const parentId = el.getElementsByTagName("parentId")[0]?.textContent || null;

              newNodes.push({
                id: el.getAttribute("id"),
                type: ["xor", "or", "and"].includes(tag) ? "rule" : tag,
                position: { x: 0, y: 0 },
                hidden: isMeta, // Hide metadata nodes by default
                data: {
                  label,
                  onEdit,
                  isMeta,
                  parentId,
                  template: orgTemplate,
                  isCollapsed: true // Default parents to collapsed state if they have meta
                }
              });
            }
          });

          // Edges
          const arcs = xmlDoc.getElementsByTagName("arc");
          for (let i = 0; i < arcs.length; i++) {
            const arc = arcs[i];
            let sourceId, targetId;

            // Check standard EPML <flow> tag
            const flow = arc.getElementsByTagName("flow")[0];
            if (flow) {
              sourceId = flow.getAttribute("source");
              targetId = flow.getAttribute("target");
            } else {
              // Check direct attributes (simplified format)
              sourceId = arc.getAttribute("source");
              targetId = arc.getAttribute("target");
            }

            if (sourceId && targetId) {
              newEdges.push({
                id: arc.getAttribute("id") || `edge_import_${i}`,
                source: sourceId,
                target: targetId,
                sourceHandle: layoutDirection === 'LR' ? 'r' : 'b',
                targetHandle: layoutDirection === 'LR' ? 'l' : 't',
                type: "smoothstep",
                isMeta: arc.getElementsByTagName("isMeta")[0]?.textContent === "true",
                animated: false,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 20,
                  height: 20,
                  color: "#64748b",
                },
                style: {
                  stroke: "#64748b",
                  strokeWidth: 2,
                },
              });
            }
          }

          // Apply Layout
          newNodes = layoutGraph(newNodes, newEdges, layoutDirection);
        } else if (bpmnDefs) {
          newDiagramType = 'bpmn';
          const processNodes = bpmnDefs.getElementsByTagName("bpmn:process");
          const processNode = processNodes.length > 0 ? processNodes[0] : bpmnDefs.getElementsByTagName("process")[0];
          
          if (processNode) {
            setProcessName(processNode.getAttribute("id") || processNode.getAttribute("name") || "Imported Process");
            
            // Map of element localName to our internal types
            const eventMap = {
              'startEvent': { type: 'bpmn_event', eventType: 'start' },
              'endEvent': { type: 'bpmn_event', eventType: 'end' },
              'intermediateThrowEvent': { type: 'bpmn_event', eventType: 'intermediate' },
              'intermediateCatchEvent': { type: 'bpmn_event', eventType: 'intermediate' },
            };
            const taskMap = {
              'task': { type: 'bpmn_task', activityType: 'task', taskType: 'none' },
              'userTask': { type: 'bpmn_task', activityType: 'task', taskType: 'user' },
              'serviceTask': { type: 'bpmn_task', activityType: 'task', taskType: 'service' },
              'sendTask': { type: 'bpmn_task', activityType: 'task', taskType: 'send' },
              'receiveTask': { type: 'bpmn_task', activityType: 'task', taskType: 'receive' },
              'scriptTask': { type: 'bpmn_task', activityType: 'task', taskType: 'script' },
              'manualTask': { type: 'bpmn_task', activityType: 'task', taskType: 'manual' },
              'businessRuleTask': { type: 'bpmn_task', activityType: 'task', taskType: 'business_rule' },
              'callActivity': { type: 'bpmn_task', activityType: 'call_activity' },
              'subProcess': { type: 'bpmn_task', activityType: 'subprocess' },
              'transaction': { type: 'bpmn_task', activityType: 'transaction' },
            };
            const gatewayMap = {
              'exclusiveGateway': { type: 'bpmn_gateway', gatewayType: 'exclusive' },
              'parallelGateway': { type: 'bpmn_gateway', gatewayType: 'parallel' },
              'inclusiveGateway': { type: 'bpmn_gateway', gatewayType: 'inclusive' },
              'complexGateway': { type: 'bpmn_gateway', gatewayType: 'complex' },
              'eventBasedGateway': { type: 'bpmn_gateway', gatewayType: 'event_based' },
            };
            const dataMap = {
              'dataObjectReference': { type: 'bpmn_data', dataType: 'object' },
              'dataStoreReference': { type: 'bpmn_data', dataType: 'store' },
            };
            
            const allElements = Array.from(processNode.children);
            
            allElements.forEach(el => {
              const localName = el.localName || el.tagName.split(':').pop();
              const id = el.getAttribute("id") || `bpmn_el_${Math.random().toString(36).substr(2, 9)}`;
              const name = el.getAttribute("name") || "";
              
              if (eventMap[localName]) {
                newNodes.push({
                  id, type: eventMap[localName].type, position: { x: 0, y: 0 },
                  data: { label: name, eventType: eventMap[localName].eventType, onEdit }
                });
              } else if (taskMap[localName]) {
                newNodes.push({
                  id, type: taskMap[localName].type, position: { x: 0, y: 0 },
                  data: { label: name, activityType: taskMap[localName].activityType, taskType: taskMap[localName].taskType, onEdit }
                });
              } else if (gatewayMap[localName]) {
                newNodes.push({
                  id, type: gatewayMap[localName].type, position: { x: 0, y: 0 },
                  data: { label: name, gatewayType: gatewayMap[localName].gatewayType, onEdit }
                });
              } else if (dataMap[localName]) {
                newNodes.push({
                  id, type: dataMap[localName].type, position: { x: 0, y: 0 },
                  data: { label: name, dataType: dataMap[localName].dataType, onEdit }
                });
              } else if (localName === 'sequenceFlow' || localName === 'messageFlow') {
                const sourceRef = el.getAttribute("sourceRef");
                const targetRef = el.getAttribute("targetRef");
                if (sourceRef && targetRef) {
                  newEdges.push({
                    id, source: sourceRef, target: targetRef, 
                    sourceHandle: layoutDirection === 'LR' ? 'r' : 'b',
                    targetHandle: layoutDirection === 'LR' ? 'l' : 't',
                    type: "smoothstep",
                    data: { bpmnConnectorType: localName === 'messageFlow' ? 'message' : 'sequence' },
                    animated: false,
                    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: "#64748b" },
                    style: { stroke: "#64748b", strokeWidth: 2, strokeDasharray: localName === 'messageFlow' ? '5,5' : 'none' },
                  });
                }
              }
            });
            
            // Apply Layout
            newNodes = bpmnLayout(newNodes, newEdges, layoutDirection);
          }
        }

        if (newNodes.length > 0) {
          setDiagramType(newDiagramType);
          setNodes(newNodes);
          setEdges(newEdges);
          setToast({ show: true, message: t('xmlImported'), type: 'success' });

          // Fit view after small delay
          setTimeout(() => {
            reactFlowInstance?.fitView({ padding: 0.2 });
          }, 100);
        } else {
          throw new Error("No diagram elements found");
        }
      } catch (err) {
        console.error("XML Import Error:", err);
        // Fallback to AI if parsing completely fails as well
        setToast({ show: true, message: "Parsing failed. Attempting AI extraction...", type: 'success' });
        // setIsRightOpen(true); // Disable auto-open on error
        await handleUploadFile(file, "This file failed standard XML parsing. Please extract any process diagram or organizational chart data from it.");
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = null;
  }, [layoutDirection, orgTemplate, t, reactFlowInstance, setNodes, setEdges, setProcessName, handleUploadFile, setToast]);

  // --- MANUAL DELETE HANDLER START ---
  // Force delete on keydown since ReactFlow default seems suppressed
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 1. Ignore if focus is in an input/textarea/editable
      const active = document.activeElement;
      const isInput = active && (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) ||
        active.isContentEditable
      );
      if (isInput) return;

      // 2. Check for Delete or Backspace
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // 3. Get currently selected nodes/edges
        const selectedNodes = nodes.filter(n => n.selected);
        const selectedEdges = edges.filter(e => e.selected);

        // 4. If anything selected, remove and EMIT
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          console.log('[DEBUG] Manual Delete Triggered via Keydown');
          event.preventDefault(); // Prevent browser back nav

          // Prepare changes
          const nodeChanges = selectedNodes.map(n => ({ id: n.id, type: 'remove' }));
          const edgeChanges = selectedEdges.map(e => ({ id: e.id, type: 'remove' }));

          // Batch updates
          if (nodeChanges.length > 0) {
            onNodesChangeSocket(nodeChanges);
          }
          if (edgeChanges.length > 0) {
            onEdgesChangeSocket(edgeChanges);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, onNodesChangeSocket, onEdgesChangeSocket]);
  // --- MANUAL DELETE HANDLER END ---

  /* ---------- Smart Logo Inversion Logic ---------- */
  const [shouldInvertLogo, setShouldInvertLogo] = useState(false);

  const handleLogoLoad = (e) => {
    const img = e.target;
    // Guard: Ensure image is loaded and valid
    if (!img.complete || img.naturalWidth === 0) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Analyze pixels (checking for predominantly white/light content)
      // We'll sample the image to avoid performance hit on large images if any
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let totalBrightness = 0;
      let count = 0;

      // Iterate over every 4th pixel to speed up
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Only consider non-transparent pixels
        if (a > 20) {
          // Perceived brightness formula
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          totalBrightness += brightness;
          count++;
        }
      }

      if (count > 0) {
        const avgBrightness = totalBrightness / count;
        // If average brightness is high (> 200 out of 255), it's likely a white/light logo
        // setShouldInvertLogo(avgBrightness > 200);

        // Strict check: if it's REALLY white (like the user's case), avg should be very high
        // Use 200 as a safe threshold for "White"
        setShouldInvertLogo(avgBrightness > 200);
        console.log('[Logo Analysis] Avg Brightness:', avgBrightness, 'Invert?', avgBrightness > 200);
      }
    } catch (err) {
      console.warn('Unable to analyze logo colors (CORS likely). Defaulting to no inversion.', err);
      // Fallback: If we can't read it, we assume we shouldn't touch it to be safe, 
      // unless it's the known default logo which we know is white.
      if (img.src.includes('/logo.png')) {
        setShouldInvertLogo(true);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-app-bg font-sans overflow-hidden">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      {/* Floating Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <header
          className="app-glass-panel px-6 py-3 rounded-full flex items-center gap-6 animate-fade-in shadow-2xl border border-theme-border"
        >
          {logoUrl ? (
            <img
              src={logoUrl.startsWith('http') ? logoUrl : `${NETWORK_URLS.BASE_URL}${logoUrl}`}
              alt={orgName || "Org Logo"}
              className="h-12 object-contain"
              crossOrigin="anonymous"
              onLoad={handleLogoLoad}
              style={{ filter: (theme === 'light' && shouldInvertLogo) ? 'invert(1) brightness(0)' : 'none', transition: 'filter 0.3s' }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
            />
          ) : (
            <img
              src="/logo.png"
              alt="Meerana EPC"
              className="h-12 object-contain"
              onLoad={handleLogoLoad}
              style={{ filter: (theme === 'light' && shouldInvertLogo) ? 'invert(1) brightness(0)' : 'none', transition: 'filter 0.3s' }}
            />
          )}
          <div className="h-4 w-px bg-theme-border"></div>
          <div className="flex flex-col items-start">
            <span className="text-theme-primary font-semibold">{processName || t('newModel')}</span>
            <span className="text-[10px] text-neutral-500 font-medium h-3 flex items-center">
              {saveStatus === 'saving' && <span className="text-blue-400 animate-pulse">Saving...</span>}
              {saveStatus === 'saved' && <span className="text-green-500/80">Saved</span>}
              {saveStatus === 'unsaved' && <span className="text-yellow-500/80">Unsaved changes</span>}
              {saveStatus === 'error' && <span className="text-red-500">Save failed</span>}
            </span>
          </div>
          <div className="h-4 w-px bg-theme-border"></div>
          <div className="flex items-center gap-2">
            {(userRole === 'admin' || userRole === 'system_admin') && !isViewMode && (
              <button
                onClick={() => window.location.href = '/admin'}
                className="p-2 text-theme-tertiary hover:text-purple-400 hover:bg-theme-bg-tertiary rounded-full transition-colors"
                title={t('adminDashboard')}
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
            {(userRole === 'superadmin' || userRole === 'admin' || userRole === 'designer' || userRole === 'system_admin' || currentUser?.access_level === 'editor') && !isViewMode && !isPreviewMode && (<div className="flex items-center gap-1">
              <button
                onClick={handleSaveClick}
                className="p-2 text-theme-tertiary hover:text-green-400 hover:bg-theme-bg-tertiary rounded-full transition-colors"
                title={t('saveProcess')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
              </button>
              <DiagramTemplateSwitcher
                currentTemplate={orgTemplate}
                onTemplateChange={handleTemplateChange}
                diagramType={diagramType}
                t={t}
              />
            </div>
            )}
            {!isViewMode && !isPreviewMode && (
              <button
                onClick={handleClearClick}
                className="p-2 text-theme-tertiary hover:text-red-400 hover:bg-theme-bg-tertiary rounded-full transition-colors"
                title={t('clearBoard')}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <PdfDropdown onDownload={downloadPdf} t={t} />
            <button
              onClick={shareDiagram}
              disabled={isSharing}
              className={`p-2 transition-colors rounded-full ${isSharing ? 'text-theme-accent animate-pulse' : 'text-theme-tertiary hover:text-blue-400 hover:bg-theme-bg-tertiary'}`}
              title={t('share')}
            >
              <Share2 className="w-5 h-5" />
            </button>
            <XmlDropdown
              onImport={() => xmlInputRef.current?.click()}
              onExport={downloadXml}
              t={t}
              isViewMode={isViewMode}
            />
            {processStatus === 'Approved' && (
              <button
                onClick={() => setIsHistoryOpen(true)}
                className={`p-2 transition-colors rounded-full ${isHistoryOpen ? 'text-indigo-400 bg-indigo-500/10' : 'text-theme-tertiary hover:text-indigo-400 hover:bg-theme-bg-tertiary'}`}
                title="Timeline History"
              >
                <History className="w-5 h-5" />
              </button>
            )}
            {!isViewMode && !isPreviewMode && (
              <input
                type="file"
                ref={xmlInputRef}
                className="hidden"
                accept=".xml,.bpmn"
                onChange={handleImportXml}
              />
            )}
            <button
              onClick={() => window.location.href = (id && id !== 'new') ? `/workspace?id=${id}` : '/workspace'}
              className="p-2 text-theme-tertiary hover:text-theme-primary hover:bg-theme-bg-tertiary rounded-full transition-colors"
              title={t('backToWorkspace')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
            </button>
          </div>
        </header>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (contextMenu.node || contextMenu.edge) && (
        <div
          className="fixed z-[9999] w-48 bg-theme-surface border border-theme-border rounded-lg shadow-2xl overflow-hidden animate-fade-in"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          onMouseLeave={() => setContextMenu({ ...contextMenu, show: false })}
        >
          <div className="p-1">
            {contextMenu.edge ? (
              <>
                <div className="px-3 py-2 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">Line Type</span>
                  <select
                    value={contextMenu.edge.data?.bpmnConnectorType || 'sequence'}
                    onChange={(e) => {
                      const value = e.target.value;
                      const edgeId = contextMenu.edge.id;
                      setEdges((eds) => eds.map(edge => {
                        if (edge.id === edgeId) {
                          const newEdge = { ...edge, type: 'smoothstep', animated: false, markerStart: undefined, markerEnd: undefined, data: { ...edge.data, bpmnConnectorType: value } };
                          if (value === 'sequence') {
                            newEdge.style = { stroke: '#64748b', strokeWidth: 2, strokeDasharray: 'none' };
                            newEdge.markerEnd = { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#64748b' };
                          } else if (value === 'message') {
                            newEdge.style = { stroke: '#64748b', strokeWidth: 2, strokeDasharray: '5,5' };
                          } else if (value === 'association') {
                            newEdge.style = { stroke: '#64748b', strokeWidth: 2, strokeDasharray: '2,4' };
                          }
                          socketService.emitEdgeDataUpdate(id, edgeId, newEdge.data);
                          return newEdge;
                        }
                        return edge;
                      }));
                      setContextMenu({ ...contextMenu, show: false });
                    }}
                    className="w-full bg-theme-bg border border-theme-border text-theme-primary rounded-md px-2 py-1.5 text-sm outline-none focus:border-theme-accent cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                  >
                    <option value="sequence">Sequence Flow</option>
                    <option value="message">Message Flow</option>
                    <option value="association">Association</option>
                  </select>
                </div>

                <div className="h-px bg-theme-border my-1"></div>
                <button
                  onClick={() => {
                    const edgeId = contextMenu.edge.id;
                    onEdgesChangeSocket([{ id: edgeId, type: 'remove' }]);
                    setContextMenu({ ...contextMenu, show: false });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition-colors text-left font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === contextMenu.node.id })));
                    setSelectedNodeForPanel({ ...contextMenu.node, __defaultTab: 'properties' });
                    setContextMenu({ ...contextMenu, show: false });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-primary hover:bg-theme-bg-secondary rounded-md transition-colors text-left font-bold"
                >
                  <Settings className="w-4 h-4 text-theme-accent" />
                  Attribute
                </button>
                {!isViewMode && contextMenu.node?.type?.startsWith('bpmn_') &&
                  !['bpmn_pool', 'bpmn_lane', 'bpmn_gateway', 'bpmn_data'].includes(contextMenu.node.type) && (
                    <button
                      onClick={() => {
                        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === contextMenu.node.id })));
                        setSelectedNodeForPanel({ ...contextMenu.node, __defaultTab: 'configuration' });
                        setContextMenu({ ...contextMenu, show: false });
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-primary hover:bg-theme-bg-secondary rounded-md transition-colors text-left font-bold"
                    >
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] text-theme-accent"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      </div>
                      Configuration
                    </button>
                  )}
                <div className="h-px bg-theme-border my-1"></div>
                {(!contextMenu.node?.data?.isMeta && !contextMenu.node?.id?.includes('-meta-') && !['bpmn_pool', 'bpmn_lane'].includes(contextMenu.node?.type)) && (
                  <button
                    onClick={(e) => {
                      const freshNode = nodes.find(n => n.id === contextMenu.node.id) || contextMenu.node;
                      onNodeClick(e, freshNode);
                      setContextMenu({ ...contextMenu, show: false });
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-secondary rounded-md transition-colors text-left"
                  >
                    {contextMenu.node && nodes.find(n => n.id === contextMenu.node.id)?.data?.isCollapsed === false ? (
                      <>
                        <Minimize2 className="w-4 h-4 text-blue-400" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-4 h-4 text-blue-400" />
                        Expand
                      </>
                    )}
                  </button>
                )}
                {!isViewMode && (
                  <>
                    {['bpmn_pool', 'bpmn_lane'].includes(contextMenu.node?.type) && (
                      <>
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('bpmn-swimlane-add-lane', { detail: { action: 'add-above', nodeId: contextMenu.node.id } }));
                            setContextMenu({ ...contextMenu, show: false });
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-secondary rounded-md transition-colors text-left"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-blue-400">
                              <rect x="2" y="2" width="12" height="12" rx="1" />
                              <line x1="2" y1="6" x2="14" y2="6" strokeDasharray="2 2" />
                          </svg>
                          Add Lane Above
                        </button>
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('bpmn-swimlane-add-lane', { detail: { action: 'add-below', nodeId: contextMenu.node.id } }));
                            setContextMenu({ ...contextMenu, show: false });
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-secondary rounded-md transition-colors text-left"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-blue-400">
                              <rect x="2" y="2" width="12" height="12" rx="1" />
                              <line x1="2" y1="10" x2="14" y2="10" strokeDasharray="2 2" />
                          </svg>
                          Add Lane Below
                        </button>
                        <div className="h-px bg-theme-border my-1"></div>
                      </>
                    )}
                    {!['bpmn_pool', 'bpmn_lane'].includes(contextMenu.node?.type) && (
                      <>
                        <button
                          onClick={() => {
                            const node = contextMenu.node;
                            // Filter out technical fields for a cleaner prompt
                            const { label, description, status } = node.data;
                            const ignored = ['label', 'description', 'status', 'icon', 'onEdit', 'isMeta', 'hasChildren', 'isCollapsed', 'readOnly'];
                            const extraProps = Object.entries(node.data)
                              .filter(([key]) => !ignored.includes(key))
                              .map(([key, val]) => `- ${key}: ${val}`)
                              .join('\n');

                            const prompt = `I want to edit the metadata for the node "${label || 'Unnamed'}".\nCurrent Details:\n- Type: ${node.type}\n- Label: ${label || 'N/A'}\n${description ? `- Description: ${description}\n` : ''}${status ? `- Status: ${status}\n` : ''}${extraProps ? extraProps + '\n' : ''}\nPlease help me improve or add to these details.`;

                            setExternalChatInput(prompt);
                            // setIsRightOpen(true); // Removed auto-open behavior
                            setContextMenu({ ...contextMenu, show: false });
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-secondary rounded-md transition-colors text-left"
                        >
                          <MessageSquare className="w-4 h-4 text-purple-400" />
                          Send to Chatbot
                        </button>
                        <div className="h-px bg-theme-border my-1"></div>
                      </>
                    )}

                {/* VACD Collapse Left */}
                {(['process', 'valueaddedchain', 'vacd', 'core_process'].includes(contextMenu.node?.type)) && (
                  <>
                    <button
                      onClick={() => handleCollapseLeft(contextMenu.node)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-secondary rounded-md transition-colors text-left"
                    >
                      {nodes.find(n => n.id === contextMenu.node.id)?.data?.isLeftCollapsed ? (
                        <>
                          <Maximize2 className="w-4 h-4 text-green-400" />
                          Expand Left
                        </>
                      ) : (
                        <>
                          <Minimize2 className="w-4 h-4 text-orange-400" />
                          Collapse Left
                        </>
                      )}
                    </button>
                    <div className="h-px bg-theme-border my-1"></div>
                  </>
                )}

                {/* Process Linking */}
                {contextMenu.node?.data?.linkedProcessId ? (
                  <>
                    <button
                      onClick={() => {
                        window.open(`/workspace?id=${contextMenu.node.data.linkedProcessId}`, '_blank');
                        setContextMenu({ ...contextMenu, show: false });
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-theme-bg-secondary hover:text-blue-500 rounded-md transition-colors text-left font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Linked Process
                    </button>
                    <button
                      onClick={() => handleUnlinkProcess(contextMenu.node.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-secondary rounded-md transition-colors text-left"
                    >
                      <Unlink className="w-4 h-4" />
                      Unlink Process
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleLinkProcess(contextMenu.node.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-secondary rounded-md transition-colors text-left"
                  >
                    <LinkIcon className="w-4 h-4 text-orange-400" />
                    Link with another process
                  </button>
                )}

                <div className="h-px bg-theme-border my-1"></div>

                {/* Attachments Section */}
                <div className="px-3 py-1.5 flex justify-between items-center group/header">
                  <span className="text-xs text-theme-tertiary font-semibold uppercase tracking-wider">Attachments</span>
                  <label className="cursor-pointer text-theme-tertiary hover:text-blue-400 p-1 hover:bg-theme-bg-secondary rounded transition-colors" title="Upload Attachment">
                    <Plus className="w-3 h-3" />
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          Array.from(files).forEach((file) => {
                            handleNodeFileUpload(contextMenu.node.id, file);
                          });
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="max-h-32 overflow-y-auto custom-scrollbar px-1 mb-1 space-y-0.5 relative">
                  {(nodes.find(n => n.id === contextMenu.node.id)?.data?.attachments || []).map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2 py-1.5 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-secondary rounded group/file relative"
                      onMouseEnter={() => setHoveredAttachment({ url: file.url, name: file.name })}
                      onMouseLeave={() => setHoveredAttachment(null)}
                    >
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate max-w-[120px] hover:text-blue-400 flex items-center gap-2 text-xs"
                        title={file.name}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Paperclip className="w-3 h-3 text-theme-tertiary group-hover/file:text-blue-400" />
                        {file.name}
                      </a>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNodes(nds => nds.map(n => {
                              if (n.id === contextMenu.node.id) {
                                const newAtts = (n.data.attachments || []).filter((_, i) => i !== idx);
                                return { ...n, data: { ...n.data, attachments: newAtts } };
                              }
                              return n;
                            }));
                          }}
                          className="hidden group-hover/file:block text-theme-tertiary hover:text-red-500 p-0.5 rounded transition-colors"
                          title="Remove Attachment"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(nodes.find(n => n.id === contextMenu.node.id)?.data?.attachments || []).length === 0 && (
                    <div className="px-3 py-2 text-xs text-theme-tertiary/70 italic text-center">No attachments</div>
                  )}
                </div>
                <div className="h-px bg-theme-border my-1"></div>

                {/* Node Color Section */}
                <div className="px-3 py-1.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-theme-tertiary font-semibold uppercase tracking-wider">Node Color</span>
                    <button
                      onClick={() => setShowCustomColorPicker(!showCustomColorPicker)}
                      className={`p-1 rounded hover:bg-theme-bg-secondary transition-colors ${showCustomColorPicker ? 'text-blue-500 bg-theme-bg-secondary' : 'text-theme-tertiary'}`}
                      title="Custom Color Picker"
                    >
                      <Palette className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {showCustomColorPicker && (
                    <div className="flex flex-col gap-3 p-1 animate-fade-in custom-color-picker">
                      <HexColorPicker
                        color={nodes.find(n => n.id === contextMenu.node.id)?.data?.customColor || '#ffffff'}
                        onChange={(color) => handleColorChange(contextMenu.node.id, color)}
                        className="!w-full !h-32"
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border border-theme-border shrink-0 shadow-inner"
                          style={{ backgroundColor: nodes.find(n => n.id === contextMenu.node.id)?.data?.customColor || '#ffffff' }}
                        />
                        <input
                          type="text"
                          value={nodes.find(n => n.id === contextMenu.node.id)?.data?.customColor || '#ffffff'}
                          onChange={(e) => handleColorChange(contextMenu.node.id, e.target.value)}
                          className="flex-1 bg-theme-bg-secondary border border-theme-border rounded px-2 py-1 text-xs text-theme-primary uppercase focus:border-blue-500 outline-none"
                        />
                      </div>

                      {recentColors.length > 0 && (
                        <div className="flex flex-col gap-1.5 pt-1 border-t border-theme-border">
                          <span className="text-[10px] text-theme-tertiary font-bold uppercase tracking-wider">Recent</span>
                          <div className="flex flex-wrap gap-1">
                            {recentColors.map((col, i) => (
                              <button
                                key={i}
                                onClick={() => handleColorChange(contextMenu.node.id, col)}
                                className="w-5 h-5 rounded border border-theme-border hover:border-theme-secondary transition-all hover:scale-110"
                                style={{ backgroundColor: col }}
                                title={col}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!showCustomColorPicker && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {NODE_COLORS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => {
                            handleColorChange(contextMenu.node.id, color.value);
                          }}
                          className={`w-full aspect-square rounded-md border transition-all hover:scale-110 active:scale-95 ${nodes.find(n => n.id === contextMenu.node.id)?.data?.customColor === color.value ? 'border-theme-primary scale-105 shadow-md' : 'border-theme-border hover:border-theme-secondary/70'}`}
                          style={{ backgroundColor: color.value || 'var(--theme-surface, white)' }}
                          title={color.name}
                        >
                          {!color.value && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-4 h-[2px] bg-red-500 rotate-45 absolute" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-px bg-theme-border my-1"></div>
                <button
                  onClick={() => {
                    const nodeId = contextMenu.node.id;
                    // Emit socket event for node deletion (also handles local update via onNodesChange)
                    onNodesChangeSocket([{ id: nodeId, type: 'remove' }]);

                    // Handle connected edges explicitly
                    const connectedEdges = edges.filter(e => e.source === nodeId || e.target === nodeId);
                    if (connectedEdges.length > 0) {
                      const edgeChanges = connectedEdges.map(e => ({ id: e.id, type: 'remove' }));
                      onEdgesChangeSocket(edgeChanges);
                    }

                    setContextMenu({ ...contextMenu, show: false });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition-colors text-left font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Node
                </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Attachment Preview Tooltip */}
      {hoveredAttachment && (
        <div
          className="fixed z-[10000] p-2 bg-theme-surface border border-theme-border rounded-lg shadow-2xl animate-fade-in pointer-events-none"
          style={{
            top: contextMenu.y,
            left: contextMenu.x + 520 > window.innerWidth ? Math.max(10, contextMenu.x - 330) : contextMenu.x + 200, // Position left if right overflows
            maxWidth: /\.(pdf|xml|txt|json)$/i.test(hoveredAttachment.name) ? '320px' : '220px'
          }}
        >
          {(() => {
            const name = hoveredAttachment.name.toLowerCase();
            const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);
            const isPdf = /\.pdf$/i.test(name);
            const isText = /\.(xml|txt|json|md)$/i.test(name);
            const isWord = /\.(doc|docx)$/i.test(name);
            const isExcel = /\.(xls|xlsx|csv)$/i.test(name);
            const isCode = /\.(js|jsx|ts|tsx|py|html|css)$/i.test(name);

            if (isImage) {
              return (
                <div className="relative">
                  <img
                    src={hoveredAttachment.url}
                    alt={hoveredAttachment.name}
                    className="w-full h-auto rounded border border-neutral-800 object-cover max-h-[200px]"
                  />
                </div>
              );
            }

            if (isPdf || isText) {
              return (
                <div className="bg-white rounded overflow-hidden h-[300px] w-[300px]">
                  <iframe
                    src={hoveredAttachment.url}
                    className="w-full h-full border-none"
                    title="Preview"
                  />
                </div>
              );
            }

            // Fallback for others
            return (
              <div className={`flex flex-col items-center gap-3 p-4 rounded-lg w-full ${isWord ? 'bg-blue-900/20 border-blue-500/30' :
                isExcel ? 'bg-green-900/20 border-green-500/30' :
                  isCode ? 'bg-yellow-900/20 border-yellow-500/30' :
                    'bg-neutral-800 border-neutral-700'
                } border`}>
                {isWord && <FileText className="w-12 h-12 text-blue-400" />}
                {isExcel && <FileSpreadsheet className="w-12 h-12 text-green-400" />}
                {isCode && <FileCode className="w-12 h-12 text-yellow-400" />}
                {!isWord && !isExcel && !isCode && <FileText className="w-12 h-12 text-neutral-400" />}

                <span className="text-xs font-medium text-neutral-200 text-center break-all">{hoveredAttachment.name}</span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                  {hoveredAttachment.name.split('.').pop()}
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Metadata Modal */}
      {showMetadataModal && selectedNodeData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center" onClick={() => setShowMetadataModal(false)}>
          <div className="bg-theme-surface border border-theme-border rounded-xl shadow-2xl max-w-lg w-full m-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-theme-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-theme-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Node Metadata
              </h3>
              <button onClick={() => setShowMetadataModal(false)} className="text-theme-tertiary hover:text-theme-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">Type</label>
                  <p className="text-theme-secondary bg-theme-bg-tertiary/50 px-3 py-2 rounded-lg mt-1 border border-theme-border">{selectedNodeData.type}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">Label</label>
                  <input
                    className="w-full bg-theme-input border border-theme-border rounded-lg px-3 py-2 mt-1 text-theme-primary focus:outline-none focus:border-theme-accent"
                    value={selectedNodeData.data.label}
                    onChange={(e) => {
                      const newLabel = e.target.value;
                      setSelectedNodeData({ ...selectedNodeData, data: { ...selectedNodeData.data, label: newLabel } });
                      setNodes((nds) => nds.map(n => n.id === selectedNodeData.id ? { ...n, data: { ...n.data, label: newLabel } } : n));
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">Properties</label>
                  <pre className="text-xs text-theme-tertiary bg-theme-bg-tertiary/30 p-3 rounded-lg mt-1 overflow-x-auto border border-theme-border/50">
                    {JSON.stringify(selectedNodeData.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-theme-border bg-theme-bg-secondary/50 flex justify-end">
              <button
                onClick={() => setShowMetadataModal(false)}
                className="px-4 py-2 bg-theme-accent hover:bg-theme-accent/90 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-theme-accent/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Link Modal */}
      {showLinkModal && (
        <ProcessLinkModal
          onClose={() => setShowLinkModal(false)}
          onSelect={confirmLinkProcess}
          t={t}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        {!isViewMode && (
          <div
            className={`absolute left-4 top-24 bottom-6 z-40 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${isLeftOpen ? 'translate-x-0' : '-translate-x-[200%]'} ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}
            onMouseEnter={() => setIsSidebarCollapsed(false)}
            onMouseLeave={() => setIsSidebarCollapsed(true)}
          >
            <div
              className="h-full app-glass-panel rounded-2xl overflow-hidden shadow-xl animate-slide-in-left"
            >
              <Sidebar
                onDelete={handleDelete}
                isEraserActive={isEraserActive}
                toggleEraser={() => setIsEraserActive(!isEraserActive)}
                onClose={() => setIsLeftOpen(false)}
                selectedSet={selectedShapeSet}
                onSetChange={setSelectedShapeSet}
                isCollapsed={isSidebarCollapsed}
              />
            </div>
          </div>
        )}

        {/* Toggle Left Sidebar Button (when closed) */}
        {
          !isLeftOpen && !isViewMode && (
            <button
              onClick={() => setIsLeftOpen(true)}
              className="absolute left-4 top-24 z-40 p-2 app-glass-panel rounded-lg animate-fade-in"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )
        }

        {/* Canvas */}
        <div className="flex-1 h-full relative bg-transparent" ref={reactFlowWrapper} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>


          {/* Version History Sidebar */}
          <AnimatePresence>
            {isHistoryOpen && (
              <VersionHistorySidebar
                processId={id}
                onClose={() => setIsHistoryOpen(false)}
                onPreview={handlePreviewVersion}
                onRestore={handleRestoreFinished}
                currentVersionId={isPreviewMode ? currentPreviewSnapshot?._id : id}
              />
            )}
          </AnimatePresence>

          {/* Preview Mode Banner */}
          {isPreviewMode && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 px-8 py-3 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center gap-6 z-[100] border border-white/20 backdrop-blur-md animate-bounce-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center animate-pulse">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none opacity-80">Preview Mode</span>
                  <span className="text-sm font-bold mt-0.5">Historical Snapshot</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (window.confirm("Restore this version? A new draft will be created and opened in the editor.")) {
                      try {
                        const api = (await import("../../services/api_service")).default;
                        const res = await api.post(`/processes/${currentPreviewSnapshot._id}/restore`);
                        handleRestoreFinished(res.data.process_id);
                      } catch (err) {
                        const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Restoration failed";
                        window.alert(errorMsg);
                        setToast({ show: true, message: errorMsg, type: "timeline" });
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
                <button
                  onClick={handleExitPreview}
                  className="flex items-center gap-2 px-5 py-1.5 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-neutral-100 transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                  Exit Preview
                </button>
              </div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypesMemo}
            edgeTypes={edgeTypesMemo}
            onNodesChange={onNodesChangeSocket}
            onEdgesChange={onEdgesChangeSocket}
            onConnect={onConnectSocket}
            onEdgeUpdate={onEdgeUpdate}
            onNodeClick={onNodeClick}
            onNodeDrag={handleNodeDrag}
            onNodeDragStop={handleNodeDragStop}
            onSelectionDrag={handleNodeDrag}
            onSelectionDragStop={handleNodeDragStop}
            onNodeDoubleClick={handleVacdDoubleClick}
            onNodeContextMenu={(event, node) => {
              event.preventDefault();

              // Estimated dimensions of the context menu
              const menuWidth = 220;
              const menuHeight = isViewMode ? 100 : 450;

              let x = event.clientX;
              let y = event.clientY;

              // Prevent horizontal overflow
              if (x + menuWidth > window.innerWidth) {
                x = x - menuWidth;
                if (x < 10) x = 10;
              }
              // Prevent vertical overflow
              if (y + menuHeight > window.innerHeight) {
                y = y - menuHeight;
                if (y < 10) y = 10;
              }

              // Calculate position relative to the container/window
              setContextMenu({
                x,
                y,
                node: node,
                edge: null,
                show: true
              });
            }}
            onEdgeContextMenu={(event, edge) => {
              if (isViewMode) return;
              event.preventDefault();
              const menuWidth = 220;
              const menuHeight = 150;
              let x = event.clientX;
              let y = event.clientY;
              if (x + menuWidth > window.innerWidth) {
                x = Math.max(10, x - menuWidth);
              }
              if (y + menuHeight > window.innerHeight) {
                y = Math.max(10, y - menuHeight);
              }
              setContextMenu({
                x,
                y,
                node: null,
                edge: edge,
                show: true
              });
            }}
            onEdgeClick={onEdgeClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onMoveStart={() => setContextPad({ show: false, node: null, x: 0, y: 0 })}
            className="bg-transparent"
            snapToGrid={false}
            snapGrid={[5, 5]}
            connectionMode="loose" // Allow any handle to connect to any handle
            onPaneClick={() => {
              setContextMenu({ ...contextMenu, show: false });
              setContextPad({ show: false, node: null, x: 0, y: 0 });
              setSelectedNodeForPanel(null);
            }}
            selectionOnDrag={!isHandMode} // Default drag to select (Blue Box) unless Hand Mode
            panOnDrag={isHandMode ? [0, 1, 2] : [1, 2]} // 0 = Left Click Pan if Hand Mode
            panActivationKeyCode="Control" // Pan only when Ctrl is held
            selectionKeyCode={null} // Disable specific key for selection since it's now default
            multiSelectionKeyCode="Control" // Add to selection with Ctrl
            elevateNodesOnSelect={false} // Prevent shapes from jumping to front on click
            nodesDraggable={!isEraserActive && !isHandMode && !isPreviewMode}
            nodesConnectable={!isEraserActive && !isViewMode && !isHandMode && !isPreviewMode}
            elementsSelectable={!isEraserActive && !isHandMode && !isPreviewMode}
            minZoom={0.1}
            onSelectionChange={handleSelectionChange}
          >
            {contextPad.show && contextPad.node && (
              <Panel
                position="top-left"
                style={{
                  position: 'fixed',
                  left: contextPad.x,
                  top: contextPad.y,
                  zIndex: 1000,
                  pointerEvents: 'auto'
                }}
              >
                <div className="flex flex-col gap-1 p-1.5 bg-theme-surface border border-theme-border rounded-lg shadow-xl animate-fade-in backdrop-blur-md bg-opacity-90">
                  <div className="grid grid-cols-3 gap-1">
                    {getContextPadItems(contextPad.node).map((item) => (
                      <button
                        key={item.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.type === 'trash') {
                            onNodesChangeSocket([{ id: contextPad.node.id, type: 'remove' }]);
                            setContextPad({ ...contextPad, show: false, node: null });
                            return;
                          }
                          if (item.type === 'color') {
                            setContextPad(prev => ({ ...prev, showColors: !prev.showColors }));
                            return;
                          }
                          if (item.type === 'settings') {
                            setSelectedNodeForPanel(contextPad.node);
                            setContextPad({ ...contextPad, show: false, node: null });
                            return;
                          }
                          if (item.type === 'expand_meta') {
                            handleMetaExpansion(contextPad.node);
                            setContextPad({ ...contextPad, show: false, node: null });
                            return;
                          }

                          const sourceNode = contextPad.node;
                          const outgoingEdges = edges.filter(e => e.source === sourceNode.id);
                          const verticalOffset = outgoingEdges.length * 120; // Offset by 120px for each existing connection

                          const newNodeId = `quick_${Date.now()}`;
                          const newNode = {
                            id: newNodeId,
                            type: item.type,
                            position: {
                              x: sourceNode.position.x + (sourceNode.width || 200) + 100,
                              y: sourceNode.position.y + verticalOffset,
                            },
                            data: {
                              label: `New ${item.label}`,
                              onEdit: handleNodeEdit,
                              onUpload: (id, file) => handleNodeFileUpload(id, file),
                            },
                          };

                          const newEdge = {
                            id: `edge_${sourceNode.id}_${newNodeId}`,
                            source: sourceNode.id,
                            target: newNodeId,
                            sourceHandle: 'r',
                            targetHandle: 'l',
                            type: 'smoothstep',
                            markerEnd: {
                              type: MarkerType.ArrowClosed,
                              width: 20,
                              height: 20,
                              color: "#64748b",
                            },
                            style: {
                              stroke: "#64748b",
                              strokeWidth: 2,
                            },
                          };

                          setNodes((nds) => nds.concat(newNode));
                          setEdges((eds) => eds.concat(newEdge));

                          if (id && id !== 'new') {
                            socketService.emitNewNode(id, newNode);
                            socketService.emitNewConnection(id, newEdge);
                          }

                          // Auto-focus the next node for chained modeling
                          setTimeout(() => {
                            const newNodeElement = document.querySelector(`.react-flow__node[data-id="${newNodeId}"]`);
                            if (newNodeElement) {
                              const newRect = newNodeElement.getBoundingClientRect();
                              setContextPad({
                                show: true,
                                node: newNode,
                                x: newRect.right + 10,
                                y: newRect.top - 180,
                                showColors: false
                              });
                            }
                          }, 100);
                        }}
                        className={`p-2 hover:bg-theme-bg-secondary rounded-md transition-all flex flex-col items-center gap-0.5 group/pad`}
                        title={item.label}
                      >
                        <item.icon className={`w-4 h-4 ${item.color} group-hover/pad:scale-110 transition-transform`} />
                        <span className="text-[8px] text-theme-tertiary font-bold uppercase tracking-tighter">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {contextPad.showColors && (
                    <div className="mt-1 pt-1 border-t border-theme-border grid grid-cols-6 gap-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            const nodeId = contextPad.node.id;
                            const newData = { customColor: c.value };

                            setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n));
                            socketService.emitNodeDataUpdate(id, nodeId, newData);
                            setContextPad({ ...contextPad, show: false, node: null });
                          }}
                          className="w-4 h-4 rounded-full border border-black/10 hover:scale-110 transition-transform"
                          style={{ backgroundColor: c.value || '#ffffff' }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Panel>
            )}
            <HelperLines horizontal={helperLines.horizontal} vertical={helperLines.vertical} />
            
            {/* Custom Animated Grid & Glow Background */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${showGrid ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 canvas-animated-bg opacity-30"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1)_0%,transparent_70%)]"></div>
            </div>
            
            {/* Standard ReactFlow Background as fallback structure */}
            {showGrid && <Background variant="dots" color={theme === 'dark' ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} gap={20} size={1.5} />}
            
            {/* AI Generation State Overlay */}
            {(isAIGenerating || previewMode) && (
               <div className="absolute inset-0 z-[100] flex flex-col items-center justify-end pb-[120px] pointer-events-none animate-fade-in">
                 
                 {isAIGenerating && (
                     <div className="absolute inset-0 pointer-events-none transition-all duration-500 overflow-hidden flex items-center justify-center">
                         <div className="generation-halo opacity-50"></div>
                     </div>
                 )}
                 
                  {isAIGenerating && (
                     <div className="relative z-10 pointer-events-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-full px-8 py-4 flex items-center gap-8 shadow-[0_15px_50px_rgba(0,0,0,0.2)] animate-slide-up-fade">
                        
                        <div className="relative w-8 h-8 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" className="stroke-indigo-500/20" strokeWidth="12" />
                                <circle cx="50" cy="50" r="40" fill="none" className="stroke-indigo-500 transition-all duration-1000 ease-out" strokeWidth="12" strokeDasharray="251" strokeDashoffset={251 - (251 * ((generationPhase + 1) / 4))} strokeLinecap="round" />
                            </svg>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            {[
                                { id: 0, label: "Understanding" },
                                { id: 1, label: "Analyzing" },
                                { id: 2, label: "Building" },
                                { id: 3, label: "Finalizing" }
                            ].map((step) => (
                                <div key={step.id} className="flex items-center gap-2">
                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-500 ${
                                        generationPhase > step.id 
                                            ? 'bg-indigo-500' 
                                            : generationPhase === step.id 
                                                ? 'bg-transparent border-[1.5px] border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                                                : 'bg-transparent border border-theme-border opacity-40'
                                    }`}>
                                        {generationPhase > step.id ? (
                                            <Check className="w-2.5 h-2.5 text-white" />
                                        ) : generationPhase === step.id ? (
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></div>
                                        ) : null}
                                    </div>
                                    <span className={`text-xs font-semibold transition-colors ${generationPhase >= step.id ? 'text-indigo-500' : 'text-theme-tertiary opacity-60'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="w-[1px] h-6 bg-theme-border/50"></div>
                        
                        <button 
                            onClick={handleStopGeneration}
                            className="p-2 text-theme-tertiary hover:text-red-500 transition-colors rounded-full hover:bg-theme-secondary/10"
                            title="Stop Generation"
                        >
                            <X className="w-4 h-4" />
                        </button>
                     </div>
                 )}

                 {previewMode && (
                     <div className="relative z-10 pointer-events-auto flex items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-white/50 dark:border-white/10 p-3 rounded-[1.25rem] shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-slide-up-fade">
                        <button 
                            onClick={handleStopGeneration}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-200 hover:bg-theme-secondary/10 transition-colors flex items-center gap-2"
                        >
                            <X className="w-4 h-4" /> Discard all
                        </button>
                        <button 
                            onClick={() => {
                                backupNodesRef.current = null;
                                backupEdgesRef.current = null;
                                setPreviewMode(false);
                            }}
                            className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-[0_8px_20px_rgba(99,102,241,0.3)] transition-all flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" /> Add to canvas
                        </button>
                     </div>
                 )}
               </div>
            )}

            <CursorLayer remoteUsers={remoteUsers} />


            <Panel position="top-right" className="mt-2 mr-4 flex flex-col gap-3 items-end pointer-events-auto">
              <div className="flex flex-row gap-4 items-center">
                <ActiveUsers users={activeUsers} />
                <LegendDropdown selectedShapeSet={selectedShapeSet} />
              </div>
              <ZoomControls
                showMiniMap={showMiniMap}
                onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
                isHandMode={isHandMode}
                onToggleHandMode={() => {
                  setIsHandMode(!isHandMode);
                  setIsEraserActive(false); // Exclusive modes
                }}
              />

              {/* Chat Toggle Button moved here */}
              {!isViewMode && !isRightOpen && aiAssistantEnabled && (
                <button
                  onClick={() => setIsRightOpen(!isRightOpen)}
                  className={`p-3 rounded-full shadow-lg border border-theme-border transition-all ${isRightOpen
                    ? 'bg-theme-accent text-white border-theme-accent'
                    : 'app-glass-panel text-theme-tertiary hover:text-white'
                    }`}
                  title={isRightOpen ? "Close Chat" : "Open Chat"}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              )}
            </Panel>

            {showMiniMap && (
              <MiniMap
                pannable
                zoomable
                nodeColor={(n) => {
                  if (n.data?.customColor) return n.data.customColor;
                  if (n.type === 'event') return '#ec4899';
                  if (n.type === 'function') return '#eab308';
                  if (n.type === 'role') return '#3b82f6';
                  return '#64748b';
                }}
                maskColor={theme === 'dark' ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.15)"}
                className="!bottom-20 !right-4 !bg-theme-surface/80 !backdrop-blur-md !border-theme-border !shadow-2xl !rounded-2xl !m-0"
                style={{ backgroundColor: 'transparent' }}
              />
            )}







            {/* Product Branding */}
            <Panel position="top-left" className="mt-4 ml-4">
              <div className="bg-theme-surface/90 backdrop-blur-md border border-theme-border px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
                <span className="font-display font-bold text-lg text-theme-primary tracking-tight">TASREE3</span>
              </div>
            </Panel>

          </ReactFlow>

          {/* Canvas Toolbar (Floating Bottom Center) - NOW OUTSIDE REACTFLOW */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
            <div
              className="app-glass-panel px-6 py-3 rounded-full flex gap-6 items-center shadow-2xl border border-theme-border whitespace-nowrap w-max"
            >
              <label className="flex items-center gap-2 text-xs font-medium text-theme-tertiary cursor-pointer hover:text-theme-primary transition-colors">
                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-theme-accent rounded" />
                {t('grid')}
              </label>
              <div className="w-px h-4 bg-theme-border"></div>
              <button
                onClick={() => {
                  const newDir = layoutDirection === 'TB' ? 'LR' : 'TB';
                  setLayoutDirection(newDir);
                  // Update nodes position
                  let laidOut;
                  if (diagramType === 'organization') {
                    laidOut = organizationalLayout(nodes, edges, newDir);
                  } else if (diagramType === 'fad') {
                    // Reconstruct FAD structure for layout
                    const fadProcessNode = nodes.find(n => n.data?.is_central);
                    if (fadProcessNode) {
                      const fadProcess = { ...fadProcessNode.data, id: fadProcessNode.id };
                      const groupsMap = {};
                      nodes.filter(n => n.id !== fadProcessNode.id).forEach(n => {
                        const gid = n.data.group_id || 'default';
                        if (!groupsMap[gid]) {
                          groupsMap[gid] = {
                            group_id: gid,
                            group_category: n.data.group_category,
                            side: n.data.side,
                            nodes: []
                          };
                        }
                        groupsMap[gid].nodes.push({ ...n.data, id: n.id, type: n.type });
                      });
                      laidOut = fadLayout(fadProcess, Object.values(groupsMap), [], newDir);
                    } else {
                      laidOut = nodes;
                    }
                  } else if (diagramType === 'bpmn' || nodes.some(n => n.type?.startsWith('bpmn'))) {
                    laidOut = bpmnLayout(nodes, edges, newDir);
                  } else {
                    laidOut = layoutGraph(nodes, edges, newDir);
                  }

                  setNodes([...laidOut]);

                  // Update edges handles to match direction (Straight Lines) - only for non-FAD
                  if (diagramType !== 'fad') {
                    const updatedEdges = edges.map(edge => ({
                      ...edge,
                      // Update handles for ALL edges so manual drawings cleanly realign to the layout flow
                      sourceHandle: newDir === 'LR' ? 'r' : 'b',
                      targetHandle: newDir === 'LR' ? 'l' : 't'
                    }));
                    setEdges(updatedEdges);
                  }

                  setTimeout(() => window.requestAnimationFrame(() => reactFlowInstance.fitView({ padding: 0.2 })), 50);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-bg-tertiary hover:bg-theme-bg-secondary text-theme-secondary hover:text-theme-primary rounded-full text-xs font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                {layoutDirection === 'TB' ? t('rotateHorizontal') : t('rotateVertical')}
              </button>
              <button
                onClick={() => {
                  let laidOut;
                  if (diagramType === 'organization') {
                    laidOut = organizationalLayout(nodes, edges, layoutDirection);
                  } else if (diagramType === 'fad') {
                    // Reconstruct FAD for Re-Layout
                    const fadProcessNode = nodes.find(n => n.data?.is_central);
                    if (fadProcessNode) {
                      const fadProcess = { ...fadProcessNode.data, id: fadProcessNode.id };
                      const groupsMap = {};
                      nodes.filter(n => n.id !== fadProcessNode.id).forEach(n => {
                        const gid = n.data.group_id || 'default';
                        if (!groupsMap[gid]) {
                          groupsMap[gid] = {
                            group_id: gid,
                            group_category: n.data.group_category,
                            side: n.data.side,
                            nodes: []
                          };
                        }
                        groupsMap[gid].nodes.push({ ...n.data, id: n.id, type: n.type });
                      });
                      laidOut = fadLayout(fadProcess, Object.values(groupsMap), [], layoutDirection);
                    } else {
                      laidOut = nodes;
                    }
                  } else if (diagramType === 'bpmn' || nodes.some(n => n.type?.startsWith('bpmn'))) {
                    laidOut = bpmnLayout(nodes, edges, layoutDirection);
                  } else {
                    laidOut = layoutGraph(nodes, edges, layoutDirection);
                  }
                  setNodes([...laidOut]);
                  setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 10);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-bg-tertiary hover:bg-theme-bg-secondary text-theme-secondary hover:text-theme-primary rounded-full text-xs font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                {t('reLayout')}
              </button>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {selectedNodeForPanel && (
          <PropertiesPanel
            selectedNode={selectedNodeForPanel}
            onChange={handleNodeDataUpdate}
            onClose={() => setSelectedNodeForPanel(null)}
            readOnly={isViewMode}
            orgAttributes={orgAttributes}
            processId={id}
            defaultTab={selectedNodeForPanel.__defaultTab}
          />
        )}

        {/* Right Chat Sidebar - Conditionally Rendered to prevent phantom visibility */}
        {!isViewMode && isRightOpen && (
          <div
            className={`absolute right-4 top-24 bottom-6 z-40 w-96 animate-slide-in-right origin-right`}
          >
            <div
              className="h-full app-glass-panel rounded-2xl overflow-hidden shadow-[0_12px_45px_rgba(0,0,0,0.4)]"
            >
              <ChatSidebar
                messages={messages}
                onSendMessage={handleSendMessage}
                onClear={() => setMessages([])}
                onUploadFile={handleUploadFile}
                loading={loading}
                externalInput={externalChatInput}
                setExternalInput={setExternalChatInput}
                nodes={nodes}
              />
            </div>
          </div>
        )}

        {/* Toggle Right Sidebar Button */}
        {
          isRightOpen && !isViewMode && aiAssistantEnabled && (
            <button
              onClick={() => setIsRightOpen(false)}
              className="absolute right-[404px] top-28 z-50 p-2 bg-theme-surface/90 backdrop-blur-sm rounded-lg text-theme-tertiary hover:text-theme-primary hover:bg-theme-bg-tertiary transition-all shadow-lg border border-theme-border"
              title={t('hideSidebar')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )
        }

      </div >

      {/* Save Process Modal */}
      {
        showSaveModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setShowSaveModal(false)}>
            <div className="bg-theme-surface border border-theme-border rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-theme-border">
                <h2 className="text-xl font-bold text-theme-primary">{t('saveProcess')}</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-theme-tertiary mb-1">{t('processName')}</label>
                  <input
                    type="text"
                    value={processName}
                    onChange={(e) => setProcessName(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-2 text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                    placeholder={t('enterProcessName')}
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="px-4 py-2 text-theme-tertiary hover:text-theme-primary hover:bg-theme-bg-tertiary rounded-lg transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    disabled={!processName.trim()}
                    className="px-4 py-2 bg-theme-accent hover:bg-theme-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    {t('saveProcess')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }


      {/* Delete Confirmation Modal */}
      {/* Delete Confirmation Modal */}
      {
        deleteConfirmation.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setDeleteConfirmation({ show: false, processId: null })}>
            <div className="bg-theme-surface border border-theme-border rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center gap-3 text-red-500 mb-4">
                  <AlertTriangle className="w-8 h-8" />
                  <h2 className="text-xl font-bold text-theme-primary">{t('deleteProcessConfirmTitle')}</h2>
                </div>
                <p className="text-theme-secondary mb-6">
                  {t('deleteProcessConfirmMessage')}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteConfirmation({ show: false, processId: null })}
                    className="px-4 py-2 text-theme-tertiary hover:text-theme-primary hover:bg-theme-bg-tertiary rounded-lg transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Clear Confirmation Modal */}
      {
        clearConfirmation.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setClearConfirmation({ show: false })}>
            <div className="bg-theme-surface border border-theme-border rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center gap-3 text-red-500 mb-4">
                  <Trash2 className="w-8 h-8" />
                  <h2 className="text-xl font-bold text-theme-primary">{t('clearBoardConfirmTitle')}</h2>
                </div>
                <p className="text-theme-secondary mb-6">
                  {t('clearBoardConfirmMessage')}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setClearConfirmation({ show: false })}
                    className="px-4 py-2 text-theme-tertiary hover:text-theme-primary hover:bg-theme-bg-tertiary rounded-lg transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleConfirmClear}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium"
                  >
                    {t('clearBoard')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Success Modal */}
      {
        successModal.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setSuccessModal({ show: false, message: '' })}>
            <div className="bg-theme-surface border border-theme-border rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-theme-primary mb-2">{t('success')}</h2>
                <p className="text-theme-secondary mb-6">{successModal.message}</p>
                <button
                  onClick={() => setSuccessModal({ show: false, message: '' })}
                  className="w-full px-4 py-2 bg-theme-accent hover:bg-theme-accent/90 text-white rounded-lg transition-colors font-medium"
                >
                  {t('continue')}
                </button>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}



