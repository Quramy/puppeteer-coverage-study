async function add(a: number, b: number) {
  return a + b;
}

function sub(a: number, b: number) {
  return a - b;
}

console.log(add(1, 2));
setTimeout(() => console.log(add(2, 3)), 10);
