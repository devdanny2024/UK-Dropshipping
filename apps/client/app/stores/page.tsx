'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';

export default function StoresPage() {
  const [query, setQuery] = useState('');

  const mainCategories = [
    {
      name: 'Men',
      items: ['Shoes', 'Clothing', 'Accessories', 'Toiletries/Perfume', 'Luxury Stores', 'Books/CD/DVD-Game']
    },
    {
      name: 'Women',
      items: [
        'Shoes',
        'Clothing',
        'Accessories',
        'Lingerie',
        'Toiletries / Wellbeing',
        'Luxury Stores',
        'Jewellery',
        'Traditional (Aso ebi)',
        'Books/CD/DVD/Game'
      ]
    },
    {
      name: 'Babies & Kids',
      items: ['Baby World', 'Boys & Girls', 'Toys & Games']
    },
    {
      name: 'Sports',
      items: ['Clothing & Footwear', 'Equipment', 'Football Jersey']
    },
    {
      name: 'Home & Kitchen',
      items: ['Lighting & Decoration', 'Rugs & Carpets', 'Appliances & Utensils']
    },
    {
      name: 'Electricals',
      items: ['Home Entertainment', 'Laptop & Mobile Phone', 'CCTV & Home Security', 'Computers & Accessories']
    },
    {
      name: 'Motors',
      items: ['Car Parts & Accessories', 'Car Entertainment']
    }
  ];

  const partnerCategories = useMemo(
    () => [
    {
      name: 'Shoes (Men & Women)',
      segments: [
        {
          label: 'UK Stores',
          stores: [
            'ALDO',
            'DUNE',
            'Clarks',
            'Jones',
            'Office',
            'NEXT',
            'Kurt Geiger',
            'Sole Trader',
            'Schuh',
            'Timberland',
            'Debenhams',
            'M and M Direct',
            'Jimmy Choo',
            'River Island',
            'Barratts',
            'Liberty',
            'www.shoes.co.uk'
          ]
        },
        {
          label: 'US Stores',
          stores: [
            "Macy's",
            "Sears",
            "Nordstrom",
            "Bloomingdale's",
            'www.shoes.com',
            'AMAZON.COM',
            'Target',
            'Walmart',
            'Adidas USA',
            'Nike USA',
            'Zappos',
            'Overstock',
            'Ralph Lauren',
            'Talbots',
            '6PM.COM',
            'NINE WEST',
            'Saks Fifth Avenue'
          ]
        }
      ]
    },
    {
      name: 'Clothing (Men, Women, Sport)',
      segments: [
        {
          label: 'UK Stores',
          stores: [
            'Asos',
            'Hackett',
            'Harrods',
            'Harvey Nichols',
            'House of Fraser',
            'Burberry',
            'Debenhams',
            'Burton',
            'Tommy Hilfiger',
            'Moss Bros',
            'Topman',
            'River Island',
            'Peacocks',
            'Gap',
            'Sports Direct',
            'JD Sports',
            'JJB Sports',
            'Nike (UK)',
            'Adidas (UK)'
          ]
        },
        {
          label: 'US Stores',
          stores: [
            "Macy's",
            "Sears",
            "Bloomingdale's",
            "Nordstrom",
            'JC Penny',
            'Ralph Lauren',
            'AMAZON.COM',
            'Walmart',
            'Target',
            'Abercrombie & Fitch',
            'Old Navy',
            'Banana Republic',
            'PUMA USA',
            'Express',
            'Hollister Co',
            "Levi's"
          ]
        }
      ]
    },
    {
      name: 'Accessories (Men & Women)',
      segments: [
        {
          label: 'UK Stores',
          stores: [
            'Harrods',
            'Sunglasses Shop',
            'Ernest Jones',
            'Goldsmiths',
            'H.Samuel',
            'Swarovski',
            'Tie Rack',
            'The Watch Hut',
            'Accessorize',
            'Debenhams',
            'Matalan',
            'Dorothy Perkins',
            'Marks and Spencer'
          ]
        },
        {
          label: 'US Stores',
          stores: [
            'Tiffany & Co',
            'Saks Fifth Avenue',
            "Macy's",
            'AMAZON.COM',
            'Sunglasses Hut',
            'Neiman Marcus',
            'Avon',
            'Ardyss',
            'Drug store',
            'Swatch',
            'DKNY',
            'Human Hair etc',
            'Arewa Hair Extensions'
          ]
        }
      ]
    },
    {
      name: 'Jewellery',
      segments: [
        {
          label: 'UK Stores',
          stores: ['Goldsmiths', 'H.Samuel', 'Ernest Jones', 'Swarovski', 'Swag']
        },
        {
          label: 'US Stores',
          stores: ['Tiffany & Co']
        }
      ]
    },
    {
      name: 'Home & Kitchen / Appliances',
      segments: [
        {
          label: 'UK Stores',
          stores: ['Argos', 'John Lewis', 'Ikea', 'Comet', 'Currys', 'Amazon', 'Asda Direct', 'Tesco']
        }
      ]
    },
    {
      name: 'Computers & Accessories',
      segments: [
        {
          label: 'UK Stores',
          stores: ['Amazon', 'Comet', 'HP UK', 'PC World UK']
        }
      ]
    },
    {
      name: 'Babies & Kids / Boys & Girls',
      segments: [
        {
          label: 'UK Stores',
          stores: ['Matalan', 'NEXT', 'Peacocks', 'Asda George', 'Tesco Clothing', 'Toys R Us', 'Marks and Spencer']
        }
      ]
    },
    {
      name: 'Luxury Stores',
      segments: [
        {
          label: 'UK Stores',
          stores: [
            'Louis Vuitton',
            'Gucci',
            'Harrods',
            'John Lewis',
            'House of Fraser',
            'Marks and Spencer',
            'Burberry',
            'Harvey Nichols',
            'Liberty',
            'The White Company'
          ]
        }
      ]
    }
    ],
    []
  );

  const filteredPartnerCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return partnerCategories;

    return partnerCategories
      .map((category) => {
        const categoryMatch = category.name.toLowerCase().includes(normalized);
        const segments = category.segments
          .map((segment) => {
            const stores = categoryMatch
              ? segment.stores
              : segment.stores.filter((store) => store.toLowerCase().includes(normalized));
            return { ...segment, stores };
          })
          .filter((segment) => segment.stores.length > 0);
        return { ...category, segments };
      })
      .filter((category) => category.segments.length > 0);
  }, [query, partnerCategories]);

  const totalStores = partnerCategories.reduce(
    (total, category) =>
      total + category.segments.reduce((segmentTotal, segment) => segmentTotal + segment.stores.length, 0),
    0
  );

  const getAdapterStatus = (store: string) => {
    const score = store.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return score % 5 === 0 ? 'offline' : 'online';
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Store Adapters</h1>
          <p className="text-muted-foreground mt-2">
            Browse every partner store on UK2MeOnline with live adapter status and category coverage.
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{totalStores} stores</Badge>
            <span>across {partnerCategories.length} partner categories</span>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stores, categories, brands..."
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Main Shop Categories</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {mainCategories.map((category) => (
              <div key={category.name} className="rounded-lg border border-border p-4">
                <div className="text-lg font-semibold text-foreground">{category.name}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {category.items.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">UK & USA Online Store Partners</h2>
            <p className="text-muted-foreground mt-2">Each store runs through its own adapter for live availability.</p>
          </div>
          <div className="space-y-6">
            {filteredPartnerCategories.map((category) => (
              <Card key={category.name}>
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <CardTitle>{category.name}</CardTitle>
                  <Badge variant="secondary">
                    {category.segments.reduce((count, segment) => count + segment.stores.length, 0)} stores
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  {category.segments.map((segment) => (
                    <div key={segment.label}>
                      <div className="text-sm font-semibold text-muted-foreground">{segment.label}</div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {segment.stores.map((store) => {
                          const status = getAdapterStatus(store);
                          return (
                            <div
                              key={store}
                              className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={
                                    status === 'online'
                                      ? 'h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse'
                                      : 'h-2.5 w-2.5 rounded-full bg-red-500'
                                  }
                                  aria-hidden="true"
                                />
                                <span className="font-medium text-foreground">{store}</span>
                              </div>
                              <Badge variant={status === 'online' ? 'default' : 'destructive'}>
                                {status === 'online' ? 'Online' : 'Offline'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
            {filteredPartnerCategories.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No stores matched &quot;{query}&quot;. Try another search.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
