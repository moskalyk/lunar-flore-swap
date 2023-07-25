# lunar-flore-swap
What does it mean to layer foundational primitives of the humanly cycles of the night, with that of the moon as a layer on top of price deviations for coin to coin swaps.

For example, could you build a USDC:FLORE token swap as a price claim that fluctuates 5% with 29.5 day cycles to accomodate human behaviour.

note: bug with evm, no cos or sin therefore use off-chain pricing oracle for numeric alchemical accuracy

## tests
1. return the price from using (new moon timestamp -> Date.now())

### server benchmarks
- go: 38s for 65000
- rust: 60s for 65000
- js: 265s for 65000

TODO: create agnostic blockchain network connector
