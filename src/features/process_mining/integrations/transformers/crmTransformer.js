export const transformCRM = (data) => {
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
        case_id: String(item.OpportunityId || item.id || item.ContactId || 'N/A'),
        activity: String(item.StageName || item.status || 'Unknown CRM Action'),
        timestamp: String(item.CloseDate || item.LastModifiedDate || new Date().toISOString())
    }));
};
