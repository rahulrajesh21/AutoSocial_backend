const getFlowArray = (flowData) => {
    const nodeMap = new Map();
    flowData.nodes.forEach(node => {
      nodeMap.set(node.id, node);
    });
    const adjacencyList = new Map();
    flowData.nodes.forEach(node => {
      adjacencyList.set(node.id, []);
    });
    
    flowData.edges.forEach(edge => {
      adjacencyList.get(edge.source).push(edge.target);
    });
    const hasIncoming = new Set();
    flowData.edges.forEach(edge => {
      hasIncoming.add(edge.target);
    });
    
    const entryPoints = flowData.nodes
      .map(node => node.id)
      .filter(id => !hasIncoming.has(id));
    const flowArray = [];
    const visited = new Set();
    
    const traverse = (nodeId) => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      const node = nodeMap.get(nodeId);
      flowArray.push({
        id: node.id,
        type: node.type,
        label: node.data.label || node.type,
        data: node.data
      });
      const nextNodes = adjacencyList.get(nodeId) || [];
      nextNodes.forEach(nextId => traverse(nextId));
    };
    entryPoints.forEach(entryId => traverse(entryId));
    
    return flowArray;
  };