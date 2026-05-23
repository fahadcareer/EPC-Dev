import { io } from "socket.io-client";
import NETWORK_URLS from "../config/network_string";

const SOCKET_URL = NETWORK_URLS.SOCKET_URL;

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (!this.socket) {
            const socketOrigin = new URL(SOCKET_URL).origin;
            this.socket = io(socketOrigin, {
                path: "/epc/socket.io",
                transports: ["websocket", "polling"],
                reconnection: true,
                withCredentials: true
            });

            this.socket.on("connect", () => {
                console.log("Socket connected:", this.socket.id);
            });

            this.socket.on("disconnect", () => {
                console.log("Socket disconnected");
            });
        }
    }

    joinProcess(processId, user) {
        if (this.socket) {
            this.socket.emit("join_process", { process_id: processId, user });
        }
    }

    leaveProcess(processId) {
        if (this.socket) {
            this.socket.emit("leave_process", { process_id: processId });
        }
    }

    joinOrg(orgId) {
        if (this.socket) {
            this.socket.emit("join_org", { org_id: orgId });
        }
    }

    leaveOrg(orgId) {
        if (this.socket) {
            this.socket.emit("leave_org", { org_id: orgId });
        }
    }

    onSecurityConfigUpdate(callback) {
        if (this.socket) {
            this.socket.on("security_config_updated", callback);
        }
    }

    offSecurityConfigUpdate() {
        if (this.socket) {
            this.socket.off("security_config_updated");
        }
    }

    onPresenceUpdate(callback) {
        if (this.socket) {
            this.socket.on("presence_update", callback);
        }
    }

    offPresenceUpdate() {
        if (this.socket) {
            this.socket.off("presence_update");
        }
    }

    emitCursorMove(processId, position) {
        if (this.socket) {
            this.socket.emit("cursor_move", { process_id: processId, position });
        }
    }

    emitCursorLeave(processId) {
        if (!this.socket) return;
        this.socket.emit("cursor_leave", { room: processId });
    }

    emitSelectionChange(processId, selectedNodes) {
        if (!this.socket) return;
        this.socket.emit("selection_change", { room: processId, selectedNodes });
    }

    emitNodeChange(processId, changes) {
        if (!this.socket) return;
        this.socket.emit("node_change", { room: processId, changes });
    }

    emitNodeDataUpdate(processId, nodeId, data) {
        if (!this.socket) return;
        this.socket.emit("node_data_update", { room: processId, nodeId, data });
    }

    emitEdgeChange(processId, changes) {
        if (!this.socket) return;
        this.socket.emit("edge_change", { room: processId, changes });
    }

    emitEdgeDataUpdate(processId, edgeId, data) {
        if (!this.socket) return;
        this.socket.emit("edge_data_update", { room: processId, edgeId, data });
    }

    emitNewConnection(processId, connection) {
        if (!this.socket) return;
        this.socket.emit("new_connection", { room: processId, connection });
    }

    emitNewNode(processId, node) {
        if (!this.socket) return;
        this.socket.emit("new_node", { room: processId, node });
    }

    onCursorNodeUpdate(callback) {
        if (!this.socket) return;
        this.socket.on("cursor_node_update", callback);
    }

    onNodeUpdate(callback) {
        if (!this.socket) return;
        this.socket.on("node_update", callback);
    }

    onNodeDataUpdate(callback) {
        if (!this.socket) return;
        this.socket.on("node_data_update", callback);
    }

    onEdgeUpdate(callback) {
        if (!this.socket) return;
        this.socket.on("edge_update", callback);
    }

    onEdgeDataUpdate(callback) {
        if (!this.socket) return;
        this.socket.on("edge_data_update", callback);
    }

    onConnectionUpdate(callback) {
        if (!this.socket) return;
        this.socket.on("connection_update", callback);
    }

    onNodeAdded(callback) {
        if (!this.socket) return;
        this.socket.on("node_added", callback);
    }

    offCursorNodeUpdate() {
        if (this.socket) this.socket.off("cursor_node_update");
    }

    offDiagramUpdates() {
        if (this.socket) {
            this.socket.off("node_update");
            this.socket.off("node_data_update");
            this.socket.off("edge_update");
            this.socket.off("connection_update");
            this.socket.off("node_added");
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

const socketService = new SocketService();
export default socketService;
