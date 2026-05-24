import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

const FAQS = [
  {
    q: 'What is UK2ME?',
    a: 'UK2ME is a personal shopping and delivery service that helps you buy products from UK online stores and have them shipped directly to your door in Nigeria. We handle everything — purchasing, customs, and delivery.'
  },
  {
    q: 'How does the ordering process work?',
    a: 'You paste a product link from any UK store (e.g. ASOS, Amazon UK, Zara), choose your size and colour, and add it to your cart. Once you\'re ready, we process the purchase on your behalf and ship it to Nigeria. See our "How to Place an Order" guide for a step-by-step walkthrough.'
  },
  {
    q: 'How are the two shipping legs handled?',
    a: 'There are two shipping stages: (1) From the UK store to our UK2ME warehouse in the United Kingdom, and (2) From our UK2ME warehouse to your address in Nigeria. You can track both legs from your My Account dashboard.'
  },
  {
    q: 'How long does delivery take?',
    a: 'UK store to UK2ME warehouse: 2–5 business days. UK2ME warehouse to Nigeria: 7–14 business days. Total estimated time is 2–3 weeks from order confirmation.'
  },
  {
    q: 'What currencies can I pay in?',
    a: 'We accept GBP (British Pounds), USD (US Dollars), and NGN (Nigerian Naira). Exchange rates are displayed in real time on the platform.'
  },
  {
    q: 'Can I order multiple items at once?',
    a: 'Yes. Add as many items as you like to your cart from different UK stores, then check out together. We consolidate your items at our UK warehouse before shipping to Nigeria, which can reduce your overall shipping cost.'
  },
  {
    q: 'What if the price of an item changes after I order?',
    a: 'We offer Price Protection. If the price drops between your order and purchase, you only pay the lower amount. We will notify you and refund the difference.'
  },
  {
    q: 'Can I return an item?',
    a: 'Returns are handled on a case-by-case basis. Contact support@uk2meonline.com within 48 hours of delivery with photos of the item and your order ID. We will work with you to resolve any issues.'
  },
  {
    q: 'What items are prohibited?',
    a: 'We cannot ship firearms, illegal substances, perishable food, live animals, or any items restricted by Nigerian customs. If we receive a prohibited item, we will contact you immediately.'
  },
  {
    q: 'How do I track my order?',
    a: 'Go to My Account → Orders to see real-time status updates for every stage of your delivery.'
  },
  {
    q: 'Is my payment secure?',
    a: 'Yes. All transactions are encrypted. We never store your card details on our servers.'
  },
  {
    q: 'How do I contact support?',
    a: 'Email us at support@uk2meonline.com or use the chat widget on the site. We respond within 24 hours on business days.'
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3">Frequently Asked Questions</h1>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about shopping with UK2ME.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="space-y-1">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border last:border-0">
                  <AccordionTrigger className="text-left font-medium py-4">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="mt-10 text-center">
          <p className="text-muted-foreground">
            Still have questions?{' '}
            <a href="mailto:support@uk2meonline.com" className="underline text-foreground">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
