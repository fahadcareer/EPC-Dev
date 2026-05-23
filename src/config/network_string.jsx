const NETWORK_URLS = {
    BASE_URL: "https://meerana.uaenorth.cloudapp.azure.com/epc",
    SOCKET_URL: "https://meerana.uaenorth.cloudapp.azure.com/epc",
    Login: "/auth/login",
    Register: "/auth/register",
    GetProfile: "/auth/profile",
    UpdateProfile: "/auth/profile",

    // Dashboard
    DashboardSummary: "/dashboard/summary",

    // Process endpoints
    GetProcesses: "/processes/",
    GetProcessTree: "/processes/tree",
    ShareDiagram: "/processes/share",
    FolderReport: (id) => `/processes/folder/${id}/report`,
    FolderAttachments: (id) => `/processes/folder/${id}/attachments`,

    // AI endpoints
    GenerateEPC: "/ai/generate",
    GenerateRules: "/ai/generate-rules",
    UploadDocument: "/ai/upload-document",
    AICommand: "/assistant/command",
    GetEPCInsights: (epcId) => `/workflow/${epcId}/insights`,

    // Workflow
    WorkflowUsers: "/workflow/users",
    WorkflowSubmit: "/workflow/submit",
    WorkflowReview: "/workflow/review",
    WorkflowApprove: "/workflow/approve",

    // Organization
    UploadLogo: (orgId) => `/organizations/${orgId}/logo`,
    Organization: (orgId) => `/organizations/${orgId}`,
    Templates: (orgId) => `/templates/${orgId}`,
    Template: (id) => `/templates/${id}`,
    CreateTemplate: "/templates/",

    // Notifications
    GetNotifications: "/notifications/",
    ClearNotifications: "/notifications/",
    MarkNotificationRead: (id) => `/notifications/${id}/read`,
    GetSasToken: "/azure/sas-token",

    // Mining
    MiningUpload: (id) => `/mining/${id}/upload`,
    MiningUploadFile: (id) => `/mining/${id}/upload-file`,
    MiningMap: (id) => `/mining/${id}/map`,
    MiningBottlenecks: (id) => `/mining/${id}/bottlenecks`,
    MiningKpis: (id) => `/mining/${id}/kpis`,
    MiningAnalysis: (id) => `/mining/${id}/analysis`,
    MiningInsights: (id) => `/mining/${id}/insights`,
    MiningChat: (id) => `/mining/${id}/chat`,
    MiningMapUpdate: (id) => `/mining/${id}/update_map`,
    MiningIntegrationFetch: "/mining/integrations/fetch",
    MiningConformance: (id) => `/mining/${id}/conformance`,
    MiningConformanceReport: (id, approvedId) => `/mining/${id}/conformance/report?approved_id=${approvedId}`,

    // Admin
    GetDepartments: "/admin/departments",
};

export default NETWORK_URLS;
