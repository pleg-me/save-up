// class Point {
//     x: number;
//     y: number;
//     constructor(x: number, y: number) {
//         this.x = x;
//         this.y = y;
//     }
// }

import { IPoint, IPath } from "../models/GeoItem";

// class Path {
//     nodes: Point[];
//     constructor(nodes: Point[]) {
//         this.nodes = nodes;
//     }
// }

export class PathUtils {
    static buildPathGraph(pathsData: IPath[]): Map<string, {node: IPoint, neighbors: IPoint[]}> {
        const graph = new Map<string, {node: IPoint, neighbors: IPoint[]}>();
        
        // 添加所有节点
        pathsData.forEach(path => {
            path.nodes.forEach(node => {
                const key = `${node.x},${node.y}`;
                if (!graph.has(key)) {
                    graph.set(key, { node, neighbors: [] });
                }
            });
        });
        
        // 为每条路径添加邻接关系
        pathsData.forEach(path => {
            for (let i = 0; i < path.nodes.length; i++) {
                const currentNode = path.nodes[i];
                const currentKey = `${currentNode.x},${currentNode.y}`;
                const currentGraphNode = graph.get(currentKey)!;
                
                // 连接到下一个节点
                const nextIndex = (i + 1) % path.nodes.length;
                const nextNode = path.nodes[nextIndex];
                if (!currentGraphNode.neighbors.some(n => n.x === nextNode.x && n.y === nextNode.y)) {
                    currentGraphNode.neighbors.push(nextNode);
                }
                
                // 连接到上一个节点
                const prevIndex = (i - 1 + path.nodes.length) % path.nodes.length;
                const prevNode = path.nodes[prevIndex];
                if (!currentGraphNode.neighbors.some(n => n.x === prevNode.x && n.y === prevNode.y)) {
                    currentGraphNode.neighbors.push(prevNode);
                }
            }
        });
        
        // 添加路径交叉点的连接（不同路径间的连接）
        const nodePositions = new Map<string, IPoint[]>();
        pathsData.forEach(path => {
            path.nodes.forEach(node => {
                const key = `${node.x},${node.y}`;
                if (!nodePositions.has(key)) {
                    nodePositions.set(key, []);
                }
                nodePositions.get(key)!.push(node);
            });
        });
        
        // 为交叉点添加额外的邻接关系
        nodePositions.forEach((nodes, key) => {
            if (nodes.length > 1) {
                // 这是一个交叉点，连接所有通过此点的路径
                const graphNode = graph.get(key)!;
                // 交叉点已经通过上面的逻辑连接了，这里不需要额外处理
            }
        });
        
        return graph;
    }
    
    /**
     * 使用 A* 算法查找最短路径
     */
    static findShortestPath(
        start: IPoint,  target: IPoint, 
        graph: Map<string, {node: IPoint, neighbors: IPoint[]}>
    ): IPoint[] {
        
        // 找到最近的起始节点和目标节点
        const startNode = this.findNearestNode(start, graph);
        const targetNode = this.findNearestNode(target, graph);
        
        if (!startNode || !targetNode) {
            return []; // 无法找到路径
        }
        
        // 如果起始节点和目标节点相同，返回直接路径
        if (startNode.x === targetNode.x && startNode.y === targetNode.y) {
            return [targetNode];
        }
        
        // A* 算法实现
        const openSet = new Set<string>();
        const closedSet = new Set<string>();
        const gScore = new Map<string, number>();
        const fScore = new Map<string, number>();
        const cameFrom = new Map<string, {x: number, y: number}>();
        
        const startKey = `${startNode.x},${startNode.y}`;
        const targetKey = `${targetNode.x},${targetNode.y}`;
        
        openSet.add(startKey);
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startNode, targetNode));
        
        while (openSet.size > 0) {
            // 找到 fScore 最小的节点
            let current = '';
            let lowestFScore = Infinity;
            for (const node of openSet) {
                const score = fScore.get(node) || Infinity;
                if (score < lowestFScore) {
                    lowestFScore = score;
                    current = node;
                }
            }
            
            if (current === targetKey) {
                // 找到目标，重构路径
                return this.reconstructPath(cameFrom, current, graph);
            }
            
            openSet.delete(current);
            closedSet.add(current);
            
            const currentNode = graph.get(current)!.node;
            const neighbors = graph.get(current)!.neighbors;
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (closedSet.has(neighborKey)) {
                    continue;
                }
                
                const tentativeGScore = (gScore.get(current) || 0) + this.distance(currentNode, neighbor);
                
                if (!openSet.has(neighborKey)) {
                    openSet.add(neighborKey);
                } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
                    continue;
                }
                
                cameFrom.set(neighborKey, currentNode);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, targetNode));
            }
        }
        
        return []; // 无法找到路径
    }
    
    /**
     * 找到距离给定点最近的路径节点
     */
    static findNearestNode(point: IPoint, graph: Map<string, {node: IPoint, neighbors: IPoint[]}>): IPoint | null {
        let nearestNode: IPoint | null = null;
        let minDistance = Infinity;
        
        for (const [key, graphNode] of graph) {
            const distance = this.distance(point, graphNode.node);
            if (distance < minDistance) {
                minDistance = distance;
                nearestNode = graphNode.node;
            }
        }
        
        return nearestNode;
    }
    
    /**
     * 计算两点间的欧几里得距离
     */
    static distance(a: IPoint, b: IPoint): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * A* 算法的启发式函数（曼哈顿距离）
     */
    static heuristic(a: IPoint, b: IPoint): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    
    /**
     * 重构路径
     */
    static reconstructPath(
        cameFrom: Map<string, IPoint>, 
        current: string, 
        graph: Map<string, {node: IPoint, neighbors: IPoint[]}>
    ): IPoint[] {
        const path: IPoint[] = [];
        const currentNode = graph.get(current)!.node;
        path.unshift(currentNode);
        
        let currentKey = current;
        while (cameFrom.has(currentKey)) {
            const node = cameFrom.get(currentKey)!;
            path.unshift(node);
            currentKey = `${node.x},${node.y}`;
        }
        
        return path;
    }

}