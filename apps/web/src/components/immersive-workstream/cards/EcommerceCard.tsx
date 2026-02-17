import type { CSSProperties } from "react";
import { PointerProvider } from "@ewjdev/anyclick-pointer";
import { AnyclickProvider, type ContextMenuItem } from "@ewjdev/anyclick-react";
import { adapter } from "../adapter";

interface EcommerceCardProps {
  menuStyle: CSSProperties;
  orderMenuItems: ContextMenuItem[];
  pointerCircleColor: string;
  pointerColor: string;
  pointerIcon: React.ReactNode;
  pricingMenuItems: ContextMenuItem[];
  primaryColor: string;
  productMenuItems: ContextMenuItem[];
  stockMenuItems: ContextMenuItem[];
}

interface ExampleOrder {
  customer: string;
  discount: string;
  fulfillment: string;
  id: string;
  originalPrice: string;
  price: string;
  productDescription: string;
  productName: string;
  shippingStatus: string;
  stockLabel: string;
}

const EXAMPLE_ORDERS: ExampleOrder[] = [
  {
    id: "ORD-20481",
    customer: "Alex P.",
    productName: "Trail Running Jacket",
    productDescription: "Weatherproof shell, matte black, size M",
    price: "$49.99",
    originalPrice: "$59.99",
    discount: "17% off",
    stockLabel: "In Stock",
    fulfillment: "Packed in WH-West",
    shippingStatus: "Label printed",
  },
  {
    id: "ORD-20482",
    customer: "Jordan R.",
    productName: "Performance Cargo Pack",
    productDescription: "34L day pack, ember orange",
    price: "$89.00",
    originalPrice: "$89.00",
    discount: "No active discount",
    stockLabel: "Low Stock",
    fulfillment: "Pick in progress",
    shippingStatus: "Carrier pending",
  },
  {
    id: "ORD-20483",
    customer: "Casey L.",
    productName: "Hydro Grip Bottle",
    productDescription: "24oz steel bottle, glacier blue",
    price: "$28.50",
    originalPrice: "$35.00",
    discount: "Promo bundle",
    stockLabel: "Backorder",
    fulfillment: "Supplier transfer",
    shippingStatus: "ETA Feb 23",
  },
];

function stockToneClass(stockLabel: string): string {
  if (stockLabel === "In Stock") {
    return "border-green-400/40 bg-green-500/15 text-green-300";
  }

  if (stockLabel === "Low Stock") {
    return "border-amber-400/40 bg-amber-500/15 text-amber-200";
  }

  return "border-rose-400/40 bg-rose-500/15 text-rose-200";
}

export function EcommerceCard({
  menuStyle,
  orderMenuItems,
  pointerCircleColor,
  pointerColor,
  pointerIcon,
  pricingMenuItems,
  primaryColor,
  productMenuItems,
  stockMenuItems,
}: EcommerceCardProps) {
  const providerTheme = {
    menuStyle,
    highlightConfig: {
      enabled: true,
      colors: {
        targetColor: primaryColor,
        containerColor: `${primaryColor}40`,
      },
    },
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div
        className="rounded-2xl p-5 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.04))",
          border: "1px solid rgba(245, 158, 11, 0.26)",
          boxShadow:
            "0 10px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/70">
              Live Order Board
            </p>
            <h3 className="text-lg font-semibold text-amber-100">
              Product, price, and stock workflows
            </h3>
          </div>
          <div className="rounded border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-100">
            3 active orders
          </div>
        </div>

        <div className="space-y-3">
          {EXAMPLE_ORDERS.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-amber-200/15 bg-black/25 p-3"
              data-order-id={order.id}
            >
              <div className="flex items-start justify-between gap-3">
                <AnyclickProvider
                  adapter={adapter}
                  menuItems={productMenuItems}
                  metadata={{ workstream: "ecommerce", zone: "product" }}
                  theme={providerTheme}
                  header={<></>}
                  scoped
                >
                  <PointerProvider
                    theme={{
                      colors: {
                        pointerColor,
                        circleColor: pointerCircleColor,
                      },
                      pointerIcon,
                    }}
                  >
                    <div
                      className="flex min-w-0 flex-1 items-start gap-3 rounded-md border border-transparent p-1 transition-colors hover:border-amber-200/20"
                      data-workflow-zone="product"
                      data-order-id={order.id}
                    >
                      <div
                        className="h-14 w-14 shrink-0 rounded-lg"
                        style={{
                          background:
                            "linear-gradient(140deg, rgba(245, 158, 11, 0.38), rgba(249, 115, 22, 0.22))",
                        }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-amber-50">
                          {order.productName}
                        </p>
                        <p className="mt-1 truncate text-xs text-amber-100/70">
                          {order.productDescription}
                        </p>
                        <p className="mt-2 text-[11px] text-amber-200/60">
                          Right-click to edit details or upload media
                        </p>
                      </div>
                    </div>
                  </PointerProvider>
                </AnyclickProvider>

                <div className="flex items-start gap-2">
                  <AnyclickProvider
                    adapter={adapter}
                    menuItems={pricingMenuItems}
                    metadata={{ workstream: "ecommerce", zone: "pricing" }}
                    theme={providerTheme}
                    header={<></>}
                    scoped
                  >
                    <PointerProvider
                      theme={{
                        colors: {
                          pointerColor,
                          circleColor: pointerCircleColor,
                        },
                        pointerIcon,
                      }}
                    >
                      <div
                        className="rounded-md border border-transparent px-2 py-1 text-right transition-colors hover:border-amber-200/20"
                        data-workflow-zone="pricing"
                        data-order-id={order.id}
                      >
                        <p className="text-sm font-semibold text-amber-300">
                          {order.price}
                        </p>
                        <p className="text-[11px] text-amber-200/65 line-through">
                          {order.originalPrice}
                        </p>
                        <p className="mt-1 text-[11px] text-amber-200/75">
                          {order.discount}
                        </p>
                      </div>
                    </PointerProvider>
                  </AnyclickProvider>

                  <AnyclickProvider
                    adapter={adapter}
                    menuItems={stockMenuItems}
                    metadata={{ workstream: "ecommerce", zone: "stock" }}
                    theme={providerTheme}
                    header={<></>}
                    scoped
                  >
                    <PointerProvider
                      theme={{
                        colors: {
                          pointerColor,
                          circleColor: pointerCircleColor,
                        },
                        pointerIcon,
                      }}
                    >
                      <div
                        className="rounded-md border border-transparent p-1 transition-colors hover:border-amber-200/20"
                        data-workflow-zone="stock"
                        data-order-id={order.id}
                      >
                        <span
                          className={`inline-flex rounded border px-2 py-1 text-[10px] font-medium ${stockToneClass(order.stockLabel)}`}
                        >
                          {order.stockLabel}
                        </span>
                      </div>
                    </PointerProvider>
                  </AnyclickProvider>
                </div>
              </div>

              <AnyclickProvider
                adapter={adapter}
                menuItems={orderMenuItems}
                metadata={{ workstream: "ecommerce", zone: "order" }}
                theme={providerTheme}
                header={<></>}
                scoped
              >
                <PointerProvider
                  theme={{
                    colors: {
                      pointerColor,
                      circleColor: pointerCircleColor,
                    },
                    pointerIcon,
                  }}
                >
                  <div
                    className="mt-3 rounded-md border border-transparent p-1 transition-colors hover:border-amber-200/20"
                    data-workflow-zone="order"
                    data-order-id={order.id}
                  >
                    <div className="grid gap-2 text-[11px] text-amber-50/75 md:grid-cols-3">
                      <div>
                        <span className="text-amber-200/60">Order</span>
                        <p>{order.id}</p>
                      </div>
                      <div>
                        <span className="text-amber-200/60">Customer</span>
                        <p>{order.customer}</p>
                      </div>
                      <div>
                        <span className="text-amber-200/60">Status</span>
                        <p>{order.fulfillment}</p>
                      </div>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-900/30">
                      <div
                        className="h-full rounded-full bg-amber-400/80"
                        style={{
                          width:
                            order.stockLabel === "In Stock"
                              ? "82%"
                              : order.stockLabel === "Low Stock"
                                ? "46%"
                                : "24%",
                        }}
                      />
                    </div>

                    <p className="mt-1 text-[11px] text-amber-100/60">
                      {order.shippingStatus}
                    </p>
                  </div>
                </PointerProvider>
              </AnyclickProvider>
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute -inset-5 -z-10 rounded-3xl opacity-35 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(245, 158, 11, 0.45), transparent 72%)",
        }}
      />
    </div>
  );
}
