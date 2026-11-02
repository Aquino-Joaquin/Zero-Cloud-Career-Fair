import type { IncomingMessage, ServerResponse } from 'node:http'

export function loadDataset(): Promise<unknown>
export function handleApi(req: IncomingMessage, res: ServerResponse, next?: () => void): Promise<void>
