/**
 * NocoDB API Service
 * 
 * Provides a clean interface to interact with NocoDB tables for spreadsheet data.
 * Uses the NocoDB REST API v1 for CRUD operations.
 */

import axios, { AxiosInstance } from 'axios';

const NOCODB_URL = process.env.NOCODB_INTERNAL_URL || process.env.NOCODB_PUBLIC_URL || 'http://localhost:8080';
const API_TOKEN = () => process.env.NOCODB_API_TOKEN;

// Types for NocoDB responses
export interface NocoDBAttachment {
  url: string;
  title: string;
  mimetype: string;
  size: number;
}

interface NocoDBProject {
  id: string;
  title: string;
}

interface NocoDBTable {
  id: string;
  title: string;
  table_name: string;
}

interface NocoDBResponse<T> {
  list?: T[];
  pageInfo?: {
    totalRows?: number;
    page?: number;
    pageSize?: number;
  };
}

// Sheet types matching our NocoDB schema
export interface NocoDBSheet {
  id?: number;
  name: string;
  project_id: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

export interface NocoDBSheetCell {
  id?: number;
  sheet_id: string;
  row: number;
  col: number;
  value?: string;
  type?: 'text' | 'number' | 'formula' | 'image' | 'attachment';
  images?: any; // NocoDB attachment field
  files?: any;  // NocoDB attachment field
  formula?: string;
  style?: string; // JSON string
}

class NocoDBService {
  private client: AxiosInstance;
  private projectId: string | null = null;
  private sheetsTableId: string | null = null;
  private cellsTableId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: NOCODB_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Initialize the service by fetching project and table IDs
   */
  async initialize(): Promise<void> {
    const token = API_TOKEN();
    if (!token) {
      throw new Error('NOCODB_API_TOKEN is not configured in environment variables');
    }

    // Update client headers with token
    this.client.defaults.headers['xc-token'] = token;

    if (this.projectId && this.sheetsTableId && this.cellsTableId) {
      return; // Already initialized
    }

    try {
      // Get the first project (we created one in setup)
      const projectsResponse = await this.client.get<NocoDBResponse<NocoDBProject>>(
        '/api/v1/db/meta/projects'
      );

      if (!projectsResponse.data.list || projectsResponse.data.list.length === 0) {
        throw new Error('No NocoDB project found. Run setup-nocodb.js first.');
      }

      this.projectId = projectsResponse.data.list[0].id;

      // Get tables for this project
      const tablesResponse = await this.client.get<NocoDBResponse<NocoDBTable>>(
        `/api/v1/db/meta/projects/${this.projectId}/tables`
      );

      const sheetsTable = tablesResponse.data.list?.find(
        (t) => t.table_name === 'sheets' || t.title === 'sheets'
      );
      const cellsTable = tablesResponse.data.list?.find(
        (t) => t.table_name === 'sheet_cells' || t.title === 'sheet_cells'
      );

      if (!sheetsTable || !cellsTable) {
        throw new Error('Required tables not found. Run setup-nocodb.js first.');
      }

      this.sheetsTableId = sheetsTable.id;
      this.cellsTableId = cellsTable.id;

      console.log('[NocoDB] Initialized:', {
        projectId: this.projectId,
        sheetsTableId: this.sheetsTableId,
        cellsTableId: this.cellsTableId,
      });
    } catch (error) {
      console.error('[NocoDB] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a new sheet
   */
  async createSheet(data: NocoDBSheet): Promise<NocoDBSheet> {
    await this.initialize();

    const response = await this.client.post(
      `/api/v1/db/data/noco/${this.projectId}/${this.sheetsTableId}`,
      data
    );

    return response.data;
  }

  /**
   * Get all sheets for a project
   */
  async getSheetsByProject(projectId: string): Promise<NocoDBSheet[]> {
    await this.initialize();

    const response = await this.client.get<NocoDBResponse<NocoDBSheet>>(
      `/api/v1/db/data/noco/${this.projectId}/${this.sheetsTableId}`,
      {
        params: {
          where: `(project_id,eq,${projectId})`,
          sort: '-created_at',
        },
      }
    );

    return response.data.list || [];
  }

  /**
   * Get a single sheet by ID
   */
  async getSheet(sheetId: number): Promise<NocoDBSheet | null> {
    await this.initialize();

    try {
      const response = await this.client.get(
        `/api/v1/db/data/noco/${this.projectId}/${this.sheetsTableId}/${sheetId}`
      );
      return response.data;
    } catch (error) {
      console.error('[NocoDB] Failed to get sheet:', error);
      return null;
    }
  }

  /**
   * Get a sheet by slug
   */
  async getSheetBySlug(slug: string): Promise<NocoDBSheet | null> {
    await this.initialize();

    const response = await this.client.get<NocoDBResponse<NocoDBSheet>>(
      `/api/v1/db/data/noco/${this.projectId}/${this.sheetsTableId}`,
      {
        params: {
          where: `(slug,eq,${slug})`,
          limit: 1,
        },
      }
    );

    return response.data.list?.[0] || null;
  }

  /**
   * Update a sheet
   */
  async updateSheet(sheetId: number, data: Partial<NocoDBSheet>): Promise<NocoDBSheet> {
    await this.initialize();

    const response = await this.client.patch(
      `/api/v1/db/data/noco/${this.projectId}/${this.sheetsTableId}/${sheetId}`,
      data
    );

    return response.data;
  }

  /**
   * Delete a sheet
   */
  async deleteSheet(sheetId: number): Promise<void> {
    await this.initialize();

    await this.client.delete(
      `/api/v1/db/data/noco/${this.projectId}/${this.sheetsTableId}/${sheetId}`
    );
  }

  /**
   * Create a cell
   */
  async createCell(data: NocoDBSheetCell): Promise<NocoDBSheetCell> {
    await this.initialize();

    const response = await this.client.post(
      `/api/v1/db/data/noco/${this.projectId}/${this.cellsTableId}`,
      data
    );

    return response.data;
  }

  /**
   * Get all cells for a sheet
   */
  async getCellsBySheet(sheetId: string): Promise<NocoDBSheetCell[]> {
    await this.initialize();

    const response = await this.client.get<NocoDBResponse<NocoDBSheetCell>>(
      `/api/v1/db/data/noco/${this.projectId}/${this.cellsTableId}`,
      {
        params: {
          where: `(sheet_id,eq,${sheetId})`,
          limit: 10000, // Get all cells for the sheet
        },
      }
    );

    return response.data.list || [];
  }

  /**
   * Update a cell
   */
  async updateCell(cellId: number, data: Partial<NocoDBSheetCell>): Promise<NocoDBSheetCell> {
    await this.initialize();

    const response = await this.client.patch(
      `/api/v1/db/data/noco/${this.projectId}/${this.cellsTableId}/${cellId}`,
      data
    );

    return response.data;
  }

  /**
   * Delete a cell
   */
  async deleteCell(cellId: number): Promise<void> {
    await this.initialize();

    await this.client.delete(
      `/api/v1/db/data/noco/${this.projectId}/${this.cellsTableId}/${cellId}`
    );
  }

  /**
   * Create a new table dynamically
   */
  async createTable(title: string, columns: any[], uniqueId?: string): Promise<NocoDBTable> {
    await this.initialize();
    
    // NocoDB meta API for table creation
    // Use uniqueId for table_name to ensure uniqueness at the DB level
    const internalName = uniqueId 
      ? `sheet_${uniqueId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      : title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substring(2, 7);

    const response = await this.client.post<NocoDBTable>(
      `/api/v1/db/meta/projects/${this.projectId}/tables`,
      {
        table_name: internalName,
        title: title,
        columns: columns
      }
    );
    
    return response.data;
  }

  /**
   * Get views for a table
   */
  async getViews(tableId: string): Promise<any[]> {
    await this.initialize();
    
    const response = await this.client.get<NocoDBResponse<any>>(
      `/api/v1/db/meta/tables/${tableId}/views`
    );
    
    return response.data.list || [];
  }

  /**
   * Enable sharing for a view and get the share ID
   */
  async shareView(viewId: string): Promise<string> {
    await this.initialize();
    
    // Create or get a share link
    // NocoDB v1 uses /share for this operation
    const response = await this.client.post(
      `/api/v1/db/meta/views/${viewId}/share`,
      {
         password: null,
         show_as: 'grid'
      }
    );
    
    // NocoDB returns either a uuid or the id of the share
    return response.data.uuid || response.data.id || viewId;
  }

  /**
   * Batch upsert cells for a sheet
   * Deletes existing cells and creates new ones
   */
  async replaceCells(sheetId: string, cells: NocoDBSheetCell[]): Promise<void> {
    await this.initialize();

    // Delete existing cells for this sheet
    const existingCells = await this.getCellsBySheet(sheetId);
    await Promise.all(
      existingCells.map((cell) => cell.id && this.deleteCell(cell.id))
    );

    // Create new cells
    await Promise.all(
      cells.map((cell) => this.createCell({ ...cell, sheet_id: sheetId }))
    );
  }
  /**
   * Upload a file to NocoDB storage
   * Returns the attachment object
   */
  async uploadFile(file: FormData): Promise<NocoDBAttachment[]> {
    await this.initialize();
    
    // Use the storage/upload endpoint
    // Note: NocoDB expects 'file' field in FormData
    const response = await this.client.post<NocoDBAttachment[]>(
      `/api/v1/db/storage/upload`,
      file,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }
}

// Export a singleton instance
export const nocoDBService = new NocoDBService();
