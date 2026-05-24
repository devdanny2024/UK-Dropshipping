import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';

const POSTS = [
  {
    slug: 'how-uk2me-works',
    title: 'How UK2ME Works: Shop UK, Delivered to Nigeria',
    excerpt:
      'A complete walkthrough of how UK2ME purchases items from UK retailers, consolidates them at our warehouse, and ships them to your door in Nigeria — fully tracked.',
    date: '2026-05-20',
    category: 'Guide',
    readTime: '5 min'
  },
  {
    slug: 'best-uk-stores-for-nigerians',
    title: '10 Best UK Stores Nigerians Are Shopping Right Now',
    excerpt:
      'From ASOS to Amazon UK, we break down the top UK online stores our customers love — and tips for getting the best deals on each one.',
    date: '2026-05-15',
    category: 'Shopping Tips',
    readTime: '7 min'
  },
  {
    slug: 'understanding-customs-nigeria',
    title: 'Understanding Nigerian Customs: What You Need to Know',
    excerpt:
      'A plain-English guide to Nigerian import duties, prohibited items, and how UK2ME handles customs clearance so you don\'t have to worry.',
    date: '2026-05-10',
    category: 'Customs & Shipping',
    readTime: '6 min'
  },
  {
    slug: 'size-guide-uk-vs-nigeria',
    title: 'UK vs Nigerian Sizing: The Ultimate Conversion Guide',
    excerpt:
      'Confused about UK clothing sizes? This guide covers clothes, shoes, and accessories — so your order arrives fitting perfectly the first time.',
    date: '2026-05-05',
    category: 'Shopping Tips',
    readTime: '4 min'
  },
  {
    slug: 'track-your-order',
    title: 'How to Track Your Order at Every Stage',
    excerpt:
      'From purchase confirmation to delivery at your door, here\'s exactly how to use the UK2ME tracking system to follow both shipping legs in real time.',
    date: '2026-04-28',
    category: 'Guide',
    readTime: '3 min'
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3">Blog</h1>
          <p className="text-muted-foreground text-lg">
            Shopping guides, tips, and updates from the UK2ME team.
          </p>
        </div>

        <div className="space-y-6">
          {POSTS.map((post) => (
            <Card key={post.slug} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-xs text-muted-foreground">{post.readTime} read</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">{post.excerpt}</p>
                <p className="mt-3 text-sm font-medium text-primary">Read more →</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>More articles coming soon. Follow us on social media for updates.</p>
        </div>
      </div>
    </div>
  );
}
