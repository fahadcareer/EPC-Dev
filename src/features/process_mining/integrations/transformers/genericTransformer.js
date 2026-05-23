export const transformEvents = (data) => {
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
        case_id: String(item.case_id || item.id || item.caseId || 'N/A'),
        activity: String(item.activity || item.status || item.stage || 'Undefined'),
        timestamp: String(item.timestamp || item.updatedAt || item.created_at || new Date().toISOString())
    }));
};
