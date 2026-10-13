import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupees } from "../config/payments";
import type { PaymentPack } from "../types";

type PackListProps = {
  packs: readonly PaymentPack[];
  buyingPackId: string | undefined;
  onBuy: (packId: string) => void;
};

export function PackList({ packs, buyingPackId, onBuy }: PackListProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {packs.map((pack) => (
        <li key={pack.id}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{pack.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold">{formatRupees(pack.amount)}</p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                className="w-full"
                aria-label={buyingPackId === pack.id ? undefined : `Buy ${pack.label}`}
                disabled={buyingPackId !== undefined}
                onClick={() => onBuy(pack.id)}
              >
                {buyingPackId === pack.id ? "Opening payment" : "Buy"}
              </Button>
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  );
}
