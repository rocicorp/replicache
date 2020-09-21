const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

suite
  .add('some test case', () => {
    'Hello world!'.indexOf('o') !== -1;
  })
  .on('cycle', event => {
    // Output benchmark result by converting benchmark result to string
    console.log(String(event.target));
  })
  .run();
