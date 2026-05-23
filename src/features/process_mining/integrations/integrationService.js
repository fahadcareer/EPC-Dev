import { apiPost } from '../../../services/api_service.jsx';
import NETWORK_URLS from '../../../config/network_string.jsx';

/**
 * Fetch logs from a third-party integration.
 * 
 * @param {string} type - 'crm' | 'erp' | 'api' | 'webhook'
 * @param {object} config - Interaction configuration (api_url, api_key, etc.)
 * @returns {Promise<{logs: Array}>}
 */
export async function fetchIntegrationLogs(type, config) {
    return apiPost(NETWORK_URLS.MiningIntegrationFetch, {
        integration_type: type,
        config: config
    });
}
