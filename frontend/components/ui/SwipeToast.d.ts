import React from 'react';

export interface SwipeToastProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  open?: boolean;
  onClose?: (reason: string) => void;
  background?: string;
  color?: string;
  fuseColor?: string;
  width?: number;
  radius?: number;
  slideMs?: number;
  settleBounce?: number;
  swipeDistance?: number;
  duration?: number;
  fuse?: 'bottom' | 'top' | 'none';
  pauseOnHover?: boolean;
  closeButton?: boolean;
  inline?: boolean;
  dismissible?: boolean;
  className?: string;
}

declare const SwipeToast: React.FC<SwipeToastProps>;
export default SwipeToast;
