'use client';

import React, { useEffect, useState } from 'react';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

export function HelpArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ category?: string; status?: string }>({});

  useEffect(() => {
    loadArticles();
  }, [filter]);

  const loadArticles = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.status) params.append('status', filter.status);

      const response = await fetch(`/api/help/articles?${params}`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.articles);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const response = await fetch(`/api/help/articles/${id}/publish`, {
        method: 'POST',
      });

      if (response.ok) {
        loadArticles();
      }
    } catch (error) {
      console.error('Failed to publish article:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading articles...</div>;
  }

  return (
    <div className="help-article-list">
      <div className="list-header">
        <h2>Help Articles</h2>
        <button className="btn btn-primary">New Article</button>
      </div>

      <div className="filters">
        <select
          value={filter.status || ''}
          onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>

        <select
          value={filter.category || ''}
          onChange={(e) => setFilter({ ...filter, category: e.target.value || undefined })}
        >
          <option value="">All Categories</option>
          <option value="General">General</option>
          <option value="Equipment">Equipment</option>
          <option value="Safety">Safety</option>
          <option value="Procedures">Procedures</option>
        </select>
      </div>

      <div className="articles-grid">
        {articles.map((article) => (
          <div key={article.id} className="article-card">
            <div className="article-header">
              <h3>{article.title}</h3>
              <span className={`status-badge ${article.status}`}>
                {article.status}
              </span>
            </div>

            <div className="article-meta">
              <span className="category">{article.category}</span>
              <span className="author">by {article.author.name || article.author.email}</span>
            </div>

            <div className="article-dates">
              <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
            </div>

            <div className="article-actions">
              <button className="btn btn-sm">Edit</button>
              {article.status === 'draft' && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handlePublish(article.id)}
                >
                  Publish
                </button>
              )}
              <button className="btn btn-sm">View History</button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .help-article-list {
          padding: 2rem;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .list-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .filters select {
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
        }

        .articles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .article-card {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          background: white;
          transition: box-shadow 0.2s;
        }

        .article-card:hover {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        .article-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 1rem;
        }

        .article-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.draft {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-badge.published {
          background-color: #d1fae5;
          color: #065f46;
        }

        .article-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .category {
          font-weight: 500;
          color: #3b82f6;
        }

        .article-dates {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 1rem;
        }

        .article-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid #e5e7eb;
          background: white;
        }

        .btn:hover {
          background-color: #f9fafb;
        }

        .btn-sm {
          padding: 0.25rem 0.75rem;
          font-size: 0.875rem;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .btn-primary:hover {
          background-color: #2563eb;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
