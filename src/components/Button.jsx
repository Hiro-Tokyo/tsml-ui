import React from 'react';
import cx from 'classnames/bind';

import Icon from './Icon';

export default function Button({
  href,
  icon,
  text,
  className = [],
  block = true,
}) {
  return (
    <a
      className={cx(
        'btn btn-outline-secondary d-flex align-items-center justify-content-center',
        { 'btn-block': block },
        className
      )}
      href={href}
      target="_blank"
    >
      {icon && <Icon icon={icon} className="mr-2" />}
      {text}
    </a>
  );
}
