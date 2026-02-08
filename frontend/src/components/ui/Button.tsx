import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    className,
    ...props
}) => {
    return (
        <button
            className={clsx(
                'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                variant === 'primary' && 'bg-app-primary text-white hover:bg-app-primary-hover',
                variant === 'secondary' && 'bg-app-surface-hover border border-app-border text-app-text hover:bg-app-border',
                variant === 'ghost' && 'text-app-text-muted hover:text-app-text hover:bg-app-surface-hover',
                variant === 'danger' && 'bg-app-error text-white hover:opacity-90',
                className
            )}
            {...props}
        />
    );
};
