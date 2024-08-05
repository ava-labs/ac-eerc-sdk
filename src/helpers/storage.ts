import msgpack from "tiny-msgpack";

export class IndexedDBStorage {
  private dbName = "LookupTableDB";
  private storeName = "lookupTable";
  private metaKey = "metadata";
  private prefix = "chunk_";

  async saveTable(table: Record<string, number>): Promise<void> {
    const encodedTable = msgpack.encode(table);
    const totalSize = encodedTable.byteLength;
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunksCount = Math.ceil(totalSize / chunkSize);

    const db = await this.openDB();
    const tx = db.transaction(this.storeName, "readwrite");
    const store = tx.objectStore(this.storeName);

    store.clear(); // Clear existing data

    // Save metadata
    store.put({
      key: this.metaKey,
      chunksCount,
      totalSize,
    });

    // Save chunks
    for (let i = 0; i < chunksCount; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, totalSize);
      const chunk = encodedTable.slice(start, end);
      store.put({ key: `${this.prefix}${i}`, data: chunk });
    }

    tx.commit();
  }

  async getTable(): Promise<Record<string, number> | null> {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, "readonly");
    const store = tx.objectStore(this.storeName);

    const metadata = await new Promise<{
      key: string;
      chunksCount: number;
      totalSize: number;
    }>((resolve, reject) => {
      const request = store.get(this.metaKey);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!metadata) return null;

    const chunks: Uint8Array[] = [];

    for (let i = 0; i < metadata.chunksCount; i++) {
      const chunk = await new Promise<{ key: string; data: Uint8Array }>(
        (resolve, reject) => {
          const request = store.get(`${this.prefix}${i}`);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        },
      );
      chunks.push(chunk.data);
    }

    const encodedTable = new Uint8Array(metadata.totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      encodedTable.set(chunk, offset);
      offset += chunk.byteLength;
    }

    if (encodedTable.byteLength !== metadata.totalSize) {
      console.error("Reconstructed data length doesn't match expected size");
      return null;
    }

    try {
      return msgpack.decode(encodedTable) as Record<string, number>;
    } catch (error) {
      console.error("Failed to decode table:", error);
      return null;
    }
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore(this.storeName, { keyPath: "key" });
      };
    });
  }
}
