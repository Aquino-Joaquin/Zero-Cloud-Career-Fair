// @tgwf/co2 (CO2.js) no incluye tipos: declaramos solo lo que usamos.
declare module '@tgwf/co2' {
  export class co2 {
    constructor(options?: { model?: 'swd' | '1byte'; version?: 3 | 4; results?: 'segment' })
    perByte(bytes: number, green?: boolean): number
    perVisit(bytes: number, green?: boolean): number
  }
}
