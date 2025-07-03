
import { create as createIPFSClient, IPFSHTTPClient } from 'ipfs-http-client';
import { DatabaseService } from './database.js';

interface IPFSNode {
  url: string;
  isActive: boolean;
  lastChecked: Date;
}

interface PinResult {
  hash: string;
  size: number;
  nodes: string[];
}

interface PinMetadata {
  name?: string;
  description?: string;
  type?: string;
  domainId?: string;
}

export class IPFSService {
  private static nodes: IPFSNode[] = [
    { url: 'http://localhost:5001', isActive: true, lastChecked: new Date() },
    { url: 'http://ipfs-node-2:5001', isActive: true, lastChecked: new Date() },
    { url: 'http://ipfs-node-3:5001', isActive: true, lastChecked: new Date() },
  ];

  private static clients: Map<string, IPFSHTTPClient> = new Map();

  // Initialize IPFS clients
  static {
    this.nodes.forEach(node => {
      try {
        const client = createIPFSClient({ url: node.url });
        this.clients.set(node.url, client);
      } catch (error) {
        console.error(`Failed to create IPFS client for ${node.url}:`, error);
      }
    });
  }

  // Health check for IPFS nodes
  static async checkNodeHealth(nodeUrl: string): Promise<boolean> {
    try {
      const client = this.clients.get(nodeUrl);
      if (!client) return false;

      const version = await client.version();
      return !!version;
    } catch (error) {
      console.error(`IPFS node ${nodeUrl} health check failed:`, error);
      return false;
    }
  }

  // Get healthy nodes
  static async getHealthyNodes(): Promise<IPFSNode[]> {
    const healthyNodes: IPFSNode[] = [];

    for (const node of this.nodes) {
      const isHealthy = await this.checkNodeHealth(node.url);
      node.isActive = isHealthy;
      node.lastChecked = new Date();
      
      if (isHealthy) {
        healthyNodes.push(node);
      }
    }

    return healthyNodes;
  }

  // Pin content to IPFS cluster
  static async pinContent(
    content: string | Buffer | Uint8Array,
    metadata?: PinMetadata
  ): Promise<PinResult> {
    const healthyNodes = await this.getHealthyNodes();
    
    if (healthyNodes.length === 0) {
      throw new Error('No healthy IPFS nodes available');
    }

    const pinResults: string[] = [];
    let primaryHash: string | null = null;
    let totalSize = 0;

    // Pin to all healthy nodes
    for (const node of healthyNodes) {
      try {
        const client = this.clients.get(node.url);
        if (!client) continue;

        const result = await client.add(content, {
          pin: true,
          wrapWithDirectory: false,
        });

        if (!primaryHash) {
          primaryHash = result.cid.toString();
          totalSize = result.size;
        }

        pinResults.push(node.url);

        // Add metadata if provided
        if (metadata) {
          try {
            await client.files.write(`/metadata/${result.cid.toString()}.json`, JSON.stringify(metadata), {
              create: true,
              parents: true,
            });
          } catch (metaError) {
            console.error(`Failed to write metadata to ${node.url}:`, metaError);
          }
        }

        console.log(`Content pinned to ${node.url}: ${result.cid.toString()}`);
      } catch (error) {
        console.error(`Failed to pin content to ${node.url}:`, error);
      }
    }

    if (!primaryHash) {
      throw new Error('Failed to pin content to any IPFS nodes');
    }

    // Record in audit log
    await DatabaseService.createAuditLog({
      action: 'ipfs_pin',
      component: 'ipfs',
      details: {
        hash: primaryHash,
        size: totalSize,
        nodes: pinResults,
        metadata,
      },
      ipfsHash: primaryHash,
      isPublic: true,
    });

    return {
      hash: primaryHash,
      size: totalSize,
      nodes: pinResults,
    };
  }

  // Retrieve content from IPFS
  static async getContent(hash: string): Promise<Uint8Array> {
    const healthyNodes = await this.getHealthyNodes();
    
    if (healthyNodes.length === 0) {
      throw new Error('No healthy IPFS nodes available');
    }

    // Try to retrieve from each node until successful
    for (const node of healthyNodes) {
      try {
        const client = this.clients.get(node.url);
        if (!client) continue;

        const chunks: Uint8Array[] = [];
        for await (const chunk of client.cat(hash)) {
          chunks.push(chunk);
        }

        // Combine chunks
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }

        console.log(`Content retrieved from ${node.url}: ${hash}`);
        return result;
      } catch (error) {
        console.error(`Failed to retrieve content from ${node.url}:`, error);
      }
    }

    throw new Error(`Failed to retrieve content with hash: ${hash}`);
  }

  // Pin existing hash to cluster
  static async pinHash(hash: string, metadata?: PinMetadata): Promise<PinResult> {
    const healthyNodes = await this.getHealthyNodes();
    
    if (healthyNodes.length === 0) {
      throw new Error('No healthy IPFS nodes available');
    }

    const pinResults: string[] = [];

    for (const node of healthyNodes) {
      try {
        const client = this.clients.get(node.url);
        if (!client) continue;

        await client.pin.add(hash);
        pinResults.push(node.url);

        // Add metadata if provided
        if (metadata) {
          try {
            await client.files.write(`/metadata/${hash}.json`, JSON.stringify(metadata), {
              create: true,
              parents: true,
            });
          } catch (metaError) {
            console.error(`Failed to write metadata to ${node.url}:`, metaError);
          }
        }

        console.log(`Hash pinned to ${node.url}: ${hash}`);
      } catch (error) {
        console.error(`Failed to pin hash to ${node.url}:`, error);
      }
    }

    if (pinResults.length === 0) {
      throw new Error('Failed to pin hash to any IPFS nodes');
    }

    // Record in audit log
    await DatabaseService.createAuditLog({
      action: 'ipfs_pin_hash',
      component: 'ipfs',
      details: {
        hash,
        nodes: pinResults,
        metadata,
      },
      ipfsHash: hash,
      isPublic: true,
    });

    return {
      hash,
      size: 0, // Size unknown for existing hash
      nodes: pinResults,
    };
  }

  // Unpin content from cluster
  static async unpinContent(hash: string): Promise<void> {
    const healthyNodes = await this.getHealthyNodes();
    
    for (const node of healthyNodes) {
      try {
        const client = this.clients.get(node.url);
        if (!client) continue;

        await client.pin.rm(hash);
        console.log(`Content unpinned from ${node.url}: ${hash}`);
      } catch (error) {
        console.error(`Failed to unpin content from ${node.url}:`, error);
      }
    }

    // Record in audit log
    await DatabaseService.createAuditLog({
      action: 'ipfs_unpin',
      component: 'ipfs',
      details: {
        hash,
        nodes: healthyNodes.map(n => n.url),
      },
      ipfsHash: hash,
      isPublic: true,
    });
  }

  // Get pinned content list
  static async getPinnedContent(): Promise<Array<{ hash: string; type: string }>> {
    const healthyNodes = await this.getHealthyNodes();
    
    if (healthyNodes.length === 0) {
      throw new Error('No healthy IPFS nodes available');
    }

    try {
      const client = this.clients.get(healthyNodes[0].url);
      if (!client) throw new Error('No IPFS client available');

      const pinnedContent: Array<{ hash: string; type: string }> = [];
      
      for await (const pinned of client.pin.ls()) {
        pinnedContent.push({
          hash: pinned.cid.toString(),
          type: pinned.type,
        });
      }

      return pinnedContent;
    } catch (error) {
      console.error('Failed to get pinned content:', error);
      throw error;
    }
  }

  // Get cluster status
  static async getClusterStatus(): Promise<{
    totalNodes: number;
    healthyNodes: number;
    pinnedItems: number;
    clusterHealth: 'healthy' | 'degraded' | 'critical';
  }> {
    const healthyNodes = await this.getHealthyNodes();
    const totalNodes = this.nodes.length;
    const healthyCount = healthyNodes.length;
    
    let pinnedItems = 0;
    try {
      const pinned = await this.getPinnedContent();
      pinnedItems = pinned.length;
    } catch (error) {
      console.error('Failed to get pinned items count:', error);
    }

    let clusterHealth: 'healthy' | 'degraded' | 'critical';
    const healthPercentage = healthyCount / totalNodes;
    
    if (healthPercentage >= 0.8) {
      clusterHealth = 'healthy';
    } else if (healthPercentage >= 0.5) {
      clusterHealth = 'degraded';
    } else {
      clusterHealth = 'critical';
    }

    return {
      totalNodes,
      healthyNodes: healthyCount,
      pinnedItems,
      clusterHealth,
    };
  }

  // Store domain content
  static async storeDomainContent(
    domainId: string,
    content: string,
    contentType: 'website' | 'metadata' | 'media' = 'website'
  ): Promise<string> {
    const metadata: PinMetadata = {
      name: `Domain content - ${domainId}`,
      description: `${contentType} content for domain ID: ${domainId}`,
      type: contentType,
      domainId,
    };

    const result = await this.pinContent(content, metadata);
    
    // Record communication record for CST compliance if needed
    await DatabaseService.recordCommunication({
      userId: '', // This would need to be passed in
      domainId,
      type: 'data',
      dataHash: result.hash,
    });

    return result.hash;
  }

  // Get domain content
  static async getDomainContent(hash: string): Promise<string> {
    const content = await this.getContent(hash);
    return new TextDecoder().decode(content);
  }

  // Upload file with chunking for large files
  static async uploadLargeFile(
    file: Buffer,
    metadata?: PinMetadata
  ): Promise<PinResult> {
    const MAX_CHUNK_SIZE = 256 * 1024; // 256KB chunks
    
    if (file.length <= MAX_CHUNK_SIZE) {
      return this.pinContent(file, metadata);
    }

    // For large files, use IPFS chunking
    const healthyNodes = await this.getHealthyNodes();
    if (healthyNodes.length === 0) {
      throw new Error('No healthy IPFS nodes available');
    }

    try {
      const client = this.clients.get(healthyNodes[0].url);
      if (!client) throw new Error('No IPFS client available');

      const result = await client.add(file, {
        pin: true,
        chunker: 'size-262144', // 256KB chunks
        cidVersion: 1,
      });

      const hash = result.cid.toString();
      
      // Pin to remaining nodes
      await this.pinHash(hash, metadata);

      return {
        hash,
        size: result.size,
        nodes: healthyNodes.map(n => n.url),
      };
    } catch (error) {
      console.error('Failed to upload large file:', error);
      throw error;
    }
  }
}
