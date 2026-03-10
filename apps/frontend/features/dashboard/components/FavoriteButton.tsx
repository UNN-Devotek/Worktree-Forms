'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
    isFavorited: boolean;
    onToggle: () => void;
}

export function FavoriteButton({ isFavorited, onToggle }: FavoriteButtonProps) {
    return (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={cn(
                'inline-flex items-center justify-center rounded-md p-1 transition-colors hover:bg-accent',
                isFavorited ? 'text-yellow-500' : 'text-muted-foreground'
            )}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Star className={cn('h-4 w-4', isFavorited && 'fill-current')} />
        </button>
    );
}
