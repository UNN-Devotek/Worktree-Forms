'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';

interface NewsArticle {
    articleId: string;
    title: string;
    content: string;
    publishedAt: string;
}

interface NewsCarouselProps {
    articles: NewsArticle[];
    isLoading: boolean;
}

export function NewsCarousel({ articles, isLoading }: NewsCarouselProps) {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);

    const next = useCallback(() => {
        if (articles.length === 0) return;
        setCurrent((prev) => (prev + 1) % articles.length);
    }, [articles.length]);

    const prev = useCallback(() => {
        if (articles.length === 0) return;
        setCurrent((prev) => (prev - 1 + articles.length) % articles.length);
    }, [articles.length]);

    useEffect(() => {
        if (paused || articles.length <= 1) return;
        const timer = setInterval(next, 8000);
        return () => clearInterval(timer);
    }, [paused, next, articles.length]);

    const article = articles[current];

    return (
        <Card
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <Newspaper className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">News</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                        <div className="h-16 w-full bg-muted animate-pulse rounded" />
                    </div>
                ) : articles.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        No news articles available.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <div className="min-h-[120px]">
                            <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-sm">{article.title}</h4>
                                <Badge variant="secondary" className="text-xs shrink-0">
                                    {new Date(article.publishedAt).toLocaleDateString()}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {article.content.length > 120
                                    ? `${article.content.slice(0, 120)}...`
                                    : article.content}
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                                {articles.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setCurrent(i)}
                                        className={`h-1.5 rounded-full transition-all ${
                                            i === current ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                                        }`}
                                        aria-label={`Go to slide ${i + 1}`}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prev}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={next}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
