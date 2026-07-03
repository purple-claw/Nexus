import { describe, it, expect, beforeEach, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

describe('config', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    delete process.env.JWT_SECRET
    delete process.env.NODE_ENV
    delete process.env.DATABASE_URL
    delete process.env.PORT
  })

  async function loadConfig() {
    vi.resetModules()
    return import('../config').then(m => m.config)
  }

  it('exits when JWT_SECRET is missing in production', async () => {
    process.env.NODE_ENV = 'production'
    const exitMock = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    vi.resetModules()
    await import('../config')
    expect(exitMock).toHaveBeenCalledWith(1)
    exitMock.mockRestore()
  })

  it('uses defaults when env vars are not set', async () => {
    process.env.JWT_SECRET = 'test-secret'
    const cfg = await loadConfig()
    expect(cfg.port).toBe(8080)
    expect(cfg.jwtSecret).toBe('test-secret')
    expect(cfg.databaseUrl).toBeNull()
  })

  it('reads DATABASE_URL', async () => {
    process.env.JWT_SECRET = 'test-secret'
    process.env.DATABASE_URL = 'postgres://localhost:5432/nexus'
    const cfg = await loadConfig()
    expect(cfg.databaseUrl).toBe('postgres://localhost:5432/nexus')
  })

  it('reads PORT from env', async () => {
    process.env.JWT_SECRET = 'test-secret'
    process.env.PORT = '4000'
    const cfg = await loadConfig()
    expect(cfg.port).toBe(4000)
  })
})
