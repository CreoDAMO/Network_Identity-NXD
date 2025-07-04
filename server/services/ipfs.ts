import { create as ipfsClient, IPFSHTTPClient } from 'ipfs-http-client';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface IPFSFile {
  hash: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: Date;
  metadata?: any;
}

export interface IPFSUploadResult {
  hash: string;
  size: number;
  url: string;
}

export interface IPFSClusterNode {
  id: string;
  address: string;
  status: 'online' | 'offline' | 'syncing';
  lastSeen: Date;
}

/**
 * IPFS Service for decentralized storage
 * Handles file uploads, downloads, and cluster management
 */
export class IPFSService {
  private client: IPFSHTTPClient | undefined;
  private clusterNodes: Map<string, IPFSClusterNode> = new Map();
  private uploadHistory: Map<string, IPFSFile> = new Map();
  private pinningStrategy: 'single' | 'cluster' | 'redundant' = 'cluster';

  constructor() {
    // Initialize IPFS client - can connect to local node or remote gateway
    const ipfsUrl = process.env.IPFS_API_URL || 'http://localhost:5001';
    
    try {
      this.client = ipfsClient({
        url: ipfsUrl,
        timeout: 30000, // 30 second timeout
      });
      
      this.initializeClusterNodes();
      this.startHealthChecks();
    } catch (error) {
      console.error('Failed to initialize IPFS client:', error);
      // Fallback to public gateways in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using public IPFS gateway as fallback');
      }
    }
  }

  private initializeClusterNodes() {
    // Initialize cluster nodes from environment or defaults
    const clusterConfig = process.env.IPFS_CLUSTER_NODES || 
      'node1:http://localhost:5001,node2:http://localhost:5002,node3:http://localhost:5003';
    
    clusterConfig.split(',').forEach(nodeConfig => {
      const [id, address] = nodeConfig.split(':');
      if (id && address) {
        this.clusterNodes.set(id, {
          id,
          address,
          status: 'offline',
          lastSeen: new Date()
        });
      }
    });
  }

  private startHealthChecks() {
    // Check cluster health every 30 seconds
    setInterval(async () => {
      await this.checkClusterHealth();
    }, 30000);
  }

  private async checkClusterHealth() {
    for (const nodeId of this.clusterNodes.keys()) {
      const node = this.clusterNodes.get(nodeId)!;
      try {
        const client = ipfsClient({ url: node.address, timeout: 5000 });
        await client.id();
        
        node.status = 'online';
        node.lastSeen = new Date();
        this.clusterNodes.set(nodeId, node);
      } catch (error) {
        node.status = 'offline';
        this.clusterNodes.set(nodeId, node);
      }
    }
  }

  /**
   * Upload file to IPFS
   * @param content File content (Buffer or string)
   * @param filename Original filename
   * @param metadata Additional metadata
   */
  async uploadFile(
    content: Buffer | string,
    filename: string,
    metadata?: any
  ): Promise<IPFSUploadResult> {
    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }
    
    try {
      const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
      
      // Add file to IPFS
      const result = await this.client.add({
        path: filename,
        content: buffer
      });

      const ipfsFile: IPFSFile = {
        hash: result.cid.toString(),
        path: result.path,
        size: result.size,
        type: this.getFileType(filename),
        uploadedAt: new Date(),
        metadata
      };

      // Store in upload history
      this.uploadHistory.set(result.cid.toString(), ipfsFile);

      // Pin file for persistence
      await this.pinFile(result.cid.toString());

      const ipfsUrl = this.getIPFSUrl(result.cid.toString());

      return {
        hash: result.cid.toString(),
        size: result.size,
        url: ipfsUrl
      };
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error(`Failed to upload file to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload JSON data to IPFS
   * @param data JSON data to upload
   * @param filename Optional filename
   */
  async uploadJSON(data: any, filename?: string): Promise<IPFSUploadResult> {
    const jsonString = JSON.stringify(data, null, 2);
    const name = filename || `data-${Date.now()}.json`;
    
    return this.uploadFile(jsonString, name, { type: 'json', ...data.metadata });
  }

  /**
   * Upload audit log entry to IPFS
   * @param auditEntry Audit log entry
   */
  async uploadAuditLog(auditEntry: any): Promise<IPFSUploadResult> {
    const auditData = {
      ...auditEntry,
      timestamp: new Date().toISOString(),
      version: '1.0',
      platform: 'NXD'
    };
    
    const filename = `audit-${auditEntry.id || Date.now()}.json`;
    return this.uploadJSON(auditData, filename);
  }

  /**
   * Upload domain content to IPFS
   * @param domainName Domain name
   * @param content Domain content (HTML, metadata, etc.)
   */
  async uploadDomainContent(
    domainName: string,
    content: {
      html?: string;
      metadata?: any;
      assets?: Buffer[];
    }
  ): Promise<IPFSUploadResult> {
    const domainData = {
      domain: domainName,
      content: content.html || '',
      metadata: content.metadata || {},
      uploadedAt: new Date().toISOString(),
      version: '1.0'
    };

    const filename = `${domainName.replace(/\./g, '-')}-content.json`;
    return this.uploadJSON(domainData, filename);
  }

  /**
   * Download file from IPFS
   * @param hash IPFS hash
   */
  async downloadFile(hash: string): Promise<Buffer> {
    try {
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of this.client.cat(hash)) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('IPFS download failed:', error);
      throw new Error(`Failed to download file from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download and parse JSON from IPFS
   * @param hash IPFS hash
   */
  async downloadJSON(hash: string): Promise<any> {
    const buffer = await this.downloadFile(hash);
    const jsonString = buffer.toString('utf-8');
    
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Invalid JSON content in IPFS file: ${hash}`);
    }
  }

  /**
   * Pin file to ensure persistence
   * @param hash IPFS hash to pin
   */
  async pinFile(hash: string): Promise<void> {
    try {
      await this.client.pin.add(hash);
      
      // If using cluster strategy, pin to multiple nodes
      if (this.pinningStrategy === 'cluster') {
        await this.pinToCluster(hash);
      }
    } catch (error) {
      console.error('IPFS pinning failed:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Unpin file to free up space
   * @param hash IPFS hash to unpin
   */
  async unpinFile(hash: string): Promise<void> {
    try {
      await this.client.pin.rm(hash);
    } catch (error) {
      console.error('IPFS unpinning failed:', error);
    }
  }

  /**
   * Pin file to multiple cluster nodes
   * @param hash IPFS hash
   */
  private async pinToCluster(hash: string): Promise<void> {
    const onlineNodes = Array.from(this.clusterNodes.values())
      .filter(node => node.status === 'online');
    
    const pinPromises = onlineNodes.map(async (node) => {
      try {
        const client = ipfsClient({ url: node.address, timeout: 10000 });
        await client.pin.add(hash);
      } catch (error) {
        console.error(`Failed to pin ${hash} to node ${node.id}:`, error);
      }
    });

    await Promise.allSettled(pinPromises);
  }

  /**
   * Get file information
   * @param hash IPFS hash
   */
  async getFileInfo(hash: string): Promise<IPFSFile | null> {
    // Check local history first
    const localFile = this.uploadHistory.get(hash);
    if (localFile) {
      return localFile;
    }

    // Try to get info from IPFS
    try {
      const stat = await this.client.files.stat(`/ipfs/${hash}`);
      
      return {
        hash,
        path: '',
        size: stat.size,
        type: 'unknown',
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to get IPFS file info:', error);
      return null;
    }
  }

  /**
   * List pinned files
   */
  async listPinnedFiles(): Promise<string[]> {
    try {
      const pinnedFiles: string[] = [];
      
      for await (const { cid } of this.client.pin.ls()) {
        pinnedFiles.push(cid.toString());
      }
      
      return pinnedFiles;
    } catch (error) {
      console.error('Failed to list pinned files:', error);
      return [];
    }
  }

  /**
   * Get cluster status
   */
  getClusterStatus(): IPFSClusterNode[] {
    return Array.from(this.clusterNodes.values());
  }

  /**
   * Get upload history
   */
  getUploadHistory(): IPFSFile[] {
    return Array.from(this.uploadHistory.values())
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  /**
   * Get IPFS gateway URL
   * @param hash IPFS hash
   */
  getIPFSUrl(hash: string): string {
    const gateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    return `${gateway}${hash}`;
  }

  /**
   * Verify file integrity
   * @param hash IPFS hash
   * @param expectedHash Expected hash for verification
   */
  async verifyFileIntegrity(hash: string, expectedHash?: string): Promise<boolean> {
    try {
      const content = await this.downloadFile(hash);
      
      if (expectedHash) {
        const actualHash = crypto.createHash('sha256').update(content).digest('hex');
        return actualHash === expectedHash;
      }
      
      // If no expected hash, just verify we can download
      return content.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Garbage collection - remove unpinned content
   */
  async garbageCollect(): Promise<void> {
    try {
      await this.client.repo.gc();
    } catch (error) {
      console.error('IPFS garbage collection failed:', error);
    }
  }

  /**
   * Get IPFS node info
   */
  async getNodeInfo(): Promise<any> {
    try {
      return await this.client.id();
    } catch (error) {
      console.error('Failed to get IPFS node info:', error);
      return null;
    }
  }

  /**
   * Get repository stats
   */
  async getRepoStats(): Promise<any> {
    try {
      return await this.client.repo.stat();
    } catch (error) {
      console.error('Failed to get IPFS repo stats:', error);
      return null;
    }
  }

  private getFileType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.json': 'application/json',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.md': 'text/markdown'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Cleanup - called on shutdown
   */
  async cleanup(): Promise<void> {
    try {
      // Perform any necessary cleanup
      await this.garbageCollect();
    } catch (error) {
      console.error('IPFS cleanup failed:', error);
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();