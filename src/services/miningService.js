/**
 * miningService.js
 * ----------------
 * API service for the Process Mining module.
 * Uses the existing apiGet / apiPost helpers from api_service.jsx
 * and URL constants from network_string.jsx.
 */
import { apiGet, apiPost } from './api_service.jsx';
import NETWORK_URLS from '../config/network_string.jsx';

/**
 * Upload event logs for a specific process.
 *
 * @param {string} processId  - The process ID to associate logs with
 * @param {Array}  events     - Array of event objects
 *                             Each must have: case_id, activity, timestamp
 *                             Optional: user, source
 * @returns {Promise<{data: object}>}
 */
export async function uploadLogs(processId, events) {
    return apiPost(NETWORK_URLS.MiningUpload(processId), { events });
}

/**
 * Upload a DOCX or PDF file for AI-assisted event extraction.
 *
 * @param {string} processId
 * @param {File}   file
 * @returns {Promise<{data: object}>}
 */
export async function uploadMiningFile(processId, file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiPost(NETWORK_URLS.MiningUploadFile(processId), formData);
}

/**
 * Get the activity transition map (process discovery).
 *
 * @param {string} processId
 * @returns {Promise<{data: {nodes: Array, edges: Array, ...}}>}
 */
export async function getProcessMap(processId) {
    return apiGet(NETWORK_URLS.MiningMap(processId));
}

/**
 * Get the top-10 bottleneck transitions ordered by average delay.
 *
 * @param {string} processId
 * @returns {Promise<{data: {bottlenecks: Array, ...}}>}
 */
export async function getBottlenecks(processId) {
    return apiGet(NETWORK_URLS.MiningBottlenecks(processId));
}

/**
 * Get aggregate KPIs: total cases, average/max duration, etc.
 *
 * @param {string} processId
 * @returns {Promise<{data: {total_cases: number, avg_duration_minutes: number, ...}}>}
 */
export async function getKpis(processId) {
    return apiGet(NETWORK_URLS.MiningKpis(processId));
}

/**
 * Fetch previously generated complete mining analysis for a process from the database.
 *
 * @param {string} processId
 * @returns {Promise<{data: {kpis: any, bottlenecks: any, process_map: any, insights: string | null, generated_at: string}}>}
 */
export async function fetchMiningAnalysis(processId) {
    return apiGet(NETWORK_URLS.MiningAnalysis(processId));
}

/**
 * Request full dashboard generation (Map, KPIs, Bottlenecks) and save them to DB.
 * If filters (e.g. {start_date, end_date}) are provided, the generation is transient and not saved to DB.
 *
 * @param {string} processId
 * @param {object} filters - optional filtering parameters
 * @returns {Promise<{data: {kpis: any, bottlenecks: any, process_map: any, insights: string | null, generated_at: string}}>}
 */
export async function generateMiningAnalysis(processId, filters = {}) {
    return apiPost(NETWORK_URLS.MiningAnalysis(processId), filters);
}

/**
 * Request AI-generated insights for a process and save them (uses Azure OpenAI on backend).
 *
 * @param {string} processId
 * @returns {Promise<{data: {insights: string, generated_at: string}}>}
 */
export async function generateMiningInsights(processId) {
    return apiPost(NETWORK_URLS.MiningInsights(processId), {});
}

/**
 * Send a chat message to the specialized Process Mining AI Analyst.
 *
 * @param {string} processId
 * @param {Array} messages - Array of message objects { role: 'user' | 'assistant', content: string }
 * @returns {Promise<{data: {reply: string}}>}
 */
export async function sendMiningChat(processId, messages) {
    return apiPost(NETWORK_URLS.MiningChat(processId), { messages });
}

/**
 * Update and persist manual process map layout/labels.
 *
 * @param {string} processId
 * @param {object} processMap - { nodes: Array, edges: Array }
 * @returns {Promise<{status: string}>}
 */
export async function updateMiningMap(processId, processMap) {
    return apiPost(NETWORK_URLS.MiningMapUpdate(processId), { process_map: processMap });
}

/**
 * Run a conformance check between multiple processes.
 *
 * @param {string} processId   - The mined process ID
 * @param {string} approvedId  - The approved model ID to compare against
 * @returns {Promise<{data: object}>}
 */
export async function runConformanceCheck(processId, approvedId) {
    return apiPost(NETWORK_URLS.MiningConformance(processId), { approved_id: approvedId });
}
