import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
}

export function getStatusBadge(status: string) {
  const statusMap: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    healthy: { variant: 'success', label: 'Healthy' },
    sick: { variant: 'danger', label: 'Sick' },
    quarantine: { variant: 'warning', label: 'Quarantine' },
    deceased: { variant: 'default', label: 'Deceased' },
    completed: { variant: 'success', label: 'Completed' },
    ongoing: { variant: 'info', label: 'Ongoing' },
    scheduled: { variant: 'warning', label: 'Scheduled' },
    pending: { variant: 'warning', label: 'Pending' },
    delivered: { variant: 'success', label: 'Delivered' },
    'in-transit': { variant: 'info', label: 'In Transit' },
  };

  const config = statusMap[status.toLowerCase()] || { variant: 'default', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
