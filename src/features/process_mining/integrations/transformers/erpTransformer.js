export const transformERP = (data) => {
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
        case_id: String(item.DocNum || item.id || item.OrderNumber || 'N/A'),
        activity: String(item.ObjType || item.status || 'ERP Progress Step'),
        timestamp: String(item.CreateDate || item.UpdateDate || new Date().toISOString())
    }));
};
