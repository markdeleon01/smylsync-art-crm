import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
//mport { ProductsTable } from './products-table';
//import { getProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  return (
    <main className="p-4 md:p-6">
      <div className="mb-8 space-y-4">
        <h1 className="font-semibold text-lg md:text-2xl">
          ART - Admin Rescue Tool
        </h1>
        <p>Welcome to SMYLSYNC's Admin Rescue Tool!</p>
      </div>

      <div className="mb-8 space-y-4">
        <h2 className="font-semibold text-md md:text-lg">Navigation Menu</h2>
        <p className="text-sm text-muted-foreground">
          Use the navigation sidebar on the left to access the following
          sections:
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-2">Home</h3>
            <p className="text-sm text-muted-foreground">
              Access the main dashboard with an overview of key metrics and
              information.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-2">Patients</h3>
            <p className="text-sm text-muted-foreground">
              Manage patient records, view patient details, and update patient
              information.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-2">Schedules</h3>
            <p className="text-sm text-muted-foreground">
              View and manage appointment schedules, calendar events, and
              time-based operations.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-2">Claims</h3>
            <p className="text-sm text-muted-foreground">
              Process and track insurance claims, view claim status, and manage
              documentation.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-2">Credentialing</h3>
            <p className="text-sm text-muted-foreground">
              Manage professional credentials, licenses, and certifications for
              providers.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-2">Analytics</h3>
            <p className="text-sm text-muted-foreground">
              View detailed analytics, reports, and data visualizations on
              system performance. Admin users only.
            </p>
          </div>
        </div>
      </div>
      <div className="mb-8 space-y-4">
        <h2 className="font-semibold text-md md:text-lg">Internal Operations Assistant</h2>
        <p className="text-sm text-muted-foreground">
          Use the ART Live Agent on the bottom right to get help with admin
          tasks.
        </p>
      </div>
    </main>
  );
}
/*
export default async function ProductsPage(
  props: {
    searchParams: Promise<{ q: string; offset: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const search = searchParams.q ?? '';
  const offset = searchParams.offset ?? 0;
  const { products, newOffset, totalProducts } = await getProducts(
    search,
    Number(offset)
  );

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="archived" className="hidden sm:flex">
            Archived
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Product
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <ProductsTable
          products={products}
          offset={newOffset ?? 0}
          totalProducts={totalProducts}
        />
      </TabsContent>
    </Tabs>
  );
}
*/
