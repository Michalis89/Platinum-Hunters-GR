const React = require('react');

const icon = name =>
  React.forwardRef(function MockLucideIcon(props, ref) {
    return React.createElement('svg', { ref, 'data-icon': name, ...props });
  });

module.exports = new Proxy(
  {},
  {
    get: (_, prop) => {
      if (prop === '__esModule') {
        return true;
      }
      return icon(String(prop));
    },
  },
);
