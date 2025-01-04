import * as THREE from 'three';

interface ResourceOptions {
  disposeOnRemove?: boolean;
  asyncLoad?: boolean;
}

type ResourceType = 'geometry' | 'material' | 'texture' | 'mesh';

interface Resource {
  type: ResourceType;
  data: THREE.BufferGeometry | THREE.Material | THREE.Texture | THREE.Mesh;
  refCount: number;
  options: ResourceOptions;
}

class ResourceManager {
  private static instance: ResourceManager;
  private resources: Map<string, Resource>;
  private loadingPromises: Map<string, Promise<Resource>>;

  private constructor() {
    this.resources = new Map();
    this.loadingPromises = new Map();
  }

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  // Add a resource with reference counting
  async add<T extends THREE.BufferGeometry | THREE.Material | THREE.Texture | THREE.Mesh>(
    id: string,
    resource: T,
    type: ResourceType,
    options: ResourceOptions = { disposeOnRemove: true, asyncLoad: false }
  ): Promise<void> {
    if (this.resources.has(id)) {
      this.resources.get(id)!.refCount++;
      return;
    }

    const resourceData: Resource = {
      type,
      data: resource,
      refCount: 1,
      options
    };

    if (options.asyncLoad) {
      const loadingPromise = new Promise<Resource>((resolve) => {
        // Simulate async loading - replace with actual async loading logic
        setTimeout(() => {
          this.resources.set(id, resourceData);
          resolve(resourceData);
        }, 100);
      });
      this.loadingPromises.set(id, loadingPromise);
      await loadingPromise;
    } else {
      this.resources.set(id, resourceData);
    }
  }

  // Get a resource and increment its reference count
  get<T extends THREE.BufferGeometry | THREE.Material | THREE.Texture | THREE.Mesh>(
    id: string
  ): T | null {
    const resource = this.resources.get(id);
    if (!resource) {
      return null;
    }
    resource.refCount++;
    return resource.data as T;
  }

  // Get a resource without incrementing reference count
  peek<T extends THREE.BufferGeometry | THREE.Material | THREE.Texture | THREE.Mesh>(
    id: string
  ): T | null {
    const resource = this.resources.get(id);
    return resource ? (resource.data as T) : null;
  }

  // Remove a reference to a resource
  remove(id: string): void {
    const resource = this.resources.get(id);
    if (!resource) return;

    resource.refCount--;
    if (resource.refCount <= 0 && resource.options.disposeOnRemove) {
      this.dispose(id);
    }
  }

  // Explicitly dispose of a resource
  dispose(id: string): void {
    const resource = this.resources.get(id);
    if (!resource) return;

    switch (resource.type) {
      case 'geometry':
        (resource.data as THREE.BufferGeometry).dispose();
        break;
      case 'material':
        (resource.data as THREE.Material).dispose();
        break;
      case 'texture':
        (resource.data as THREE.Texture).dispose();
        break;
      case 'mesh':
        const mesh = resource.data as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
        break;
    }

    this.resources.delete(id);
    this.loadingPromises.delete(id);
  }

  // Get loading status of a resource
  isLoading(id: string): boolean {
    return this.loadingPromises.has(id);
  }

  // Wait for a resource to finish loading
  async waitForResource(id: string): Promise<Resource | null> {
    const loadingPromise = this.loadingPromises.get(id);
    if (loadingPromise) {
      return await loadingPromise;
    }
    return this.resources.get(id) || null;
  }

  // Clear all resources
  clear(): void {
    for (const id of this.resources.keys()) {
      this.dispose(id);
    }
  }

  // Get resource statistics
  getStats(): { totalResources: number; loadingResources: number } {
    return {
      totalResources: this.resources.size,
      loadingResources: this.loadingPromises.size
    };
  }
}

export default ResourceManager;