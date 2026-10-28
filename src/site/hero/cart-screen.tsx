import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { SiteIcon } from "@/site/ui/site-icon";
import type { SiteIconName } from "@/site/ui/site-icon-paths";

const CART_ROWS = [
  {
    id: "shirt",
    icon: "shirt",
    tileClassName: "bg-shirt-bg text-shirt-ink",
    nameKey: "cart.shirt",
    detailKey: "cart.shirtDetail",
    priceKey: "cart.shirtPrice",
  },
  {
    id: "mug",
    icon: "mug",
    tileClassName: "bg-mug-bg text-mug-ink",
    nameKey: "cart.mug",
    detailKey: "cart.mugDetail",
    priceKey: "cart.mugPrice",
  },
] satisfies {
  id: string;
  icon: SiteIconName;
  tileClassName: string;
  nameKey: string;
  detailKey: string;
  priceKey: string;
}[];

const TOTAL_ROWS = [
  { id: "subtotal", labelKey: "cart.subtotal", amountKey: "cart.totalPrice" },
  { id: "shipping", labelKey: "cart.shipping", amountKey: "cart.shippingFree" },
  { id: "total", labelKey: "cart.total", amountKey: "cart.totalPrice" },
];

interface CartScreenProps {
  topInset: number;
  hasCouponOverflow: boolean;
}

export const CartScreen = ({
  topInset,
  hasCouponOverflow,
}: CartScreenProps): ReactElement => {
  const { t } = useTranslation();
  const visibleTotalRows = TOTAL_ROWS.filter((totalRow) => {
    const isShippingRow = totalRow.id === "shipping";
    return !(isShippingRow && hasCouponOverflow);
  });
  const couponRowClassName = hasCouponOverflow ? "w-[134px] flex-none" : "";
  const couponFieldClassName = hasCouponOverflow
    ? "w-[94px] flex-none"
    : "flex-1";

  return (
    <div
      className="flex h-full w-full flex-col bg-card px-2.5 pb-2.5"
      style={{ paddingTop: topInset }}
    >
      <div className="flex h-[18px] items-baseline justify-between">
        <span className="text-xs font-semibold">{t("cart.title")}</span>
        <span className="text-[8px] text-ink-3">{t("cart.count")}</span>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {CART_ROWS.map((cartRow) => (
          <div key={cartRow.id} className="flex h-7 items-center gap-1.5">
            <span
              className={`grid size-7 flex-none place-items-center rounded-md ${cartRow.tileClassName}`}
            >
              <SiteIcon name={cartRow.icon} size={16} strokeWidth={1.6} />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-[8.5px] font-medium">
                {t(cartRow.nameKey)}
              </span>
              <span className="text-[7.5px] text-ink-3">
                {t(cartRow.detailKey)}
              </span>
            </span>
            <span className="text-[8.5px] font-medium">
              {t(cartRow.priceKey)}
            </span>
          </div>
        ))}
      </div>
      <div className="my-2.5 h-px bg-line-soft" />
      <div className={`relative flex h-5 gap-1 ${couponRowClassName}`}>
        <span
          className={`flex items-center rounded-[5px] border border-line px-1.5 text-[7.5px] text-ink-3 ${couponFieldClassName}`}
        >
          {t("cart.coupon")}
        </span>
        <span className="relative flex items-center rounded-[5px] bg-ink px-2 text-[7.5px] font-medium text-card">
          {t("cart.apply")}
          <span
            aria-hidden="true"
            className="loop-tap absolute -inset-[5px] rounded-[9px] border-2 border-pink"
          />
        </span>
        {hasCouponOverflow && (
          <>
            <span
              aria-hidden="true"
              className="loop-outline absolute -inset-[3px] rounded-[7px] border-[1.5px] border-dashed border-amber bg-amber/10"
            />
            <span
              aria-hidden="true"
              className="loop-outline absolute -top-[22px] right-0 rounded-full bg-amber px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-ink"
            >
              {t("preview.overflowAmount")}
            </span>
          </>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-1 text-[8px] text-ink-2">
        {visibleTotalRows.map((totalRow) => {
          const isTotalRow = totalRow.id === "total";
          const weightClassName = isTotalRow
            ? "text-[9px] font-semibold text-ink"
            : "";
          return (
            <div
              key={totalRow.id}
              className={`flex justify-between ${weightClassName}`}
            >
              <span>{t(totalRow.labelKey)}</span>
              <span>{t(totalRow.amountKey)}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-auto flex h-[26px] items-center justify-center rounded-[7px] bg-ink text-[8.5px] font-medium text-card">
        {t("cart.pay")}
      </div>
    </div>
  );
};
