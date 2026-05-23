export async function findNodeByName(nodes, name) {
    const lower = name.toLowerCase();
    for (const node of nodes) {
        if (node.name.toLowerCase() === lower) return node;
        if (node.children?.length) {
            const res = await findNodeByName(node.children, name);
            if (res) return res;
        }
    }
    return null;
}

export async function executeAICommand(cmd, tree, selected, createItem, renameNode, deleteNode, load) {
    const { action, target_type, name, parent_name, use_selected_as_parent, target_name } = cmd;

    if (action === "create") {
        const type = target_type === "folder" ? "folder" : "file";
        let parentId = null;

        if (use_selected_as_parent && selected) parentId = selected._id;
        else if (parent_name) {
            const found = await findNodeByName(tree, parent_name);
            parentId = found?._id || null;
        }

        await createItem(parentId, type, name);
        await load();
        return;
    }

    if (action === "rename") {
        const node = target_name ? await findNodeByName(tree, target_name) : selected;
        if (node) {
            await renameNode(node._id, name);
            await load();
        }
        return;
    }

    if (action === "delete") {
        const node = target_name ? await findNodeByName(tree, target_name) : selected;
        if (node) {
            await deleteNode(node._id);
            await load();
        }
        return;
    }
}

export async function sendChatToAssistant(message, selected, chatMessages, tree) {
    const api = (await import("../../services/api_service")).default;
    const NETWORK_URLS = (await import("../../config/network_string")).default;

    const res = await api.post(NETWORK_URLS.AICommand, {
        message,
        context: selected ? { name: selected.name, type: selected.type } : null,
        history: chatMessages,
        tree
    });

    return res.data;
}

