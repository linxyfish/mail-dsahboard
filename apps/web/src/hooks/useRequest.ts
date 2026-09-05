import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

interface Options<T> { defaultData?: T; manual?: boolean }
export function useRequest<T, P = void>(request: (params: P, signal: AbortSignal) => Promise<T>, deps: DependencyList = [], options: Options<T> = {}) {
  const [data, setData] = useState<T | undefined>(options.defaultData); const [loading, setLoading] = useState(false); const [error, setError] = useState<Error | null>(null); const controller = useRef<AbortController>()
  const run = useCallback(async (params: P) => { controller.current?.abort(); controller.current = new AbortController(); setLoading(true); setError(null); try { const result = await request(params, controller.current.signal); setData(result); return result } catch (reason) { if ((reason as Error).name !== 'CanceledError') setError(reason as Error); throw reason } finally { setLoading(false) } }, deps)
  const refresh = useCallback(() => run(undefined as P), [run])
  useEffect(() => { if (!options.manual) void run(undefined as P); return () => controller.current?.abort() }, [run, options.manual])
  return { data, loading, error, run, refresh }
}
