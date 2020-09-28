function hoge() {
  console.log('HOGE');
}

function foo() {
  console.log('FOO');
  console.log('BAR');
}

hoge();
setTimeout(() => hoge(), 50);
