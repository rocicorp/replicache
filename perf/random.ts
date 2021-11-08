export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * i);

    // And swap it with the current element.
    const valAtI = arr[i];
    arr[i] = arr[randomIndex];
    arr[randomIndex] = valAtI;
  }

  return arr;
}

export function sample<T>(population: T[], sampleSize: number): T[] {
  if (sampleSize > population.length) {
    throw new Error(
      'sampleSize must not be larger than population size. ' +
        `sampleSize=${sampleSize}, population.length=${population.length}`,
    );
  }
  return shuffle([...population]).slice(0, sampleSize);
}
