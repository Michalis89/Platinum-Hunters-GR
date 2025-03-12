module.exports = new Proxy(
  {},
  {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get: (target, name) => () => null,
  }
);
