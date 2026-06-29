import { MATERIAL_KINDS, MATERIAL_META } from './config'
import type { InventoryState } from './types'

export function MaterialRow({ inventory }: { inventory: InventoryState }) {
  return <div className="material-row">
    {MATERIAL_KINDS.map((kind) => (
      <span className="material-count" key={kind}>
        <i style={{ background: MATERIAL_META[kind].css }}>{MATERIAL_META[kind].short}</i>
        <b>{inventory[kind]}</b>
      </span>
    ))}
  </div>
}
