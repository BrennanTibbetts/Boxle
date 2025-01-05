class ResourceManager {
  static instance
  resources
  loadingPromises

  constructor() {
    this.resources = new Map()
    this.loadingPromises = new Map()
  }

  static getInstance() {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager()
    }
    return ResourceManager.instance
  }

  // Add a resource with reference counting
  async add(id, resource, type, options = { disposeOnRemove: true, asyncLoad: false }) {
    if (this.resources.has(id)) {
      this.resources.get(id).refCount++
      return
    }

    const resourceData = {
      type,
      data: resource,
      refCount: 1,
      options
    }

    if (options.asyncLoad) {
      const loadingPromise = new Promise((resolve) => {
        // Simulate async loading - replace with actual async loading logic
        setTimeout(() => {
          this.resources.set(id, resourceData)
          resolve(resourceData)
        }, 100)
      })
      this.loadingPromises.set(id, loadingPromise)
      await loadingPromise
    } else {
      this.resources.set(id, resourceData)
    }
  }

  // Get a resource and increment its reference count
  get(id) {
    const resource = this.resources.get(id)
    if (!resource) {
      return null
    }
    resource.refCount++
    return resource.data
  }

  // Get a resource without incrementing reference count
  peek(id) {
    const resource = this.resources.get(id)
    return resource ? resource.data : null
  }

  // Remove a reference to a resource
  remove(id) {
    const resource = this.resources.get(id)
    if (!resource) return

    resource.refCount--
    if (resource.refCount <= 0 && resource.options.disposeOnRemove) {
      this.dispose(id)
    }
  }

  // Explicitly dispose of a resource
  dispose(id) {
    const resource = this.resources.get(id)
    if (!resource) return

    switch (resource.type) {
      case 'geometry':
        resource.data.dispose()
        break
      case 'material':
        resource.data.dispose()
        break
      case 'texture':
        resource.data.dispose()
        break
      case 'mesh':
        { 
          const mesh = resource.data
          if (mesh.geometry) mesh.geometry.dispose()
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose())
            } else {
              mesh.material.dispose()
            }
          }
          break 
        }
    }

    this.resources.delete(id)
    this.loadingPromises.delete(id)
  }

  // Get loading status of a resource
  isLoading(id) {
    return this.loadingPromises.has(id)
  }

  // Wait for a resource to finish loading
  async waitForResource(id) {
    const loadingPromise = this.loadingPromises.get(id)
    if (loadingPromise) {
      return await loadingPromise
    }
    return this.resources.get(id) || null
  }

  // Clear all resources
  clear() {
    for (const id of this.resources.keys()) {
      this.dispose(id)
    }
  }

  // Get resource statistics
  getStats() {
    return {
      totalResources: this.resources.size,
      loadingResources: this.loadingPromises.size
    }
  }
}

export default ResourceManager
