import type { ListURI } from "../Modules"
import type { URI } from "../Prelude"
import * as P from "../Prelude"
import * as L from "./operations"

export const Any = P.instance<P.Any<URI<ListURI>>>({
  any: () => L.of({})
})

export const AssociativeBoth = P.instance<P.AssociativeBoth<URI<ListURI>>>({
  both: L.zip
})

export const AssociativeFlatten = P.instance<P.AssociativeFlatten<URI<ListURI>>>({
  flatten: L.flatten
})

export const Covariant = P.instance<P.Covariant<URI<ListURI>>>({
  map: L.map
})

export const Applicative = P.instance<P.Applicative<URI<ListURI>>>({
  ...Any,
  ...Covariant,
  ...AssociativeBoth
})

export const Monad = P.instance<P.Monad<URI<ListURI>>>({
  ...Any,
  ...Covariant,
  ...AssociativeFlatten
})

export const ForEach = P.instance<P.ForEach<URI<ListURI>>>({
  map: L.map,
  forEachF: L.forEachF
})

export const Wiltable = P.instance<P.Wiltable<URI<ListURI>>>({
  separateF: L.separateF
})

export const Witherable = P.instance<P.Witherable<URI<ListURI>>>({
  compactF: L.compactF
})

export const Compact = P.instance<P.Compact<URI<ListURI>>>({
  compact: L.compact
})

export const Separate = P.instance<P.Separate<URI<ListURI>>>({
  separate: L.separate
})

export const Reduce = P.instance<P.Reduce<URI<ListURI>>>({
  reduce: L.reduce
})

export const ReduceRight = P.instance<P.ReduceRight<URI<ListURI>>>({
  reduceRight: L.reduceRight
})

export const FoldMap = P.instance<P.FoldMap<URI<ListURI>>>({
  foldMap: L.foldMap
})

export const Foldable = P.instance<P.Foldable<URI<ListURI>>>({
  ...FoldMap,
  ...Reduce,
  ...ReduceRight
})

export const Filter = P.instance<P.Filter<URI<ListURI>>>({
  filter: L.filter
})

export const FilterMap = P.instance<P.FilterMap<URI<ListURI>>>({
  filterMap: L.filterMap
})

export const Partition = P.instance<P.Partition<URI<ListURI>>>({
  partition: L.partition
})

export const PartitionMap = P.instance<P.PartitionMap<URI<ListURI>>>({
  partitionMap: L.partitionMap
})

export const Filterable = P.instance<P.Filterable<URI<ListURI>>>({
  ...Filter,
  ...FilterMap,
  ...Partition,
  ...PartitionMap
})
